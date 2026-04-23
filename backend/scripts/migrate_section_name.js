const pool = require('../src/config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Adding section_name to skill_goals...');
    await client.query('ALTER TABLE skill_goals ADD COLUMN IF NOT EXISTS section_name VARCHAR(255);');
    
    console.log('Adding section_name to template_goals...');
    await client.query('ALTER TABLE template_goals ADD COLUMN IF NOT EXISTS section_name VARCHAR(255);');

    console.log('Adding section_name to plan_goals...');
    await client.query('ALTER TABLE plan_goals ADD COLUMN IF NOT EXISTS section_name VARCHAR(255);');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
