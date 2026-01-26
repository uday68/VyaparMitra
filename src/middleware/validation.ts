import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: ValidationError[] = [];

      // Validate body
      if (schema.body) {
        try {
          req.body = schema.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'body'));
          }
        }
      }

      // Validate query parameters
      if (schema.query) {
        try {
          req.query = schema.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'query'));
          }
        }
      }

      // Validate path parameters
      if (schema.params) {
        try {
          req.params = schema.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'params'));
          }
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation processing failed',
        code: 'VALIDATION_PROCESSING_ERROR',
      });
    }
  };
}

function formatZodErrors(error: ZodError, source: string): ValidationError[] {
  return error.errors.map((err) => ({
    field: `${source}.${err.path.join('.')}`,
    message: err.message,
    code: err.code,
  }));
}

// Common validation schemas
export const commonSchemas = {
  // MongoDB ObjectId
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  // UUID
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  
  // Language code
  language: z.enum(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu']),
  
  // User type
  userType: z.enum(['vendor', 'customer']),
  
  // Price
  price: z.number().positive('Price must be positive'),
  
  // Stock quantity
  stock: z.number().int().min(0, 'Stock cannot be negative'),
};

// Product validation schemas
export const productSchemas = {
  create: {
    body: z.object({
      name: z.string().min(1, 'Product name is required').max(200),
      description: z.string().max(1000).optional(),
      basePrice: commonSchemas.price,
      stock: commonSchemas.stock,
      category: z.string().min(1, 'Category is required').max(100),
      images: z.array(z.string().url()).max(10).optional(),
    }),
  },
  
  update: {
    params: z.object({
      id: commonSchemas.objectId,
    }),
    body: z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      basePrice: commonSchemas.price.optional(),
      stock: commonSchemas.stock.optional(),
      category: z.string().min(1).max(100).optional(),
      images: z.array(z.string().url()).max(10).optional(),
    }),
  },
  
  list: {
    query: z.object({
      vendorId: commonSchemas.objectId.optional(),
      category: z.string().optional(),
      search: z.string().max(100).optional(),
      inStock: z.coerce.boolean().optional(),
      minPrice: z.coerce.number().positive().optional(),
      maxPrice: z.coerce.number().positive().optional(),
      ...commonSchemas.pagination.shape,
    }),
  },
  
  get: {
    params: z.object({
      id: commonSchemas.objectId,
    }),
  },
};

// Negotiation validation schemas
export const negotiationSchemas = {
  create: {
    body: z.object({
      productId: commonSchemas.objectId,
      customerId: commonSchemas.objectId,
    }),
  },
  
  createBid: {
    body: z.object({
      negotiationId: z.number().int().positive(),
      amount: commonSchemas.price,
      message: z.string().max(500).optional(),
      language: commonSchemas.language,
      targetLanguage: commonSchemas.language.optional(),
    }),
  },
  
  updateStatus: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
    body: z.object({
      status: z.enum(['ACCEPTED', 'REJECTED', 'EXPIRED']),
    }),
  },
};

// Voice validation schemas
export const voiceSchemas = {
  processIntent: {
    body: z.object({
      text: z.string().min(1, 'Text is required').max(1000),
      language: commonSchemas.language,
      userId: commonSchemas.objectId.optional(),
      userType: commonSchemas.userType.optional(),
    }),
  },
  
  generateTTS: {
    body: z.object({
      text: z.string().min(1, 'Text is required').max(1000),
      language: commonSchemas.language,
      userId: commonSchemas.objectId.optional(),
      userType: commonSchemas.userType.optional(),
    }),
  },
  
  createVoiceProfile: {
    body: z.object({
      userId: commonSchemas.objectId,
      userType: commonSchemas.userType,
      consentGiven: z.boolean(),
    }),
  },
};

// QR Session validation schemas
export const qrSchemas = {
  create: {
    body: z.object({
      vendorId: commonSchemas.objectId,
      ttlMinutes: z.number().int().min(1).max(60).default(30),
    }),
  },
  
  validate: {
    params: z.object({
      sessionId: commonSchemas.uuid,
    }),
  },
};