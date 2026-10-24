import express from 'express';
import { sql, getSql, generateId, ensureTablesExist } from './db.js';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Helper to format Property from DB row
function formatProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    block: row.block,
    apartmentNumber: row.apartment_number,
    roomFlatNumber: row.room_flat_number,
    tenantName: row.tenant_name || '',
    phoneNumber: row.phone_number || '',
    monthlyRent: Number(row.monthly_rent),
    securityDeposit: Number(row.security_deposit),
    moveInDate: row.move_in_date || '',
    moveOutDate: row.move_out_date || '',
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

// Helper to format Payment from DB row
function formatPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    month: Number(row.month),
    year: Number(row.year),
    rentAmount: Number(row.rent_amount),
    status: row.status,
    paymentDate: row.payment_date || '',
    paymentMethod: row.payment_method || 'upi',
    notes: row.notes || '',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

// GET / or /api info
apiRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rent Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// POST /auth/login - Secure user authentication against .env / environment variables
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  const expectedUser = (process.env.ADMIN_USERNAME || 'DEV').trim();
  const expectedPass = (process.env.ADMIN_PASSWORD || '1439').trim();

  if (
    typeof username === 'string' &&
    typeof password === 'string' &&
    username.trim() === expectedUser &&
    password.trim() === expectedPass
  ) {
    return res.json({
      success: true,
      message: 'Login successful',
      user: { username: expectedUser }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password.'
  });
});

// Middleware to ensure DB connection is available
apiRouter.use(async (req, res, next) => {
  if (!getSql()) {
    return res.status(500).json({ 
      error: 'DATABASE_URL is not configured. Please add DATABASE_URL under Vercel Project Settings > Environment Variables.' 
    });
  }
  next();
});

