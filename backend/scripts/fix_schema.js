// Script to create missing goal tables required by Node APIs
const db = require('../src/config/database');

const fixSchema = async () => {
  const client = await db.connect();
  try {
    console.log('Fixing schema mismatch: Creating missing goals tables...');
    await client.query('BEGIN');

    // 1. Create skill_goals table (missing in neon_setup.sql)
    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_goals (
          id SERIAL PRIMARY KEY,
          skill_id INTEGER NOT NULL,
          section_name VARCHAR(255),
          goal_title VARCHAR(255) NOT NULL,
          activities TEXT,
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created skill_goals table');

    // 2. Create template_goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS template_goals (
          id SERIAL PRIMARY KEY,
          template_id INTEGER NOT NULL,
          skill_name VARCHAR(255),
          section_name VARCHAR(255),
          goal_title VARCHAR(255) NOT NULL,
          activities TEXT,
          image_url TEXT,
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created template_goals table');

    // 3. Create plan_goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_goals (
          id SERIAL PRIMARY KEY,
          plan_id INTEGER NOT NULL,
          skill_name VARCHAR(255),
          section_name VARCHAR(255),
          goal_title VARCHAR(255) NOT NULL,
          activities TEXT,
          image_url TEXT,
          display_order INT DEFAULT 0,
          result_status VARCHAR(50) DEFAULT 'pending',
          result_notes TEXT,
          evaluated_at TIMESTAMP,
          evaluated_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_id) REFERENCES education_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ Created plan_goals table');

    await client.query('COMMIT');
    console.log('Schema fix completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing schema:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

fixSchema();
