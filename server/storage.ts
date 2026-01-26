import { db } from "./db";
import {
  products,
  negotiations,
  type Product,
  type InsertProduct,
  type Negotiation,
  type InsertNegotiation,
  type NegotiationWithProduct
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Negotiations
  createNegotiation(negotiation: InsertNegotiation): Promise<Negotiation>;
  getNegotiation(id: number): Promise<NegotiationWithProduct | undefined>;
  getNegotiations(): Promise<NegotiationWithProduct[]>;
  updateNegotiationStatus(id: number, status: string, finalPrice?: number): Promise<Negotiation | undefined>;
}

export class DatabaseStorage implements IStorage {
  // === PRODUCTS ===
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.active, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  // === NEGOTIATIONS ===
  async createNegotiation(insertNegotiation: InsertNegotiation): Promise<Negotiation> {
    const [negotiation] = await db.insert(negotiations).values(insertNegotiation).returning();
    return negotiation;
  }

  async getNegotiation(id: number): Promise<NegotiationWithProduct | undefined> {
    const result = await db
      .select({
        negotiation: negotiations,
        product: products,
      })
      .from(negotiations)
      .innerJoin(products, eq(negotiations.productId, products.id))
      .where(eq(negotiations.id, id));

    if (result.length === 0) return undefined;

    return {
      ...result[0].negotiation,
      product: result[0].product,
    };
  }

  async getNegotiations(): Promise<NegotiationWithProduct[]> {
    const results = await db
      .select({
        negotiation: negotiations,
        product: products,
      })
      .from(negotiations)
      .innerJoin(products, eq(negotiations.productId, products.id))
      .orderBy(desc(negotiations.createdAt));

    return results.map((r) => ({
      ...r.negotiation,
      product: r.product,
    }));
  }

  async updateNegotiationStatus(id: number, status: string, finalPrice?: number): Promise<Negotiation | undefined> {
    const [updated] = await db
      .update(negotiations)
      .set({ 
        status, 
        finalPrice: finalPrice ? finalPrice.toString() : undefined,
        updatedAt: new Date()
      })
      .where(eq(negotiations.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
