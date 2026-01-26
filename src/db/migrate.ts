import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from '../config/settings';
import { logger } from '../utils/logger';

export class DatabaseMigrator {
  private pool: Pool;
  private migrationsPath: string;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.postgresql.uri,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    this.migrationsPath = join(__dirname, 'migrations');
  }

  async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    try {
      await this.pool.query(query);
      logger.info('Migrations table created or already exists');
    } catch (error) {
      logger.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await this.pool.query(
        'SELECT filename FROM migrations ORDER BY id ASC'
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      throw error;
    }
  }

  async getMigrationFiles(): Promise<string[]> {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      return files;
    } catch (error) {
      logger.error('Failed to read migration files:', error);
      throw error;
    }
  }

  async executeMigration(filename: string): Promise<void> {
    const filePath = join(this.migrationsPath, filename);
    
    try {
      const sql = readFileSync(filePath, 'utf8');
      
      // Start transaction
      await this.pool.query('BEGIN');
      
      // Execute migration
      await this.pool.query(sql);
      
      // Record migration
      await this.pool.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      // Commit transaction
      await this.pool.query('COMMIT');
      
      logger.info(`Migration executed successfully: ${filename}`);
    } catch (error) {
      // Rollback on error
      await this.pool.query('ROLLBACK');
      logger.error(`Failed to execute migration ${filename}:`, error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get executed and available migrations
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration process failed:', error);
      throw error;
    }
  }

  async rollbackMigration(filename: string): Promise<void> {
    try {
      // Start transaction
      await this.pool.query('BEGIN');
      
      // Remove migration record
      await this.pool.query(
        'DELETE FROM migrations WHERE filename = $1',
        [filename]
      );
      
      // Note: Actual rollback SQL would need to be implemented per migration
      // This is a basic framework
      
      // Commit transaction
      await this.pool.query('COMMIT');
      
      logger.info(`Migration rolled back: ${filename}`);
    } catch (error) {
      await this.pool.query('ROLLBACK');
      logger.error(`Failed to rollback migration ${filename}:`, error);
      throw error;
    }
  }

  async getStatus(): Promise<{ executed: string[]; pending: string[] }> {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    return {
      executed: executedMigrations,
      pending: pendingMigrations,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface for migrations
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      migrator.runMigrations()
        .then(() => {
          logger.info('Migrations completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Migration failed:', error);
          process.exit(1);
        })
        .finally(() => migrator.close());
      break;
      
    case 'status':
      migrator.getStatus()
        .then((status) => {
          console.log('Migration Status:');
          console.log('Executed:', status.executed);
          console.log('Pending:', status.pending);
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Failed to get migration status:', error);
          process.exit(1);
        })
        .finally(() => migrator.close());
      break;
      
    case 'rollback':
      const filename = process.argv[3];
      if (!filename) {
        console.error('Please provide migration filename to rollback');
        process.exit(1);
      }
      
      migrator.rollbackMigration(filename)
        .then(() => {
          logger.info('Rollback completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Rollback failed:', error);
          process.exit(1);
        })
        .finally(() => migrator.close());
      break;
      
    default:
      console.log('Usage: npm run migrate [up|status|rollback <filename>]');
      process.exit(1);
  }
}