// GET /api/health
apiRouter.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    const result = await sql`SELECT 1 as connected, current_database() as db_name, version() as version`;
    const latency = Date.now() - start;
    res.json({
      status: 'connected',
      provider: 'Neon PostgreSQL (Serverless)',
      database: result[0]?.db_name,
      latencyMs: latency,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ================= PROPERTIES =================

// GET /api/properties
apiRouter.get('/properties', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM properties 
      ORDER BY block ASC, apartment_number ASC, created_at DESC
    `;
    res.json(rows.map(formatProperty));
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/properties/:id
apiRouter.get('/properties/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM properties WHERE id = ${req.params.id}`;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(formatProperty(rows[0]));
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/properties
apiRouter.post('/properties', async (req, res) => {
  try {
    const {
      block,
      apartmentNumber,
      roomFlatNumber,
      tenantName = '',
      phoneNumber = '',
      monthlyRent = 0,
      securityDeposit = 0,
      moveInDate = '',
      moveOutDate = '',
      status = 'vacant',
      notes = ''
    } = req.body;

    const id = generateId();
    const now = new Date().toISOString();

    const rows = await sql`
      INSERT INTO properties (
        id, block, apartment_number, room_flat_number, tenant_name, phone_number,
        monthly_rent, security_deposit, move_in_date, move_out_date, status, notes,
        created_at, updated_at
      ) VALUES (
        ${id}, ${block}, ${apartmentNumber}, ${roomFlatNumber}, ${tenantName}, ${phoneNumber},
        ${monthlyRent}, ${securityDeposit}, ${moveInDate}, ${moveOutDate}, ${status}, ${notes},
        ${now}, ${now}
      )
      RETURNING *
    `;

    res.status(201).json(formatProperty(rows[0]));
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/properties/:id
apiRouter.put('/properties/:id', async (req, res) => {
  try {
    const existing = await sql`SELECT * FROM properties WHERE id = ${req.params.id}`;
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const current = existing[0];
    const data = req.body;
    const now = new Date().toISOString();

    const rows = await sql`
      UPDATE properties SET
        block = ${data.block !== undefined ? data.block : current.block},
        apartment_number = ${data.apartmentNumber !== undefined ? data.apartmentNumber : current.apartment_number},
        room_flat_number = ${data.roomFlatNumber !== undefined ? data.roomFlatNumber : current.room_flat_number},
        tenant_name = ${data.tenantName !== undefined ? data.tenantName : current.tenant_name},
        phone_number = ${data.phoneNumber !== undefined ? data.phoneNumber : current.phone_number},
        monthly_rent = ${data.monthlyRent !== undefined ? data.monthlyRent : current.monthly_rent},
        security_deposit = ${data.securityDeposit !== undefined ? data.securityDeposit : current.security_deposit},
        move_in_date = ${data.moveInDate !== undefined ? data.moveInDate : current.move_in_date},
        move_out_date = ${data.moveOutDate !== undefined ? data.moveOutDate : current.move_out_date},
        status = ${data.status !== undefined ? data.status : current.status},
        notes = ${data.notes !== undefined ? data.notes : current.notes},
        updated_at = ${now}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(formatProperty(rows[0]));
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/properties/:id
apiRouter.delete('/properties/:id', async (req, res) => {
  try {
    const rows = await sql`
      DELETE FROM properties WHERE id = ${req.params.id} RETURNING id
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================= PAYMENTS =================

// GET /api/payments
apiRouter.get('/payments', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM payments 
      ORDER BY year DESC, month DESC, created_at DESC
    `;
    res.json(rows.map(formatPayment));
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/:id
apiRouter.get('/payments/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM payments WHERE id = ${req.params.id}`;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(formatPayment(rows[0]));
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments
apiRouter.post('/payments', async (req, res) => {
  try {
    const {
      propertyId,
      month,
      year,
      rentAmount = 0,
      status = 'pending',
      paymentDate = '',
      paymentMethod = 'upi',
      notes = ''
    } = req.body;

    // Check duplicate
    const existing = await sql`
      SELECT id FROM payments 
      WHERE property_id = ${propertyId} AND month = ${month} AND year = ${year}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'A payment record for this property, month, and year already exists.' 
      });
    }

    const id = generateId();
    const now = new Date().toISOString();

    const rows = await sql`
      INSERT INTO payments (
        id, property_id, month, year, rent_amount, status,
        payment_date, payment_method, notes, created_at, updated_at
      ) VALUES (
        ${id}, ${propertyId}, ${month}, ${year}, ${rentAmount}, ${status},
        ${paymentDate}, ${paymentMethod}, ${notes}, ${now}, ${now}
      )
      RETURNING *
    `;

    res.status(201).json(formatPayment(rows[0]));
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/payments/:id
apiRouter.put('/payments/:id', async (req, res) => {
  try {
    const existing = await sql`SELECT * FROM payments WHERE id = ${req.params.id}`;
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const current = existing[0];
    const data = req.body;

    const newPropertyId = data.propertyId ?? current.property_id;
    const newMonth = data.month ?? current.month;
    const newYear = data.year ?? current.year;

    // Check duplicate if property, month, or year changed
    const duplicate = await sql`
      SELECT id FROM payments 
      WHERE id != ${req.params.id} 
        AND property_id = ${newPropertyId} 
        AND month = ${newMonth} 
        AND year = ${newYear}
    `;

    if (duplicate.length > 0) {
      return res.status(400).json({
        error: 'Another payment record for this property, month, and year already exists.'
      });
    }

    const now = new Date().toISOString();

    const rows = await sql`
      UPDATE payments SET
        property_id = ${newPropertyId},
        month = ${newMonth},
        year = ${newYear},
        rent_amount = ${data.rentAmount !== undefined ? data.rentAmount : current.rent_amount},
        status = ${data.status !== undefined ? data.status : current.status},
        payment_date = ${data.paymentDate !== undefined ? data.paymentDate : current.payment_date},
        payment_method = ${data.paymentMethod !== undefined ? data.paymentMethod : current.payment_method},
        notes = ${data.notes !== undefined ? data.notes : current.notes},
        updated_at = ${now}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    res.json(formatPayment(rows[0]));
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/payments/:id
apiRouter.delete('/payments/:id', async (req, res) => {
  try {
    const rows = await sql`
      DELETE FROM payments WHERE id = ${req.params.id} RETURNING id
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================= BACKUP & RESTORE =================

// POST /api/backup/import
apiRouter.post('/backup/import', async (req, res) => {
  try {
    const { properties, payments } = req.body;
    if (!Array.isArray(properties) || !Array.isArray(payments)) {
      return res.status(400).json({ error: 'Invalid backup structure. Arrays expected for properties and payments.' });
    }

    await ensureTablesExist();

    // Clear existing
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM properties`;

    // Insert properties
    for (const prop of properties) {
      await sql`
        INSERT INTO properties (
          id, block, apartment_number, room_flat_number, tenant_name, phone_number,
          monthly_rent, security_deposit, move_in_date, move_out_date, status, notes,
          created_at, updated_at
        ) VALUES (
          ${prop.id || generateId()}, ${prop.block}, ${prop.apartmentNumber}, ${prop.roomFlatNumber},
          ${prop.tenantName || ''}, ${prop.phoneNumber || ''}, ${prop.monthlyRent || 0}, ${prop.securityDeposit || 0},
          ${prop.moveInDate || ''}, ${prop.moveOutDate || ''}, ${prop.status || 'vacant'}, ${prop.notes || ''},
          ${prop.createdAt || new Date().toISOString()}, ${prop.updatedAt || new Date().toISOString()}
        )
      `;
    }

    // Insert payments
    for (const pay of payments) {
      await sql`
        INSERT INTO payments (
          id, property_id, month, year, rent_amount, status,
          payment_date, payment_method, notes, created_at, updated_at
        ) VALUES (
          ${pay.id || generateId()}, ${pay.propertyId}, ${pay.month}, ${pay.year},
          ${pay.rentAmount || 0}, ${pay.status || 'pending'}, ${pay.paymentDate || ''},
          ${pay.paymentMethod || 'upi'}, ${pay.notes || ''},
          ${pay.createdAt || new Date().toISOString()}, ${pay.updatedAt || new Date().toISOString()}
        )
      `;
    }

    res.json({
      success: true,
      message: `Successfully restored ${properties.length} properties and ${payments.length} payments to Neon PostgreSQL.`
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/clear
apiRouter.post('/backup/clear', async (req, res) => {
  try {
    await sql`DELETE FROM payments`;
    await sql`DELETE FROM properties`;

    // Re-seed demo data
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

    res.json({ success: true, message: 'Reset data to initial state in Neon PostgreSQL.' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: error.message });
  }
});
