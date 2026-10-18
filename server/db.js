import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment or .env file!');
}

export const sql = databaseUrl ? neon(databaseUrl) : null;

export const generateId = () => {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Ensure database tables exist
export async function ensureTablesExist() {
  if (!sql) {
    throw new Error('Database connection not configured. Check DATABASE_URL in .env');
  }

  // Create properties table
  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR(64) PRIMARY KEY,
      block VARCHAR(100) NOT NULL,
      apartment_number VARCHAR(100) NOT NULL,
      room_flat_number VARCHAR(100) NOT NULL,
      tenant_name VARCHAR(255) DEFAULT '',
      phone_number VARCHAR(50) DEFAULT '',
      monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 0,
      security_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0,
      move_in_date VARCHAR(50) DEFAULT '',
      move_out_date VARCHAR(50) DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'vacant',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Create payments table
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      rent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_date VARCHAR(50) DEFAULT '',
      payment_method VARCHAR(50) DEFAULT 'upi',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT unique_property_month_year UNIQUE (property_id, month, year)
    );
  `;
}
