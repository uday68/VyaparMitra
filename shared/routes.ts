import { z } from 'zod';
import { insertProductSchema, insertNegotiationSchema, products, negotiations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  negotiations: {
    create: {
      method: 'POST' as const,
      path: '/api/negotiations',
      input: z.object({
        productId: z.number(),
        initialMessage: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof negotiations.$inferSelect & { conversationId: number }>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/negotiations',
      responses: {
        200: z.array(z.custom<typeof negotiations.$inferSelect & { product: typeof products.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/negotiations/:id',
      responses: {
        200: z.custom<typeof negotiations.$inferSelect & { product: typeof products.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/negotiations/:id/status',
      input: z.object({
        status: z.enum(['active', 'accepted', 'rejected']),
        finalPrice: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof negotiations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
