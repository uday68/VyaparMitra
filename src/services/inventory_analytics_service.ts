import { logger } from '../utils/logger';
import { pool } from '../db/postgres';
import { getRedisClient } from '../db/redis';

interface InventoryAnalytics {
  totalProducts: number;
  totalValue: number;
  lowStockAlerts: number;
  fastMovingItems: Array<{
    productId: string;
    name: string;
    category: string;
    salesVelocity: number;
    stockLevel: number;
    daysUntilStockout: number;
  }>;
  slowMovingItems: Array<{
    productId: string;
    name: string;
    category: string;
    daysSinceLastSale: number;
    stockLevel: number;
    recommendedAction: string;
  }>;
  categoryPerformance: Array<{
    category: string;
    totalSales: number;
    averageMargin: number;
    turnoverRate: number;
  }>;
  reorderRecommendations: Array<{
    productId: string;
    name: string;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'high' | 'medium' | 'low';
  }>;
}

interface StockMovement {
  date: string;
  productId: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  reason?: string;
}

interface ProfitabilityAnalysis {
  productId: string;
  name: string;
  category: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  roi: number;
  salesCount: number;
}

export class InventoryAnalyticsService {
  private static readonly CACHE_TTL = 900; // 15 minutes
  private static readonly LOW_STOCK_THRESHOLD = 10;
  private static readonly SLOW_MOVING_DAYS = 30;

  /**
   * Get comprehensive inventory analytics for a vendor
   */
  static async getInventoryAnalytics(vendorId: string): Promise<InventoryAnalytics> {
    try {
      const cacheKey = `inventory_analytics:${vendorId}`;
      const redis = getRedisClient();
      
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Inventory analytics served from cache', { vendorId });
        return JSON.parse(cached);
      }

      const [
        basicStats,
        fastMovingItems,
        slowMovingItems,
        categoryPerformance,
        reorderRecommendations
      ] = await Promise.all([
        this.getBasicInventoryStats(vendorId),
        this.getFastMovingItems(vendorId),
        this.getSlowMovingItems(vendorId),
        this.getCategoryPerformance(vendorId),
        this.getReorderRecommendations(vendorId)
      ]);

      const analytics: InventoryAnalytics = {
        ...basicStats,
        fastMovingItems,
        slowMovingItems,
        categoryPerformance,
        reorderRecommendations
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      
      logger.info('Inventory analytics generated', {
        vendorId,
        totalProducts: analytics.totalProducts,
        lowStockAlerts: analytics.lowStockAlerts
      });

      return analytics;
    } catch (error) {
      logger.error('Inventory analytics generation failed', { error, vendorId });
      throw new Error('Failed to generate inventory analytics');
    }
  }

