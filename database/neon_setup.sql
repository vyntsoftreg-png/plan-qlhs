-- ============================================
-- NEON.TECH DATABASE SETUP SCRIPT
-- ============================================
-- Chạy file này trên Neon SQL Editor sau khi tạo project
-- Thứ tự: neon_setup.sql → (tự động tạo bảng + data mẫu)

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES (lowercase - compatible with backend code)
-- ============================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'admin', 'parent', 'principal')),
    kindergarten_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. KINDERGARTENS
CREATE TABLE IF NOT EXISTS kindergartens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    principal_id INTEGER,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (principal_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add FK to users
ALTER TABLE users 
ADD CONSTRAINT fk_users_kindergarten 
FOREIGN KEY (kindergarten_id) REFERENCES kindergartens(id) ON DELETE SET NULL;

-- 3. DEVELOPMENT_AREAS
CREATE TABLE IF NOT EXISTS development_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7),
    icon_name VARCHAR(100),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SKILLS
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    development_area_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instruction_text TEXT,
    teaching_method TEXT,
    learning_objectives TEXT,
    display_order INT DEFAULT 0,
    is_template BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (development_area_id) REFERENCES development_areas(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE (development_area_id, name)
);

-- 5. SKILL_IMAGES
CREATE TABLE IF NOT EXISTS skill_images (
    id SERIAL PRIMARY KEY,
    skill_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    image_order INT DEFAULT 0,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 6. CHILDREN
CREATE TABLE IF NOT EXISTS children (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    kindergarten_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    special_notes TEXT,
    enrollment_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (kindergarten_id) REFERENCES kindergartens(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 7. TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    kindergarten_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(50),
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (kindergarten_id) REFERENCES kindergartens(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 8. TEMPLATE_SKILLS
CREATE TABLE IF NOT EXISTS template_skills (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_order INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    custom_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
    UNIQUE (template_id, skill_id)
);

-- 9. EDUCATION_PLANS
CREATE TABLE IF NOT EXISTS education_plans (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    template_id INTEGER,
    teacher_id INTEGER NOT NULL,
    kindergarten_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'approved')),
    approved_by INTEGER,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (kindergarten_id) REFERENCES kindergartens(id) ON DELETE RESTRICT,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (child_id, month, year)
);

-- 10. PLAN_SKILLS
CREATE TABLE IF NOT EXISTS plan_skills (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    skill_order INT DEFAULT 0,
    additional_instructions TEXT,
    learning_materials TEXT,
    is_included BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES education_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
    UNIQUE (plan_id, skill_id)
);

-- 11. EVALUATION_RESULTS
CREATE TABLE IF NOT EXISTS evaluation_results (
    id SERIAL PRIMARY KEY,
    plan_skill_id INTEGER NOT NULL,
    evaluation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('achieved', 'not_achieved', 'partial', 'pending')),
    notes TEXT,
    evidence_url TEXT,
    evaluated_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_skill_id) REFERENCES plan_skills(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE (plan_skill_id, evaluation_date)
);

-- 12. ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kindergarten_id ON users(kindergarten_id);
CREATE INDEX IF NOT EXISTS idx_children_kindergarten_id ON children(kindergarten_id);
CREATE INDEX IF NOT EXISTS idx_children_teacher_id ON children(teacher_id);
CREATE INDEX IF NOT EXISTS idx_children_is_active ON children(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_area_id ON skills(development_area_id);
CREATE INDEX IF NOT EXISTS idx_skills_is_template ON skills(is_template);
CREATE INDEX IF NOT EXISTS idx_skills_created_by ON skills(created_by);
CREATE INDEX IF NOT EXISTS idx_skills_deleted_at ON skills(deleted_at);
CREATE INDEX IF NOT EXISTS idx_education_plans_child_id ON education_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_education_plans_teacher_id ON education_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_education_plans_kindergarten_id ON education_plans(kindergarten_id);
CREATE INDEX IF NOT EXISTS idx_education_plans_status ON education_plans(status);
CREATE INDEX IF NOT EXISTS idx_education_plans_month_year ON education_plans(month, year);
CREATE INDEX IF NOT EXISTS idx_plan_skills_plan_id ON plan_skills(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_skills_skill_id ON plan_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_plan_skill_id ON evaluation_results(plan_skill_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_status ON evaluation_results(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_date ON evaluation_results(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_template_skills_template_id ON template_skills(template_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_plans_updated_at BEFORE UPDATE ON education_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plan_skills_updated_at BEFORE UPDATE ON plan_skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_results_updated_at BEFORE UPDATE ON evaluation_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED: Development Areas (4 lĩnh vực)
-- ============================================
INSERT INTO development_areas (name, description, color_code, icon_name, display_order) VALUES
('Vận động thô', 'Phát triển các kỹ năng vận động lớn', '#4CAF50', 'directions_run', 1),
('Vận động tinh', 'Phát triển các kỹ năng vận động nhỏ, tinh tế', '#2196F3', 'precision_manufacturing', 2),
('Nhận biết ngôn ngữ & Tư duy', 'Phát triển ngôn ngữ, nhận thức và tư duy', '#FF9800', 'psychology', 3),
('Cá nhân & Xã hội', 'Phát triển kỹ năng cá nhân và xã hội', '#9C27B0', 'groups', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- DONE! 
-- ============================================
-- Sau khi chạy xong file này, bạn có thể gọi API /auth/setup để tạo admin account
