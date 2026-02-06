import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  // Schema location
  schema: './src/db/schema.ts',
  
  // Output directory for migrations
  out: './drizzle',
  
  // Database dialect - PostgreSQL for Supabase
  dialect: 'postgresql',
  
  // Database connection using environment variable
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  
  // Verbose logging during migrations
  verbose: true,
  
  // Strict mode - fail on warnings
  strict: true,
} satisfies Config;