  /**
   * Get basic inventory statistics
   */
  private static async getBasicInventoryStats(vendorId: string): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockAlerts: number;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          SUM(price * stock_quantity) as total_value,
          COUNT(CASE WHEN stock_quantity <= $2 THEN 1 END) as low_stock_alerts
        FROM products
        WHERE vendor_id = $1
        AND is_active = true
      `;
      
      const result = await client.query(query, [vendorId, this.LOW_STOCK_THRESHOLD]);
      const row = result.rows[0];
      
      return {
        totalProducts: parseInt(row.total_products || '0'),
        totalValue: parseFloat(row.total_value || '0'),
        lowStockAlerts: parseInt(row.low_stock_alerts || '0')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Identify fast-moving items based on sales velocity
   */
  private static async getFastMovingItems(vendorId: string): Promise<Array<{
    productId: string;
    name: string;
    category: string;
    salesVelocity: number;
    stockLevel: number;
    daysUntilStockout: number;
  }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name,
          p.category,
          p.stock_quantity as stock_level,
          COALESCE(sales_data.sales_velocity, 0) as sales_velocity,
          CASE 
            WHEN COALESCE(sales_data.sales_velocity, 0) > 0 
            THEN ROUND(p.stock_quantity / sales_data.sales_velocity)
            ELSE 999
          END as days_until_stockout
        FROM products p
        LEFT JOIN (
          SELECT 
            n.product_id,
            COUNT(*) / 30.0 as sales_velocity
          FROM negotiations n
          JOIN orders o ON n.id = o.negotiation_id
          WHERE n.created_at >= NOW() - INTERVAL '30 days'
          AND n.status = 'completed'
          GROUP BY n.product_id
        ) sales_data ON p.id = sales_data.product_id
        WHERE p.vendor_id = $1
        AND p.is_active = true
        AND COALESCE(sales_data.sales_velocity, 0) > 0.5
        ORDER BY sales_data.sales_velocity DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, [vendorId]);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        category: row.category,
        salesVelocity: parseFloat(row.sales_velocity),
        stockLevel: parseInt(row.stock_level),
        daysUntilStockout: parseInt(row.days_until_stockout)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Identify slow-moving items
   */
  private static async getSlowMovingItems(vendorId: string): Promise<Array<{
    productId: string;
    name: string;
    category: string;
    daysSinceLastSale: number;
    stockLevel: number;
    recommendedAction: string;
  }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name,
          p.category,
          p.stock_quantity as stock_level,
          COALESCE(
            EXTRACT(DAY FROM NOW() - MAX(n.created_at)),
            EXTRACT(DAY FROM NOW() - p.created_at)
          ) as days_since_last_sale
        FROM products p
        LEFT JOIN negotiations n ON p.id = n.product_id AND n.status = 'completed'
        WHERE p.vendor_id = $1
        AND p.is_active = true
        GROUP BY p.id, p.name, p.category, p.stock_quantity, p.created_at
        HAVING COALESCE(
          EXTRACT(DAY FROM NOW() - MAX(n.created_at)),
          EXTRACT(DAY FROM NOW() - p.created_at)
        ) >= $2
        ORDER BY days_since_last_sale DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, [vendorId, this.SLOW_MOVING_DAYS]);
      
      return result.rows.map(row => {
        const daysSinceLastSale = parseInt(row.days_since_last_sale);
        let recommendedAction: string;
        
        if (daysSinceLastSale > 90) {
          recommendedAction = 'Consider clearance sale or discontinuation';
        } else if (daysSinceLastSale > 60) {
          recommendedAction = 'Reduce price or bundle with fast-moving items';
        } else {
          recommendedAction = 'Review marketing strategy or product positioning';
        }
        
        return {
          productId: row.product_id,
          name: row.name,
          category: row.category,
          daysSinceLastSale,
          stockLevel: parseInt(row.stock_level),
          recommendedAction
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Analyze category performance
   */
  private static async getCategoryPerformance(vendorId: string): Promise<Array<{
    category: string;
    totalSales: number;
    averageMargin: number;
    turnoverRate: number;
  }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.category,
          COUNT(o.id) as total_sales,
          AVG((n.final_price - p.cost_price) / p.cost_price * 100) as average_margin,
          COUNT(o.id) / COUNT(DISTINCT p.id) as turnover_rate
        FROM products p
        LEFT JOIN negotiations n ON p.id = n.product_id AND n.status = 'completed'
        LEFT JOIN orders o ON n.id = o.negotiation_id
        WHERE p.vendor_id = $1
        AND p.is_active = true
        AND n.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY p.category
        HAVING COUNT(o.id) > 0
        ORDER BY total_sales DESC
      `;
      
      const result = await client.query(query, [vendorId]);
      
