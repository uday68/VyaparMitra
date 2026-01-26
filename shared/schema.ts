import { pgTable, text, serial, integer, boolean, timestamp, numeric, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// Export chat models from the integration
export * from "./models/chat";
import { conversations } from "./models/chat";

// === PRODUCTS === (matching 001_initial_schema.sql)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendor_id: uuid("vendor_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  base_price: numeric("base_price").notNull(),
  unit: text("unit").notNull().default("kg"),
  stock_quantity: integer("stock_quantity").notNull().default(0),
  min_order_quantity: integer("min_order_quantity").default(1),
  max_order_quantity: integer("max_order_quantity"),
  is_negotiable: boolean("is_negotiable").default(true),
  is_active: boolean("is_active").default(true),
  images: text("images").default("[]"), // JSONB as text for simplicity
  specifications: text("specifications").default("{}"),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// === NEGOTIATIONS === (matching 001_initial_schema.sql)
export const negotiations = pgTable("negotiations", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendor_id: uuid("vendor_id").notNull(),
  customer_id: uuid("customer_id").notNull(),
  product_id: uuid("product_id").notNull(),
  status: text("status").notNull().default("OPEN"),
  quantity: integer("quantity").notNull().default(1),
  initial_price: numeric("initial_price"),
  final_price: numeric("final_price"),
  expires_at: timestamp("expires_at").default(sql`NOW() + INTERVAL '24 hours'`),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  negotiations: many(negotiations),
}));

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
  product: one(products, {
    fields: [negotiations.product_id],
    references: [products.id],
  }),
  conversation: one(conversations, {
    fields: [negotiations.id], // We'll map this differently
    references: [conversations.id],
  }),
}));

// === SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertNegotiationSchema = createInsertSchema(negotiations).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Negotiation = typeof negotiations.$inferSelect;
export type InsertNegotiation = z.infer<typeof insertNegotiationSchema>;

// Extended types for responses
export type NegotiationWithProduct = Negotiation & { product: Product };
