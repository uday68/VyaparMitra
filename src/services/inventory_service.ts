import { Product, Vendor } from '../db/mongo';
import { Types } from 'mongoose';

export interface ProductData {
  name: string;
  description?: string;
  basePrice: number;
  stock: number;
  category: string;
  images?: string[];
}

export interface ProductFilter {
  vendorId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface StockUpdate {
  productId: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}

export class InventoryService {
  static async addProduct(vendorId: string, productData: ProductData): Promise<any> {
    try {
      // Verify vendor exists
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Create new product
      const product = new Product({
        vendorId: new Types.ObjectId(vendorId),
        ...productData,
      });

      await product.save();
      
      console.log(`✅ Product added: ${product.name} for vendor: ${vendorId}`);
      return product;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }

  static async updateProduct(productId: string, updates: Partial<ProductData>): Promise<any> {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      console.log(`✅ Product updated: ${productId}`);
      return product;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  static async updateProductStock(productId: string, quantity: number, operation: 'add' | 'subtract' | 'set' = 'set'): Promise<any> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let newStock: number;
      switch (operation) {
        case 'add':
          newStock = product.stock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, product.stock - quantity);
          break;
        case 'set':
        default:
          newStock = Math.max(0, quantity);
          break;
      }

      product.stock = newStock;
      await product.save();

      console.log(`✅ Stock updated for product ${productId}: ${product.stock} → ${newStock}`);
      return product;
    } catch (error) {
      console.error('Failed to update product stock:', error);
      throw error;
    }
  }

  static async getVendorProducts(vendorId: string, filter?: ProductFilter): Promise<any[]> {
    try {
      let query: any = { vendorId: new Types.ObjectId(vendorId) };

      // Apply filters
      if (filter) {
        if (filter.category) {
          query.category = filter.category;
        }
        
        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
          query.basePrice = {};
          if (filter.minPrice !== undefined) {
            query.basePrice.$gte = filter.minPrice;
          }
          if (filter.maxPrice !== undefined) {
            query.basePrice.$lte = filter.maxPrice;
          }
        }

        if (filter.inStock) {
          query.stock = { $gt: 0 };
        }

        if (filter.search) {
          query.$or = [
            { name: { $regex: filter.search, $options: 'i' } },
            { description: { $regex: filter.search, $options: 'i' } },
          ];
        }
      }

      const products = await Product.find(query).sort({ createdAt: -1 });
      return products;
    } catch (error) {
      console.error('Failed to get vendor products:', error);
      throw error;
    }
  }

  static async getProductById(productId: string): Promise<any> {
    try {
      const product = await Product.findById(productId).populate('vendorId');
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      console.error('Failed to get product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      const result = await Product.findByIdAndDelete(productId);
      if (!result) {
        throw new Error('Product not found');
      }

      console.log(`✅ Product deleted: ${productId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }

  static async searchProducts(filter: ProductFilter): Promise<any[]> {
    try {
      let query: any = {};

      if (filter.vendorId) {
        query.vendorId = new Types.ObjectId(filter.vendorId);
      }

      if (filter.category) {
        query.category = filter.category;
      }

      if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
        query.basePrice = {};
        if (filter.minPrice !== undefined) {
          query.basePrice.$gte = filter.minPrice;
        }
        if (filter.maxPrice !== undefined) {
          query.basePrice.$lte = filter.maxPrice;
        }
      }

      if (filter.inStock) {
        query.stock = { $gt: 0 };
      }

      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { category: { $regex: filter.search, $options: 'i' } },
        ];
      }

      const products = await Product.find(query)
        .populate('vendorId')
        .sort({ createdAt: -1 })
        .limit(50); // Limit results for performance

      return products;
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  static async getProductsByCategory(category: string, limit: number = 20): Promise<any[]> {
    try {
      const products = await Product.find({ 
        category,
        stock: { $gt: 0 } // Only in-stock products
      })
        .populate('vendorId')
        .sort({ createdAt: -1 })
        .limit(limit);

      return products;
    } catch (error) {
      console.error('Failed to get products by category:', error);
      throw error;
    }
  }

  static async getLowStockProducts(vendorId: string, threshold: number = 5): Promise<any[]> {
    try {
      const products = await Product.find({
        vendorId: new Types.ObjectId(vendorId),
        stock: { $lte: threshold, $gt: 0 }
      }).sort({ stock: 1 });

      return products;
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      throw error;
    }
  }

  static async getOutOfStockProducts(vendorId: string): Promise<any[]> {
    try {
      const products = await Product.find({
        vendorId: new Types.ObjectId(vendorId),
        stock: 0
      }).sort({ createdAt: -1 });

      return products;
    } catch (error) {
      console.error('Failed to get out of stock products:', error);
      throw error;
    }
  }

  // Batch operations
  static async batchUpdateStock(updates: StockUpdate[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const updatePromises = updates.map(async (update) => {
      try {
        await this.updateProductStock(update.productId, update.quantity, update.operation);
        success++;
      } catch (error) {
        console.error(`Failed to update stock for product ${update.productId}:`, error);
        failed++;
      }
    });

    await Promise.allSettled(updatePromises);

    console.log(`✅ Batch stock update completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  // Inventory analytics
  static async getInventoryStats(vendorId: string): Promise<{
    totalProducts: number;
    totalValue: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    categories: { [key: string]: number };
  }> {
    try {
      const products = await Product.find({ vendorId: new Types.ObjectId(vendorId) });

      const stats = {
        totalProducts: products.length,
        totalValue: 0,
        inStockProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        categories: {} as { [key: string]: number },
      };

      products.forEach((product: any) => {
        stats.totalValue += product.basePrice * product.stock;
        
        if (product.stock > 5) {
          stats.inStockProducts++;
        } else if (product.stock > 0) {
          stats.lowStockProducts++;
        } else {
          stats.outOfStockProducts++;
        }

        stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      throw error;
    }
  }
}