      return result.rows.map(row => ({
        category: row.category,
        totalSales: parseInt(row.total_sales || '0'),
        averageMargin: parseFloat(row.average_margin || '0'),
        turnoverRate: parseFloat(row.turnover_rate || '0')
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Generate reorder recommendations
   */
  private static async getReorderRecommendations(vendorId: string): Promise<Array<{
    productId: string;
    name: string;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'high' | 'medium' | 'low';
  }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name,
          p.stock_quantity as current_stock,
          p.reorder_level,
          COALESCE(sales_data.avg_daily_sales, 0) as avg_daily_sales,
          p.lead_time_days
        FROM products p
        LEFT JOIN (
          SELECT 
            n.product_id,
            COUNT(*) / 30.0 as avg_daily_sales
          FROM negotiations n
          JOIN orders o ON n.id = o.negotiation_id
          WHERE n.created_at >= NOW() - INTERVAL '30 days'
          AND n.status = 'completed'
          GROUP BY n.product_id
        ) sales_data ON p.id = sales_data.product_id
        WHERE p.vendor_id = $1
        AND p.is_active = true
        AND (
          p.stock_quantity <= p.reorder_level
          OR (
            COALESCE(sales_data.avg_daily_sales, 0) > 0
            AND p.stock_quantity <= (sales_data.avg_daily_sales * (p.lead_time_days + 7))
          )
        )
        ORDER BY 
          CASE 
            WHEN p.stock_quantity <= p.reorder_level * 0.5 THEN 1
            WHEN p.stock_quantity <= p.reorder_level THEN 2
            ELSE 3
          END,
          sales_data.avg_daily_sales DESC
        LIMIT 15
      `;
      
      const result = await client.query(query, [vendorId]);
      
      return result.rows.map(row => {
        const currentStock = parseInt(row.current_stock);
        const reorderLevel = parseInt(row.reorder_level || '10');
        const avgDailySales = parseFloat(row.avg_daily_sales || '0');
        const leadTimeDays = parseInt(row.lead_time_days || '7');
        
        // Calculate recommended order quantity
        const safetyStock = Math.ceil(avgDailySales * 7); // 1 week safety stock
        const leadTimeStock = Math.ceil(avgDailySales * leadTimeDays);
        const recommendedOrder = Math.max(
          reorderLevel - currentStock + safetyStock + leadTimeStock,
          0
        );
        
        // Determine urgency
        let urgency: 'high' | 'medium' | 'low';
        if (currentStock <= reorderLevel * 0.3) {
          urgency = 'high';
        } else if (currentStock <= reorderLevel * 0.7) {
          urgency = 'medium';
        } else {
          urgency = 'low';
        }
        
        return {
          productId: row.product_id,
          name: row.name,
          currentStock,
          recommendedOrder,
          urgency
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Track stock movements for audit and analysis
   */
  static async trackStockMovement(movement: StockMovement): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert stock movement record
      const insertQuery = `
        INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertQuery, [
        movement.productId,
        movement.type,
        movement.quantity,
        movement.reason || null,
        new Date(movement.date)
      ]);
      
      // Update product stock quantity
      if (movement.type === 'sale') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [movement.quantity, movement.productId]
        );
      } else if (movement.type === 'purchase') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [movement.quantity, movement.productId]
        );
      } else if (movement.type === 'adjustment') {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [movement.quantity, movement.productId] // Can be negative for adjustments
        );
      }
      
      await client.query('COMMIT');
      
      logger.info('Stock movement tracked', {
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Stock movement tracking failed', { error, movement });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get profitability analysis for products
   */
  static async getProfitabilityAnalysis(vendorId: string, days: number = 90): Promise<ProfitabilityAnalysis[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name,
          p.category,
          COALESCE(SUM(n.final_price), 0) as total_revenue,
          COALESCE(SUM(p.cost_price), 0) as total_cost,
          COALESCE(SUM(n.final_price - p.cost_price), 0) as gross_profit,
          CASE 
            WHEN SUM(n.final_price) > 0 
            THEN (SUM(n.final_price - p.cost_price) / SUM(n.final_price)) * 100
            ELSE 0
          END as profit_margin,
          CASE 
            WHEN SUM(p.cost_price) > 0 
            THEN (SUM(n.final_price - p.cost_price) / SUM(p.cost_price)) * 100
            ELSE 0
          END as roi,
          COUNT(o.id) as sales_count
        FROM products p
        LEFT JOIN negotiations n ON p.id = n.product_id AND n.status = 'completed'
        LEFT JOIN orders o ON n.id = o.negotiation_id
        WHERE p.vendor_id = $1
        AND p.is_active = true
        AND (n.created_at >= NOW() - INTERVAL '${days} days' OR n.created_at IS NULL)
        GROUP BY p.id, p.name, p.category
        ORDER BY gross_profit DESC
      `;
      
      const result = await client.query(query, [vendorId]);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        category: row.category,
        totalRevenue: parseFloat(row.total_revenue || '0'),
        totalCost: parseFloat(row.total_cost || '0'),
        grossProfit: parseFloat(row.gross_profit || '0'),
        profitMargin: parseFloat(row.profit_margin || '0'),
        roi: parseFloat(row.roi || '0'),
        salesCount: parseInt(row.sales_count || '0')
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Generate inventory alerts
   */
  static async generateInventoryAlerts(vendorId: string): Promise<Array<{
    type: 'low_stock' | 'overstock' | 'no_sales' | 'high_demand';
    productId: string;
    productName: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    actionRequired: string;
  }>> {
    const client = await pool.connect();
    const alerts: Array<any> = [];
    
    try {
      // Low stock alerts
      const lowStockQuery = `
        SELECT id, name, stock_quantity, reorder_level
        FROM products
        WHERE vendor_id = $1
        AND is_active = true
        AND stock_quantity <= reorder_level
      `;
      
      const lowStockResult = await client.query(lowStockQuery, [vendorId]);
      
      lowStockResult.rows.forEach(row => {
        const severity = row.stock_quantity <= row.reorder_level * 0.3 ? 'high' : 'medium';
        alerts.push({
          type: 'low_stock',
          productId: row.id,
          productName: row.name,
          message: `Stock level is ${row.stock_quantity}, below reorder level of ${row.reorder_level}`,
          severity,
          actionRequired: 'Reorder inventory immediately'
        });
      });
      
      // High demand alerts
      const highDemandQuery = `
        SELECT 
          p.id,
          p.name,
          COUNT(n.id) as recent_negotiations
        FROM products p
        JOIN negotiations n ON p.id = n.product_id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY p.id, p.name
        HAVING COUNT(n.id) >= 5
      `;
      
      const highDemandResult = await client.query(highDemandQuery, [vendorId]);
      
      highDemandResult.rows.forEach(row => {
        alerts.push({
          type: 'high_demand',
          productId: row.id,
          productName: row.name,
          message: `High demand detected: ${row.recent_negotiations} negotiations in last 7 days`,
          severity: 'medium',
          actionRequired: 'Consider increasing stock levels and pricing'
        });
      });
      
      return alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } finally {
      client.release();
    }
  }
}