import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// Export chat models from the integration
export * from "./models/chat";
import { conversations } from "./models/chat";

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(), // Base price
  unit: text("unit").notNull(), // e.g., "kg", "dozen"
  imageUrl: text("image_url").notNull(),
  vendorName: text("vendor_name").notNull(),
  active: boolean("active").default(true),
});

// === NEGOTIATIONS ===
export const negotiations = pgTable("negotiations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  status: text("status").notNull().default("active"), // active, accepted, rejected
  finalPrice: numeric("final_price"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const productsRelations = relations(products, ({ many }) => ({
  negotiations: many(negotiations),
}));

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
  product: one(products, {
    fields: [negotiations.productId],
    references: [products.id],
  }),
  conversation: one(conversations, {
    fields: [negotiations.conversationId],
    references: [conversations.id],
  }),
}));

// === SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertNegotiationSchema = createInsertSchema(negotiations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Negotiation = typeof negotiations.$inferSelect;
export type InsertNegotiation = z.infer<typeof insertNegotiationSchema>;

// Extended types for responses
export type NegotiationWithProduct = Negotiation & { product: Product };
