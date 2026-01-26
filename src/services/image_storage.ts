import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/settings';
import { logger } from '../utils/logger';

export interface ImageUploadResult {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ImageProcessingOptions {
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
}

export class ImageStorageService {
  private static uploadDir = config.upload.uploadPath;
  private static thumbnailDir = path.join(config.upload.uploadPath, 'thumbnails');

  static async initialize(): Promise<void> {
    try {
      // Ensure upload directories exist
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      
      logger.info('Image storage directories initialized', {
        uploadDir: this.uploadDir,
        thumbnailDir: this.thumbnailDir,
      });
    } catch (error) {
      logger.error('Failed to initialize image storage directories', { error });
      throw error;
    }
  }

  static getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueId}${extension}`);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (config.upload.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${config.upload.allowedImageTypes.join(', ')}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: config.upload.maxFileSize,
        files: 10, // Maximum 10 files per request
      },
    });
  }

  static async processAndStoreImage(
    file: Express.Multer.File,
    options: ImageProcessingOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      const {
        generateThumbnail = true,
        thumbnailSize = { width: 300, height: 300 },
        quality = 85,
        format = 'jpeg',
        maxWidth = 1920,
        maxHeight = 1080,
      } = options;

      const filePath = file.path;
      const fileId = uuidv4();
      const processedFilename = `${fileId}.${format}`;
      const processedPath = path.join(this.uploadDir, processedFilename);

      // Process main image
      const imageProcessor = sharp(filePath);
      const metadata = await imageProcessor.metadata();

      // Resize if too large
      if (metadata.width && metadata.width > maxWidth || metadata.height && metadata.height > maxHeight) {
        imageProcessor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert and compress
      await imageProcessor
        .toFormat(format, { quality })
        .toFile(processedPath);

      // Get final dimensions
      const processedMetadata = await sharp(processedPath).metadata();

      const result: ImageUploadResult = {
        id: fileId,
        originalName: file.originalname,
        filename: processedFilename,
        url: `/uploads/${processedFilename}`,
        size: (await fs.stat(processedPath)).size,
        mimeType: `image/${format}`,
        dimensions: {
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
        },
      };

      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailFilename = `thumb_${fileId}.${format}`;
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

        await sharp(processedPath)
          .resize(thumbnailSize.width, thumbnailSize.height, {
            fit: 'cover',
            position: 'center',
          })
          .toFormat(format, { quality: 70 })
          .toFile(thumbnailPath);

        result.thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      }

      // Clean up original uploaded file if it's different from processed
      if (filePath !== processedPath) {
        await fs.unlink(filePath).catch(err => 
          logger.warn('Failed to clean up original file', { filePath, error: err.message })
        );
      }

      logger.info('Image processed and stored', {
        fileId,
        originalName: file.originalname,
        size: result.size,
        dimensions: result.dimensions,
      });

      return result;
    } catch (error) {
      logger.error('Failed to process and store image', {
        originalName: file.originalname,
        error: error.message,
      });
      
      // Clean up files on error
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        logger.warn('Failed to clean up file after error', { 
          filePath: file.path, 
          error: cleanupError.message 
        });
      }
      
      throw error;
    }
  }

  static async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);

      // Delete main image
      await fs.unlink(filePath).catch(err => {
        if (err.code !== 'ENOENT') throw err;
      });

      // Delete thumbnail if exists
      await fs.unlink(thumbnailPath).catch(err => {
        if (err.code !== 'ENOENT') throw err;
      });

      logger.info('Image deleted', { filename });
    } catch (error) {
      logger.error('Failed to delete image', { filename, error: error.message });
      throw error;
    }
  }

  static async getImageInfo(filename: string): Promise<ImageUploadResult | null> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const stats = await fs.stat(filePath);
      const metadata = await sharp(filePath).metadata();

      const fileId = path.parse(filename).name;
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
      
      let thumbnailUrl: string | undefined;
      try {
        await fs.access(thumbnailPath);
        thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      } catch {
        // Thumbnail doesn't exist
      }

      return {
        id: fileId,
        originalName: filename,
        filename,
        url: `/uploads/${filename}`,
        thumbnailUrl,
        size: stats.size,
        mimeType: `image/${metadata.format}`,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get image info', { filename, error: error.message });
      return null;
    }
  }

  static async listImages(limit: number = 50, offset: number = 0): Promise<ImageUploadResult[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const imageFiles = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        })
        .slice(offset, offset + limit);

      const results: ImageUploadResult[] = [];
      
      for (const file of imageFiles) {
        const info = await this.getImageInfo(file);
        if (info) {
          results.push(info);
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to list images', { error: error.message });
      throw error;
    }
  }

  static async cleanupOrphanedImages(referencedImages: string[]): Promise<number> {
    try {
      const allFiles = await fs.readdir(this.uploadDir);
      const imageFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      });

      let deletedCount = 0;
      
      for (const file of imageFiles) {
        if (!referencedImages.includes(file)) {
          await this.deleteImage(file);
          deletedCount++;
        }
      }

      logger.info('Cleanup completed', { 
        totalImages: imageFiles.length,
        referencedImages: referencedImages.length,
        deletedCount 
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup orphaned images', { error: error.message });
      throw error;
    }
  }

  static async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    oldestImage: Date | null;
    newestImage: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      });

      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;

      for (const file of imageFiles) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        const mtime = stats.mtime.getTime();
        if (mtime < oldestTime) oldestTime = mtime;
        if (mtime > newestTime) newestTime = mtime;
      }

      return {
        totalImages: imageFiles.length,
        totalSize,
        averageSize: imageFiles.length > 0 ? Math.round(totalSize / imageFiles.length) : 0,
        oldestImage: oldestTime !== Infinity ? new Date(oldestTime) : null,
        newestImage: newestTime > 0 ? new Date(newestTime) : null,
      };
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      throw error;
    }
  }
}