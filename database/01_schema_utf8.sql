-- ============================================
-- DATABASE SCHEMA: QLHS (Quáº£n lÃ½ há»c sinh)
-- Education Planning System for Special Children
-- ============================================
-- Version: 1.0
-- Created: 2026-04-13
-- Database: PostgreSQL 12+

-- ============================================
-- 1. USERS TABLE (NgÆ°á»i dÃ¹ng)
-- ============================================
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'admin', 'parent', 'principal')),
    kindergarten_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ============================================
-- 2. KINDERGARTENS TABLE (TrÆ°á»ng máº§m non)
-- ============================================
CREATE TABLE IF NOT EXISTS "Kindergartens" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    principal_id INTEGER,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (principal_id) REFERENCES "Users"(id) ON DELETE SET NULL
);

-- Add kindergarten_id constraint to Users
ALTER TABLE "Users" 
ADD CONSTRAINT fk_users_kindergarten 
FOREIGN KEY (kindergarten_id) REFERENCES "Kindergartens"(id) ON DELETE SET NULL;

-- ============================================
-- 3. DEVELOPMENT_AREAS TABLE (4 LÄ©nh vá»±c phÃ¡t triá»ƒn)
-- ============================================
CREATE TABLE IF NOT EXISTS "DevelopmentAreas" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    -- Fixed values: 'Váº­n Ä‘á»™ng thÃ´', 'Váº­n Ä‘á»™ng tinh', 'Nháº­n biáº¿t ngÃ´n ngá»¯ & TÆ° duy', 'CÃ¡ nhÃ¢n & XÃ£ há»™i'
    description TEXT,
    color_code VARCHAR(7), -- HEX color for UI
    icon_name VARCHAR(100), -- Material Icon name
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. SKILLS TABLE (Ká»¹ nÄƒng/Má»¥c tiÃªu)
-- ============================================
CREATE TABLE IF NOT EXISTS "Skills" (
    id SERIAL PRIMARY KEY,
    development_area_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instruction_text TEXT, -- HÆ°á»›ng dáº«n chi tiáº¿t
    teaching_method TEXT, -- CÃ¡ch dáº¡y, cÃ¡c bÆ°á»›c
    learning_objectives TEXT, -- Má»¥c tiÃªu há»c táº­p
    display_order INT DEFAULT 0,
    is_template BOOLEAN DEFAULT TRUE, -- LÃ  ká»¹ nÄƒng máº«u chuáº©n
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (development_area_id) REFERENCES "DevelopmentAreas"(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES "Users"(id) ON DELETE RESTRICT,
    
    UNIQUE (development_area_id, name) -- KhÃ´ng cho phÃ©p skill trÃ¹ng tÃªn trong cÃ¹ng lÄ©nh vá»±c
);

-- ============================================
-- 5. SKILL_IMAGES TABLE (áº¢nh minh há»a)
-- ============================================
CREATE TABLE IF NOT EXISTS "SkillImages" (
    id SERIAL PRIMARY KEY,
    skill_id INTEGER NOT NULL,
    image_url TEXT NOT NULL, -- Cloudinary URL
    alt_text VARCHAR(255),
    image_order INT DEFAULT 0,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (skill_id) REFERENCES "Skills"(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- ============================================
-- 6. CHILDREN TABLE (Tráº» em)
-- ============================================
CREATE TABLE IF NOT EXISTS "Children" (
    id SERIAL PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    kindergarten_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL, -- GiÃ¡o viÃªn chá»§ nhiá»‡m (chÃ­nh)
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    special_notes TEXT, -- Ghi chÃº Ä‘áº·c biá»‡t
    enrollment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (kindergarten_id) REFERENCES "Kindergartens"(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- ============================================
-- 7. TEMPLATES TABLE (Máº«u káº¿ hoáº¡ch)
-- ============================================
CREATE TABLE IF NOT EXISTS "Templates" (
    id SERIAL PRIMARY KEY,
    kindergarten_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(50), -- VD: '4-5 tuá»•i', '3-4 tuá»•i'
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT,
    is_default BOOLEAN DEFAULT FALSE, -- Máº«u máº·c Ä‘á»‹nh
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (kindergarten_id) REFERENCES "Kindergartens"(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- ============================================
-- 8. TEMPLATE_SKILLS TABLE (Skill trong template)
-- ============================================
CREATE TABLE IF NOT EXISTS "TemplateSkills" (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_order INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    custom_notes TEXT, -- Ghi chÃº tÃ¹y chá»‰nh cho template nÃ y
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES "Templates"(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES "Skills"(id) ON DELETE RESTRICT,
    
    UNIQUE (template_id, skill_id)
);

-- ============================================
-- 9. EDUCATION_PLANS TABLE (Káº¿ hoáº¡ch giÃ¡o dá»¥c)
-- ============================================
CREATE TABLE IF NOT EXISTS "EducationPlans" (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    template_id INTEGER, -- Template Ä‘Æ°á»£c sá»­ dá»¥ng (náº¿u cÃ³)
    teacher_id INTEGER NOT NULL, -- GiÃ¡o viÃªn soáº¡n
    kindergarten_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'approved')),
    -- draft: Ä‘ang soáº¡n, completed: hoÃ n thÃ nh, submitted: Ä‘Ã£ ná»™p, approved: Ä‘Ã£ phÃª duyá»‡t
    approved_by INTEGER, -- Admin/Principal phÃª duyá»‡t
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (child_id) REFERENCES "Children"(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES "Users"(id) ON DELETE RESTRICT,
    FOREIGN KEY (kindergarten_id) REFERENCES "Kindergartens"(id) ON DELETE RESTRICT,
    FOREIGN KEY (template_id) REFERENCES "Templates"(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES "Users"(id) ON DELETE SET NULL,
    
    UNIQUE (child_id, month, year) -- Má»™t káº¿ hoáº¡ch/tráº»/thÃ¡ng/nÄƒm
);

-- ============================================
-- 10. PLAN_SKILLS TABLE (Skill trong káº¿ hoáº¡ch)
-- ============================================
CREATE TABLE IF NOT EXISTS "PlanSkills" (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_order INT DEFAULT 0,
    additional_instructions TEXT, -- HÆ°á»›ng dáº«n bá»• sung riÃªng cho tráº» nÃ y
    learning_materials TEXT, -- Äá»“ dÃ¹ng há»c táº­p cáº§n thiáº¿t
    is_included BOOLEAN DEFAULT TRUE, -- CÃ³ Ã¡p dá»¥ng trong káº¿ hoáº¡ch nÃ y khÃ´ng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES "EducationPlans"(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES "Skills"(id) ON DELETE RESTRICT,
    
    UNIQUE (plan_id, skill_id)
);

-- ============================================
-- 11. EVALUATION_RESULTS TABLE (Káº¿t quáº£ Ä‘Ã¡nh giÃ¡)
-- ============================================
CREATE TABLE IF NOT EXISTS "EvaluationResults" (
    id SERIAL PRIMARY KEY,
    plan_skill_id INTEGER NOT NULL,
    evaluation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('achieved', 'not_achieved', 'partial', 'pending')),
    -- achieved: Ä‘áº¡t, not_achieved: chÆ°a Ä‘áº¡t, partial: cÃ³ tiáº¿n bá»™, pending: chÆ°a Ä‘Ã¡nh giÃ¡
    notes TEXT, -- Nháº­n xÃ©t chi tiáº¿t
    evidence_url TEXT, -- URL áº£nh/video báº±ng chá»©ng (optional)
    evaluated_by INTEGER NOT NULL, -- GiÃ¡o viÃªn Ä‘Ã¡nh giÃ¡
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_skill_id) REFERENCES "PlanSkills"(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES "Users"(id) ON DELETE RESTRICT,
    
    UNIQUE (plan_skill_id, evaluation_date) -- Má»™t Ä‘Ã¡nh giÃ¡/skill/ngÃ y
);

-- ============================================
-- 12. ACTIVITY_LOGS TABLE (Lá»‹ch sá»­ hoáº¡t Ä‘á»™ng)
-- ============================================
CREATE TABLE IF NOT EXISTS "ActivityLogs" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, EXPORT, APPROVE
    entity_type VARCHAR(50) NOT NULL, -- EducationPlan, EvaluationResult, etc
    entity_id INTEGER,
    old_value JSONB, -- GiÃ¡ trá»‹ cÅ© (Ä‘á»ƒ cÃ³ thá»ƒ rollback náº¿u cáº§n)
    new_value JSONB, -- GiÃ¡ trá»‹ má»›i
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);
CREATE INDEX idx_users_kindergarten_id ON "Users"(kindergarten_id);

-- Children indexes
CREATE INDEX idx_children_kindergarten_id ON "Children"(kindergarten_id);
CREATE INDEX idx_children_teacher_id ON "Children"(teacher_id);
CREATE INDEX idx_children_is_active ON "Children"(is_active);

-- Skills indexes
CREATE INDEX idx_skills_area_id ON "Skills"(development_area_id);
CREATE INDEX idx_skills_is_template ON "Skills"(is_template);
CREATE INDEX idx_skills_created_by ON "Skills"(created_by);
CREATE INDEX idx_skills_deleted_at ON "Skills"(deleted_at);

-- EducationPlans indexes
CREATE INDEX idx_education_plans_child_id ON "EducationPlans"(child_id);
CREATE INDEX idx_education_plans_teacher_id ON "EducationPlans"(teacher_id);
CREATE INDEX idx_education_plans_kindergarten_id ON "EducationPlans"(kindergarten_id);
CREATE INDEX idx_education_plans_status ON "EducationPlans"(status);
CREATE INDEX idx_education_plans_month_year ON "EducationPlans"(month, year);
CREATE INDEX idx_education_plans_child_month_year ON "EducationPlans"(child_id, month, year);

-- PlanSkills indexes
CREATE INDEX idx_plan_skills_plan_id ON "PlanSkills"(plan_id);
CREATE INDEX idx_plan_skills_skill_id ON "PlanSkills"(skill_id);

-- EvaluationResults indexes
CREATE INDEX idx_evaluation_results_plan_skill_id ON "EvaluationResults"(plan_skill_id);
CREATE INDEX idx_evaluation_results_evaluated_by ON "EvaluationResults"(evaluated_by);
CREATE INDEX idx_evaluation_results_status ON "EvaluationResults"(status);
CREATE INDEX idx_evaluation_results_date ON "EvaluationResults"(evaluation_date);

-- TemplateSkills indexes
CREATE INDEX idx_template_skills_template_id ON "TemplateSkills"(template_id);
CREATE INDEX idx_template_skills_skill_id ON "TemplateSkills"(skill_id);

-- ActivityLogs indexes
CREATE INDEX idx_activity_logs_user_id ON "ActivityLogs"(user_id);
CREATE INDEX idx_activity_logs_entity_type_id ON "ActivityLogs"(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON "ActivityLogs"(created_at);

-- ============================================
-- VIEWS for Common Queries
-- ============================================

-- View: Tá»•ng quan káº¿ hoáº¡ch
CREATE OR REPLACE VIEW "PlanSummary" AS
SELECT 
    ep.id,
    ep.child_id,
    c.fullName as child_name,
    ep.month,
    ep.year,
    ep.teacher_id,
    u.fullName as teacher_name,
    ep.status,
    COUNT(ps.id) as total_skills,
    SUM(CASE WHEN er.status = 'achieved' THEN 1 ELSE 0 END) as achieved_count,
    SUM(CASE WHEN er.status = 'partial' THEN 1 ELSE 0 END) as partial_count,
    SUM(CASE WHEN er.status = 'not_achieved' THEN 1 ELSE 0 END) as not_achieved_count,
    ep.created_at,
    ep.updated_at
FROM "EducationPlans" ep
JOIN "Children" c ON ep.child_id = c.id
JOIN "Users" u ON ep.teacher_id = u.id
LEFT JOIN "PlanSkills" ps ON ep.id = ps.plan_id
LEFT JOIN "EvaluationResults" er ON ps.id = er.plan_skill_id
WHERE ep.deleted_at IS NULL
GROUP BY ep.id, c.id, u.id;

-- View: Tiáº¿n Ä‘á»™ há»c sinh
CREATE OR REPLACE VIEW "ChildProgress" AS
SELECT 
    c.id as child_id,
    c.fullName as child_name,
    ep.id as plan_id,
    ep.month,
    ep.year,
    da.id as area_id,
    da.name as area_name,
    COUNT(DISTINCT s.id) as total_skills,
    COUNT(DISTINCT CASE WHEN er.status = 'achieved' THEN s.id END) as achieved_skills,
    ROUND(
        COUNT(DISTINCT CASE WHEN er.status = 'achieved' THEN s.id END)::numeric / 
        COUNT(DISTINCT s.id) * 100, 
        2
    ) as achievement_percentage
FROM "Children" c
JOIN "EducationPlans" ep ON c.id = ep.child_id
JOIN "PlanSkills" ps ON ep.id = ps.plan_id
JOIN "Skills" s ON ps.skill_id = s.id
JOIN "DevelopmentAreas" da ON s.development_area_id = da.id
LEFT JOIN "EvaluationResults" er ON ps.id = er.plan_skill_id AND er.status = 'achieved'
WHERE ep.deleted_at IS NULL AND c.deleted_at IS NULL
GROUP BY c.id, c.fullName, ep.id, da.id, da.name, ep.month, ep.year;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE "Users" IS 'NgÆ°á»i dÃ¹ng há»‡ thá»‘ng (GiÃ¡o viÃªn, Admin, Phá»¥ huynh)';
COMMENT ON TABLE "Children" IS 'Danh sÃ¡ch tráº» em Ä‘ang theo há»c';
COMMENT ON TABLE "DevelopmentAreas" IS '4 lÄ©nh vá»±c phÃ¡t triá»ƒn: Váº­n Ä‘á»™ng thÃ´, Váº­n Ä‘á»™ng tinh, Nháº­n biáº¿t ngÃ´n ngá»¯, CÃ¡ nhÃ¢n & XÃ£ há»™i';
COMMENT ON TABLE "Skills" IS 'Ká»¹ nÄƒng/Má»¥c tiÃªu há»c táº­p chi tiáº¿t';
COMMENT ON TABLE "EducationPlans" IS 'Káº¿ hoáº¡ch giÃ¡o dá»¥c cÃ¡ nhÃ¢n cho má»—i tráº»/thÃ¡ng/nÄƒm';
COMMENT ON TABLE "EvaluationResults" IS 'Káº¿t quáº£ Ä‘Ã¡nh giÃ¡ tá»«ng ká»¹ nÄƒng';

-- ============================================
-- GRANT PERMISSIONS (Tuá»³ chá»‰nh theo environment)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
