import { Resolver, Query, Mutation, Arg, ID, Float, Int } from 'type-graphql';
import { Product } from '../../db/mongo';
import { InventoryService } from '../../services/inventory_service';

@Resolver()
export class ProductResolver {
  @Query(() => [Product])
  async products(
    @Arg('vendorId', { nullable: true }) vendorId?: string,
    @Arg('category', { nullable: true }) category?: string,
    @Arg('search', { nullable: true }) search?: string,
    @Arg('inStock', { nullable: true }) inStock?: boolean
  ): Promise<any[]> {
    try {
      const filter = {
        vendorId,
        category,
        search,
        inStock,
      };

      return await InventoryService.searchProducts(filter);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  @Query(() => Product, { nullable: true })
  async product(@Arg('id', () => ID) id: string): Promise<any> {
    try {
      return await InventoryService.getProductById(id);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw new Error('Product not found');
    }
  }

  @Query(() => [Product])
  async vendorProducts(@Arg('vendorId', () => ID) vendorId: string): Promise<any[]> {
    try {
      return await InventoryService.getVendorProducts(vendorId);
    } catch (error) {
      console.error('Failed to fetch vendor products:', error);
      throw new Error('Failed to fetch vendor products');
    }
  }

  @Query(() => [Product])
  async productsByCategory(
    @Arg('category') category: string,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number
  ): Promise<any[]> {
    try {
      return await InventoryService.getProductsByCategory(category, limit);
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      throw new Error('Failed to fetch products by category');
    }
  }

  @Mutation(() => Product)
  async createProduct(
    @Arg('vendorId', () => ID) vendorId: string,
    @Arg('name') name: string,
    @Arg('description', { nullable: true }) description: string,
    @Arg('basePrice', () => Float) basePrice: number,
    @Arg('stock', () => Int) stock: number,
    @Arg('category') category: string,
    @Arg('images', () => [String], { nullable: true }) images?: string[]
  ): Promise<any> {
    try {
      const productData = {
        name,
        description,
        basePrice,
        stock,
        category,
        images,
      };

      return await InventoryService.addProduct(vendorId, productData);
    } catch (error) {
      console.error('Failed to create product:', error);
      throw new Error('Failed to create product');
    }
  }

  @Mutation(() => Product)
  async updateProduct(
    @Arg('id', () => ID) id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('basePrice', () => Float, { nullable: true }) basePrice?: number,
    @Arg('stock', () => Int, { nullable: true }) stock?: number,
    @Arg('category', { nullable: true }) category?: string,
    @Arg('images', () => [String], { nullable: true }) images?: string[]
  ): Promise<any> {
    try {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (basePrice !== undefined) updates.basePrice = basePrice;
      if (stock !== undefined) updates.stock = stock;
      if (category !== undefined) updates.category = category;
      if (images !== undefined) updates.images = images;

      return await InventoryService.updateProduct(id, updates);
    } catch (error) {
      console.error('Failed to update product:', error);
      throw new Error('Failed to update product');
    }
  }

  @Mutation(() => Product)
  async updateProductStock(
    @Arg('id', () => ID) id: string,
    @Arg('quantity', () => Int) quantity: number,
    @Arg('operation', { defaultValue: 'set' }) operation: 'add' | 'subtract' | 'set'
  ): Promise<any> {
    try {
      return await InventoryService.updateProductStock(id, quantity, operation);
    } catch (error) {
      console.error('Failed to update product stock:', error);
      throw new Error('Failed to update product stock');
    }
  }

  @Mutation(() => Boolean)
  async deleteProduct(@Arg('id', () => ID) id: string): Promise<boolean> {
    try {
      return await InventoryService.deleteProduct(id);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw new Error('Failed to delete product');
    }
  }

  @Query(() => [Product])
  async lowStockProducts(
    @Arg('vendorId', () => ID) vendorId: string,
    @Arg('threshold', () => Int, { defaultValue: 5 }) threshold: number
  ): Promise<any[]> {
    try {
      return await InventoryService.getLowStockProducts(vendorId, threshold);
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      throw new Error('Failed to fetch low stock products');
    }
  }

  @Query(() => [Product])
  async outOfStockProducts(@Arg('vendorId', () => ID) vendorId: string): Promise<any[]> {
    try {
      return await InventoryService.getOutOfStockProducts(vendorId);
    } catch (error) {
      console.error('Failed to fetch out of stock products:', error);
      throw new Error('Failed to fetch out of stock products');
    }
  }
}