const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not set in environment or .env file');
  process.exit(1);
}

const sql = neon(dbUrl);

function generateId() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

async function initDatabase() {
  console.log('Connecting to Neon PostgreSQL...');
  try {
    // 1. Create properties table
    console.log('Creating "properties" table if not exists...');
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

    // 2. Create payments table
    console.log('Creating "payments" table if not exists...');
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

    // 3. Check if properties table is empty, if so, seed sample data
    const existingProps = await sql`SELECT COUNT(*)::int as count FROM properties`;
    if (existingProps[0].count === 0) {
      console.log('Properties table is empty. Seeding initial demo properties...');
      const prop1Id = generateId();
      const prop2Id = generateId();
      const prop3Id = generateId();
      const nowIso = new Date().toISOString();

      await sql`
        INSERT INTO properties (
          id, block, apartment_number, room_flat_number, tenant_name, phone_number,
          monthly_rent, security_deposit, move_in_date, status, notes, created_at, updated_at
        ) VALUES 
        (
          ${prop1Id}, 'Block A', '101', 'Flat 1A', 'Rajesh Sharma', '9876543210',
          15000, 30000, '2025-01-01', 'occupied', 'Well maintained tenant.', ${nowIso}, ${nowIso}
        ),
        (
          ${prop2Id}, 'Block A', '102', 'Flat 1B', 'Priya Patel', '9123456789',
          18000, 36000, '2025-02-15', 'occupied', 'Paid deposit in advance.', ${nowIso}, ${nowIso}
        ),
        (
          ${prop3Id}, 'Block B', '201', 'Flat 2A', '', '',
          16000, 32000, '', 'vacant', 'Ready for move-in.', ${nowIso}, ${nowIso}
        )
      `;

      const currDate = new Date();
      const currMonth = currDate.getMonth() + 1;
      const currYear = currDate.getFullYear();
      const pay1Id = generateId();
      const pay2Id = generateId();

      console.log('Seeding initial demo payments...');
      await sql`
        INSERT INTO payments (
          id, property_id, month, year, rent_amount, status, payment_date, payment_method, notes, created_at, updated_at
        ) VALUES
        (
          ${pay1Id}, ${prop1Id}, ${currMonth}, ${currYear}, 15000, 'paid', ${currDate.toISOString().split('T')[0]}, 'upi', 'Paid via GPay', ${nowIso}, ${nowIso}
        ),
        (
          ${pay2Id}, ${prop2Id}, ${currMonth}, ${currYear}, 18000, 'pending', '', 'upi', 'Pending rent for this month', ${nowIso}, ${nowIso}
        )
      `;
    }

    const propCount = await sql`SELECT COUNT(*)::int as count FROM properties`;
    const payCount = await sql`SELECT COUNT(*)::int as count FROM payments`;

    console.log(`Database initialization complete!`);
    console.log(`Properties count: ${propCount[0].count}`);
    console.log(`Payments count: ${payCount[0].count}`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();
