# 📦 QLHS Database Setup Guide

## Quick Start

### Prerequisites
- PostgreSQL 12+ installed
- pgAdmin 4 (optional, for UI management)
- psql command-line tool

### Installation Steps

#### 1. Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE qlhs_dev WITH ENCODING = 'UTF8';

# Exit
\q
```

#### 2. Run Schema
```bash
# Navigate to database folder
cd d:\Project\QLHS\database

# Execute schema creation
psql -U postgres -d qlhs_dev -f 01_schema.sql

# You should see: CREATE TABLE statements executed successfully
```

#### 3. Insert Sample Data
```bash
# Execute sample data insertion
psql -U postgres -d qlhs_dev -f 02_sample_data.sql

# You should see: INSERT statements executed
```

#### 4. Set Up Migrations
```bash
# Execute migration setup
psql -U postgres -d qlhs_dev -f 03_migrations.sql

# This will create triggers and utility functions
```

#### 5. Verify Installation
```bash
# Connect to database
psql -U postgres -d qlhs_dev

# Check tables
\dt

# Check views
\dv

# Check indexes
\di

# Run a test query
SELECT * FROM "Users" LIMIT 1;

# Exit
\q
```

---

## File Structure

```
d:\Project\QLHS\
├── database/
│   ├── 01_schema.sql                 # Main schema creation (12 tables)
│   ├── 02_sample_data.sql            # Sample data for testing
│   ├── 03_migrations.sql             # Triggers & utilities
│   ├── DATABASE_DOCUMENTATION.md     # Full documentation
│   ├── ERD_AND_VISUALIZATION.md      # Entity-Relationship Diagram
│   └── README.md                     # This file
├── backend/                          # Backend code (next step)
├── frontend/                         # Frontend code (next step)
└── docs/                             # Project documentation
```

---

## Schema Summary

### 12 Tables Created

| # | Table | Records | Purpose |
|---|-------|---------|---------|
| 1 | Users | ~10 | Giáo viên, Admin, Phụ huynh |
| 2 | Kindergartens | 3 | Thông tin trường |
| 3 | DevelopmentAreas | 4 | 4 lĩnh vực phát triển |
| 4 | Skills | 100+ | Kỹ năng/Mục tiêu |
| 5 | SkillImages | 200+ | Ảnh minh họa |
| 6 | Children | 50 | Danh sách trẻ |
| 7 | Templates | 10+ | Mẫu kế hoạch |
| 8 | TemplateSkills | 1000+ | Link template-skill |
| 9 | EducationPlans | 600+ | Kế hoạch giáo dục |
| 10 | PlanSkills | 10000+ | Skill trong kế hoạch |
| 11 | EvaluationResults | 20000+ | Kết quả đánh giá |
| 12 | ActivityLogs | 50000+ | Lịch sử hoạt động |

### 2 Important Views Created

1. **PlanSummary** - Tổng quan kế hoạch
2. **ChildProgress** - Tiến độ học sinh

---

## Key Features

### Relationships
- ✅ Foreign key constraints (referential integrity)
- ✅ Soft deletes (deleted_at timestamp)
- ✅ Audit trail (ActivityLogs table)
- ✅ Auto-update timestamps (triggers)

### Indexes
- ✅ 20+ indexes for performance
- ✅ Composite indexes for complex queries
- ✅ Optimized for common searches

### Sample Data
- ✅ 1 Kindergarten (Trường Mầm Non ABC)
- ✅ 6 Users (3 teachers, 1 admin, 1 principal)
- ✅ 5 Children with real names
- ✅ 17 Skills from PDF template
- ✅ 3 Templates for different age groups
- ✅ 5 Education plans with evaluations

---

## Basic Queries

### Get All Children
```sql
SELECT fullName, date_of_birth, gender FROM "Children" 
WHERE deleted_at IS NULL;
```

### Get Plans for Specific Teacher
```sql
SELECT c.fullName, ep.month, ep.year, COUNT(ps.id) as skills_count
FROM "EducationPlans" ep
JOIN "Children" c ON ep.child_id = c.id
LEFT JOIN "PlanSkills" ps ON ep.id = ps.plan_id
WHERE ep.teacher_id = 2 AND ep.deleted_at IS NULL
GROUP BY ep.id, c.fullName;
```

### Get Child Progress Summary
```sql
SELECT 
    da.name as area,
    COUNT(s.id) as total_skills,
    COUNT(CASE WHEN er.status = 'achieved' THEN 1 END) as achieved,
    ROUND(COUNT(CASE WHEN er.status = 'achieved' THEN 1 END)::numeric / 
          COUNT(s.id) * 100, 2) as percentage
FROM "EducationPlans" ep
JOIN "PlanSkills" ps ON ep.id = ps.plan_id
JOIN "Skills" s ON ps.skill_id = s.id
JOIN "DevelopmentAreas" da ON s.development_area_id = da.id
LEFT JOIN "EvaluationResults" er ON ps.id = er.plan_skill_id 
  AND er.status = 'achieved'
WHERE ep.child_id = 1 AND ep.month = 4 AND ep.year = 2026
GROUP BY da.id, da.name;
```

### Get Pending Evaluations
```sql
SELECT 
    c.fullName,
    s.name as skill_name,
    da.name as area_name,
    ep.month, ep.year
