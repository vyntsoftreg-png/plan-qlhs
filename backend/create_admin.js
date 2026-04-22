/**
 * Script tạo tài khoản Admin mặc định
 * Chạy: node create_admin.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 15000,
});

async function createAdmin() {
  const email = 'admin@hongthuy.vn';
  const name = 'Admin';
  const password = 'Admin@123';

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    // Check if admin already exists
    const existing = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows.length > 0) {
      console.log('⚠️  Admin account already exists! ID:', existing.rows[0].id);
      client.release();
      await pool.end();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin
    const result = await client.query(
      `INSERT INTO users (email, fullname, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())
       RETURNING id, email, fullname, role`,
      [email, name, passwordHash]
    );

    const admin = result.rows[0];
    console.log('');
    console.log('✅ Admin account created successfully!');
    console.log('================================');
    console.log('  ID:       ', admin.id);
    console.log('  Email:    ', admin.email);
    console.log('  Name:     ', admin.fullname);
    console.log('  Role:     ', admin.role);
    console.log('  Password: ', password);
    console.log('================================');

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
