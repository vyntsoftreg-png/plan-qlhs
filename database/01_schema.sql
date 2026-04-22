-- ============================================
-- DATABASE SCHEMA: QLHS (Quản lý học sinh)
-- Education Planning System for Special Children
-- ============================================
-- Version: 1.0
-- Created: 2026-04-13
-- Database: PostgreSQL 12+

-- ============================================
-- 1. USERS TABLE (Người dùng)
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
-- 2. KINDERGARTENS TABLE (Trường mầm non)
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
-- 3. DEVELOPMENT_AREAS TABLE (4 Lĩnh vực phát triển)
-- ============================================
CREATE TABLE IF NOT EXISTS "DevelopmentAreas" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    -- Fixed values: 'Vận động thô', 'Vận động tinh', 'Nhận biết ngôn ngữ & Tư duy', 'Cá nhân & Xã hội'
    description TEXT,
    color_code VARCHAR(7), -- HEX color for UI
    icon_name VARCHAR(100), -- Material Icon name
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. SKILLS TABLE (Kỹ năng/Mục tiêu)
-- ============================================
CREATE TABLE IF NOT EXISTS "Skills" (
    id SERIAL PRIMARY KEY,
    development_area_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instruction_text TEXT, -- Hướng dẫn chi tiết
    teaching_method TEXT, -- Cách dạy, các bước
    learning_objectives TEXT, -- Mục tiêu học tập
    display_order INT DEFAULT 0,
    is_template BOOLEAN DEFAULT TRUE, -- Là kỹ năng mẫu chuẩn
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (development_area_id) REFERENCES "DevelopmentAreas"(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES "Users"(id) ON DELETE RESTRICT,
    
    UNIQUE (development_area_id, name) -- Không cho phép skill trùng tên trong cùng lĩnh vực
);

-- ============================================
-- 5. SKILL_IMAGES TABLE (Ảnh minh họa)
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
-- 6. CHILDREN TABLE (Trẻ em)
-- ============================================
CREATE TABLE IF NOT EXISTS "Children" (
    id SERIAL PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    kindergarten_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL, -- Giáo viên chủ nhiệm (chính)
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    special_notes TEXT, -- Ghi chú đặc biệt
    enrollment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (kindergarten_id) REFERENCES "Kindergartens"(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES "Users"(id) ON DELETE RESTRICT
);

-- ============================================
-- 7. TEMPLATES TABLE (Mẫu kế hoạch)
-- ============================================
CREATE TABLE IF NOT EXISTS "Templates" (
    id SERIAL PRIMARY KEY,
    kindergarten_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(50), -- VD: '4-5 tuổi', '3-4 tuổi'
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT,
    is_default BOOLEAN DEFAULT FALSE, -- Mẫu mặc định
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
    custom_notes TEXT, -- Ghi chú tùy chỉnh cho template này
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES "Templates"(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES "Skills"(id) ON DELETE RESTRICT,
    
    UNIQUE (template_id, skill_id)
);

-- ============================================
-- 9. EDUCATION_PLANS TABLE (Kế hoạch giáo dục)
-- ============================================
CREATE TABLE IF NOT EXISTS "EducationPlans" (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    template_id INTEGER, -- Template được sử dụng (nếu có)
    teacher_id INTEGER NOT NULL, -- Giáo viên soạn
    kindergarten_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'approved')),
    -- draft: đang soạn, completed: hoàn thành, submitted: đã nộp, approved: đã phê duyệt
    approved_by INTEGER, -- Admin/Principal phê duyệt
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
    
    UNIQUE (child_id, month, year) -- Một kế hoạch/trẻ/tháng/năm
);

-- ============================================
-- 10. PLAN_SKILLS TABLE (Skill trong kế hoạch)
-- ============================================
CREATE TABLE IF NOT EXISTS "PlanSkills" (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_order INT DEFAULT 0,
    additional_instructions TEXT, -- Hướng dẫn bổ sung riêng cho trẻ này
    learning_materials TEXT, -- Đồ dùng học tập cần thiết
    is_included BOOLEAN DEFAULT TRUE, -- Có áp dụng trong kế hoạch này không
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES "EducationPlans"(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES "Skills"(id) ON DELETE RESTRICT,
    
    UNIQUE (plan_id, skill_id)
);

-- ============================================
-- 11. EVALUATION_RESULTS TABLE (Kết quả đánh giá)
-- ============================================
CREATE TABLE IF NOT EXISTS "EvaluationResults" (
    id SERIAL PRIMARY KEY,
    plan_skill_id INTEGER NOT NULL,
    evaluation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('achieved', 'not_achieved', 'partial', 'pending')),
    -- achieved: đạt, not_achieved: chưa đạt, partial: có tiến bộ, pending: chưa đánh giá
    notes TEXT, -- Nhận xét chi tiết
    evidence_url TEXT, -- URL ảnh/video bằng chứng (optional)
    evaluated_by INTEGER NOT NULL, -- Giáo viên đánh giá
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_skill_id) REFERENCES "PlanSkills"(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES "Users"(id) ON DELETE RESTRICT,
    
    UNIQUE (plan_skill_id, evaluation_date) -- Một đánh giá/skill/ngày
);

-- ============================================
-- 12. ACTIVITY_LOGS TABLE (Lịch sử hoạt động)
-- ============================================
CREATE TABLE IF NOT EXISTS "ActivityLogs" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, EXPORT, APPROVE
    entity_type VARCHAR(50) NOT NULL, -- EducationPlan, EvaluationResult, etc
    entity_id INTEGER,
    old_value JSONB, -- Giá trị cũ (để có thể rollback nếu cần)
    new_value JSONB, -- Giá trị mới
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

-- View: Tổng quan kế hoạch
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

-- View: Tiến độ học sinh
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

COMMENT ON TABLE "Users" IS 'Người dùng hệ thống (Giáo viên, Admin, Phụ huynh)';
COMMENT ON TABLE "Children" IS 'Danh sách trẻ em đang theo học';
COMMENT ON TABLE "DevelopmentAreas" IS '4 lĩnh vực phát triển: Vận động thô, Vận động tinh, Nhận biết ngôn ngữ, Cá nhân & Xã hội';
COMMENT ON TABLE "Skills" IS 'Kỹ năng/Mục tiêu học tập chi tiết';
COMMENT ON TABLE "EducationPlans" IS 'Kế hoạch giáo dục cá nhân cho mỗi trẻ/tháng/năm';
COMMENT ON TABLE "EvaluationResults" IS 'Kết quả đánh giá từng kỹ năng';

-- ============================================
-- GRANT PERMISSIONS (Tuỳ chỉnh theo environment)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