FROM "PlanSkills" ps
JOIN "EducationPlans" ep ON ps.plan_id = ep.id
JOIN "Children" c ON ep.child_id = c.id
JOIN "Skills" s ON ps.skill_id = s.id
JOIN "DevelopmentAreas" da ON s.development_area_id = da.id
LEFT JOIN "EvaluationResults" er ON ps.id = er.plan_skill_id
WHERE er.id IS NULL AND ep.deleted_at IS NULL
ORDER BY c.fullName;
```

---

## Backup & Restore

### Create Backup
```bash
# Full database backup
pg_dump -U postgres -d qlhs_dev > qlhs_backup_$(date +%Y%m%d).sql

# Compressed backup (smaller file)
pg_dump -U postgres -d qlhs_dev | gzip > qlhs_backup_$(date +%Y%m%d).sql.gz

# Backup specific table
pg_dump -U postgres -t "EducationPlans" -d qlhs_dev > education_plans_backup.sql
```

### Restore Database
```bash
# From SQL file
psql -U postgres -d qlhs_dev < qlhs_backup_20260413.sql

# From gzip file
gunzip < qlhs_backup_20260413.sql.gz | psql -U postgres -d qlhs_dev

# From single table backup
psql -U postgres -d qlhs_dev < education_plans_backup.sql
```

### Schedule Automated Backup
```bash
# Linux/Mac - Add to crontab
0 3 * * * pg_dump -U postgres -d qlhs_dev | gzip > /backups/qlhs_$(date +\%Y\%m\%d).sql.gz

# Windows - Use Task Scheduler
# Create batch file: backup.bat
# SET PATH=%PATH%;C:\Program Files\PostgreSQL\12\bin
# pg_dump -U postgres -d qlhs_dev | gzip > D:\Backups\qlhs_backup.sql.gz
```

---

## Monitoring & Maintenance

### Check Database Size
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Analyze & Optimize
```sql
-- Update table statistics
ANALYZE "EducationPlans";
ANALYZE "EvaluationResults";

-- Reindex tables
REINDEX TABLE "EducationPlans";
REINDEX TABLE "EvaluationResults";

-- Check index effectiveness
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Monitor Connections
```sql
-- Check active connections
SELECT datname, usename, count(*) as connections
FROM pg_stat_activity
GROUP BY datname, usename;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'qlhs_dev' AND idle_in_transaction_session_timeout < interval '30 minutes';
```

---

## Connection Strings

### Node.js (pg or sequelize)
```javascript
const connectionString = 'postgresql://postgres:password@localhost:5432/qlhs_dev';

// or with pg module
const client = new pg.Client({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'qlhs_dev'
});
```

### Python (psycopg2)
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="qlhs_dev",
    user="postgres",
    password="password",
    port="5432"
)
```

### .NET (Entity Framework)
```csharp
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=qlhs_dev;Username=postgres;Password=password"
}
```

---

## Troubleshooting

### Issue: "database qlhs_dev does not exist"
**Solution**: Run the CREATE DATABASE statement

### Issue: "permission denied for schema public"
**Solution**: 
```sql
GRANT ALL PRIVILEGES ON DATABASE qlhs_dev TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
```

### Issue: Foreign key constraint violation
**Solution**: Check referential integrity
```sql
-- Show FK violations
SELECT * FROM "Children" 
WHERE teacher_id NOT IN (SELECT id FROM "Users" WHERE role = 'teacher');
```

### Issue: Slow queries
**Solution**: Check indexes
```sql
EXPLAIN ANALYZE 
SELECT * FROM "EducationPlans" 
WHERE child_id = 1 AND month = 4 AND year = 2026;
```

---

## Performance Tips

1. **Use Indexes**: Already created for common queries
2. **Connection Pooling**: Use PgBouncer or similar
3. **Caching**: Cache frequently accessed data (Redis)
4. **Pagination**: Limit result sets in frontend
5. **Archive Old Data**: Move old education plans to archive table
6. **Monitor**: Set up PostgreSQL log_min_duration_statement

---

## Security Best Practices

1. ✅ Use environment variables for credentials
2. ✅ Hash passwords with bcrypt
3. ✅ Use parameterized queries (prepared statements)
4. ✅ Enable SSL for remote connections
5. ✅ Create separate database user for application
6. ✅ Restrict database access by IP
7. ✅ Regular backups and testing

### Create App User (Recommended)
```sql
-- Create app user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant permissions
GRANT CONNECT ON DATABASE qlhs_dev TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

---

## Next Steps

1. ✅ **Database Created** ← You are here
2. 🔄 Setup Backend API (Node.js/Express)
3. 🔄 Design Frontend (React/Vue)
4. 🔄 Implement Authentication
5. 🔄 Create PDF Export Feature
6. 🔄 Deploy to Production

---

## Useful Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **pgAdmin**: https://www.pgadmin.org/
- **Database Design**: https://www.postgresql.org/docs/current/tutorial.html
- **Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization

---

## Support & Documentation

- 📄 See `DATABASE_DOCUMENTATION.md` for detailed table descriptions
- 📊 See `ERD_AND_VISUALIZATION.md` for entity relationships
- 🔧 See `03_migrations.sql` for migration details

---

**Database Version**: 1.0  
**Last Updated**: 2026-04-13  
**Status**: ✅ Ready for Development
