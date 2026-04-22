-- ============================================
-- DATABASE MIGRATION STRATEGY
-- ============================================
-- Version: 1.0
-- This file describes how to set up the database for development, testing, and production

-- ============================================
-- DEVELOPMENT ENVIRONMENT
-- ============================================

-- Step 1: Create Database
CREATE DATABASE qlhs_dev WITH 
    ENCODING = 'UTF8' 
    LOCALE = 'en_US.UTF-8';

-- Step 2: Connect to the database
-- \c qlhs_dev (in psql) or connection string

-- Step 3: Create Extensions (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 4: Run Schema
-- psql -U postgres -d qlhs_dev < 01_schema.sql

-- Step 5: Run Sample Data
-- psql -U postgres -d qlhs_dev < 02_sample_data.sql

-- ============================================
-- PRODUCTION MIGRATION CHECKLIST
-- ============================================

/*
1. Database Setup:
   [ ] Create database with proper encoding
   [ ] Create roles with proper permissions
   [ ] Set up backup strategy
   [ ] Configure max_connections appropriately
   
2. Schema Deployment:
   [ ] Test on staging first
   [ ] Backup production database
   [ ] Run 01_schema.sql
   [ ] Verify all tables created
   [ ] Verify all indexes created
   [ ] Verify all views created
   
3. Data Migration (if migrating from old system):
   [ ] Export data from old system
   [ ] Transform to new schema
   [ ] Validate data integrity
   [ ] Test before committing
   [ ] Archive old data
   
4. Post-Deployment:
   [ ] Run ANALYZE to update statistics
   [ ] Monitor performance
   [ ] Check logs for errors
   [ ] Notify users
   
5. Rollback Plan (if needed):
   [ ] Keep database backup
   [ ] Keep migration scripts
   [ ] Document rollback steps
*/

-- ============================================
-- COMMON QUERIES FOR TESTING
-- ============================================

-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check all indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Check data volume
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check users and their roles
SELECT email, fullName, role, is_active FROM "Users" ORDER BY created_at;

-- Check children list with teachers
SELECT 
    c.fullName as child_name,
    u.fullName as teacher_name,
    c.date_of_birth,
    count(ep.id) as plan_count
FROM "Children" c
LEFT JOIN "Users" u ON c.teacher_id = u.id
LEFT JOIN "EducationPlans" ep ON c.id = ep.child_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, u.id, c.fullName, u.fullName, c.date_of_birth;

-- Check education plans with status
SELECT 
    c.fullName,
    CONCAT(ep.month, '/', ep.year) as month_year,
    COUNT(ps.id) as skill_count,
    SUM(CASE WHEN er.status = 'achieved' THEN 1 ELSE 0 END) as achieved,
    ep.status
FROM "EducationPlans" ep
JOIN "Children" c ON ep.child_id = c.id
LEFT JOIN "PlanSkills" ps ON ep.id = ps.plan_id
LEFT JOIN "EvaluationResults" er ON ps.id = er.plan_skill_id
WHERE ep.deleted_at IS NULL
GROUP BY ep.id, c.fullName, ep.month, ep.year, ep.status;

-- ============================================
-- PERFORMANCE TUNING
-- ============================================

-- Set random_page_cost for better index usage (if on SSD)
-- SET random_page_cost = 1.1;

-- Check slow queries
-- SET log_min_duration_statement = 100; -- Log queries > 100ms

-- Analyze tables for query optimization
ANALYZE "Users";
ANALYZE "Children";
ANALYZE "Skills";
ANALYZE "EducationPlans";
ANALYZE "PlanSkills";
ANALYZE "EvaluationResults";

-- ============================================
-- MAINTENANCE TASKS (Regular)
-- ============================================

-- Vacuum (cleanup dead tuples)
-- VACUUM ANALYZE;

-- Reindex tables
-- REINDEX TABLE "EducationPlans";
-- REINDEX TABLE "EvaluationResults";

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    round(100 * (1 - pages_freed::float / pages::float), 2) as bloat_percent
FROM analyze_table_bloat
WHERE (pages_freed::float / pages::float) > 0.1
ORDER BY bloat_percent DESC;

-- ============================================
-- BACKUP AND RESTORE
-- ============================================

-- Backup entire database
-- pg_dump -U postgres qlhs_dev > qlhs_backup.sql

-- Backup specific table
-- pg_dump -U postgres -t "EducationPlans" qlhs_dev > education_plans_backup.sql

-- Restore from backup
-- psql -U postgres -d qlhs_dev < qlhs_backup.sql

-- ============================================
-- VERSION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS "SchemaVersions" (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    script_name VARCHAR(255),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(255)
);

-- Insert current version
INSERT INTO "SchemaVersions" (version, description, script_name, applied_by) VALUES
('1.0', 'Initial database schema with 12 tables', '01_schema.sql', 'system');

-- ============================================
-- NOTES FOR DEVELOPERS
-- ============================================

/*
1. Soft Deletes:
   - Use deleted_at column for soft deletes
   - Don't drop records, set deleted_at timestamp
   - Always filter: WHERE deleted_at IS NULL in queries
   
2. Timestamps:
   - created_at: automatically set to CURRENT_TIMESTAMP
   - updated_at: automatically set, need trigger for auto-update
   
3. Foreign Keys:
   - ON DELETE RESTRICT: prevent deletion if children exist
   - ON DELETE CASCADE: delete children automatically
   - ON DELETE SET NULL: set FK to NULL if parent deleted
   
4. Indexes:
   - Create indexes on commonly queried columns
   - Create composite indexes for compound filters
   - Monitor index usage with pg_stat_user_indexes
   
5. Security:
   - Use parameterized queries (prepared statements)
   - Hash passwords with bcrypt
   - Implement row-level security (RLS) for multi-tenant
   - Use least privilege for database users
*/

-- ============================================
-- TRIGGERS FOR AUTO UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables that have updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON "Children"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON "Skills"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_plans_updated_at BEFORE UPDATE ON "EducationPlans"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_skills_updated_at BEFORE UPDATE ON "PlanSkills"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_results_updated_at BEFORE UPDATE ON "EvaluationResults"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRANSACTION EXAMPLE (For Batch Operations)
-- ============================================

/*
When creating a new education plan with all its skills and evaluations:

BEGIN;
    INSERT INTO "EducationPlans" (...) RETURNING id;
    -- Use returned plan_id to insert plan_skills
    INSERT INTO "PlanSkills" (...) VALUES (...), (...), ...;
    INSERT INTO "EvaluationResults" (...) VALUES (...), ...;
COMMIT;

If any error occurs, entire transaction is rolled back:
ROLLBACK;

This ensures data consistency.
*/
