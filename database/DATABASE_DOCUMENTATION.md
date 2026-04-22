# 📊 DATABASE DOCUMENTATION

## 1. SCHEMA OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    QLHS SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

                              Organizations
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   Kindergartens                Users               DevelopmentAreas
   (Trường mầm non)     (Giáo viên, Admin)      (4 lĩnh vực)
        │                           │                    │
        ├─────────┬─────────────────┤                    │
        │         │                 │                    │
    Children    Teachers       Skills ◄──────────────────┘
    (Trẻ em)   (Users)        (Kỹ năng)
        │         │                 │
        └────┬────┘                 ├─► SkillImages
             │                      │   (Ảnh minh họa)
             │                      │
        EducationPlans ◄────────────┘
        (Kế hoạch)
             │
        PlanSkills ◄────────────────┐
        (Skill trong KH)            │
             │                      │
        EvaluationResults ◄─────────┘
        (Kết quả đánh giá)
```

---

## 2. TABLE DESCRIPTION

### 1.1 Users (Người dùng)
```
Mục đích: Lưu thông tin người dùng (Giáo viên, Admin, Phụ huynh)

Cột chính:
- id: UUID duy nhất
- email: Email đăng nhập (unique)
- password_hash: Mật khẩu đã mã hóa (bcrypt)
- fullName: Tên đầy đủ
- role: Vai trò (teacher/admin/parent/principal)
- kindergarten_id: Trường mầm non (FK)
- is_active: Trạng thái hoạt động
- last_login: Lần đăng nhập cuối

Quan hệ:
- (1) User → (M) Children (giáo viên chủ nhiệm)
- (1) User → (M) EducationPlans (soạn kế hoạch)
- (1) User → (M) Skills (tạo kỹ năng)
- (1) User → (M) EvaluationResults (đánh giá)
```

### 1.2 Kindergartens (Trường mầm non)
```
Mục đích: Quản lý thông tin trường mầm non

Cột chính:
- id: Định danh duy nhất
- name: Tên trường (unique)
- address: Địa chỉ
- phone: Số điện thoại
- principal_id: Hiệu trưởng (FK → Users)
- logo_url: URL logo
- is_active: Trạng thái hoạt động

Quan hệ:
- (1) Kindergarten → (M) Users
- (1) Kindergarten → (M) Children
- (1) Kindergarten → (M) EducationPlans
- (1) Kindergarten → (M) Templates
```

### 1.3 DevelopmentAreas (4 Lĩnh vực phát triển)
```
Mục đích: Định nghĩa 4 lĩnh vực phát triển chuẩn

Các lĩnh vực chuẩn:
1. Vận động thô (Coarse Motor Skills)
2. Vận động tinh (Fine Motor Skills)
3. Nhận biết ngôn ngữ & Tư duy (Language & Cognition)
4. Cá nhân & Xã hội (Personal-Social)

Cột:
- id: Định danh
- name: Tên lĩnh vực (unique, cố định)
- description: Mô tả
- color_code: Mã màu UI (VD: #FF6B6B)
- icon_name: Tên icon Material Design

Quan hệ:
- (1) DevelopmentArea → (M) Skills
```

### 1.4 Skills (Kỹ năng/Mục tiêu)
```
Mục đích: Lưu danh sách kỹ năng/mục tiêu chuẩn

Cột chính:
- id: Định danh
- development_area_id: Lĩnh vực (FK)
- name: Tên kỹ năng (VD: "Ngồi lăn bóng")
- instruction_text: Hướng dẫn chi tiết
- teaching_method: Cách dạy, các bước
- learning_objectives: Mục tiêu chiéc đạt
- is_template: Là mẫu chuẩn hay tùy chỉnh
- created_by: Người tạo (FK → Users)
- deleted_at: Ngày xóa (soft delete)

Quan hệ:
- (1) Skill → (M) SkillImages
- (1) Skill → (M) PlanSkills
- (1) Skill → (M) TemplateSkills
```

### 1.5 SkillImages (Ảnh minh họa kỹ năng)
```
Mục đích: Lưu ảnh minh họa cho mỗi kỹ năng (rất quan trọng)

Cột ch chính:
- id: Định danh
- skill_id: Kỹ năng (FK)
- image_url: URL ảnh (Cloudinary/S3)
- alt_text: Mô tả ảnh
- image_order: Thứ tự ảnh
- uploaded_by: Người upload (FK → Users)
- uploaded_at: Thời gian upload

Quan hệ:
- (M) SkillImages → (1) Skill
```

### 1.6 Children (Trẻ em)
```
Mục đích: Lưu danh sách trẻ em

Cột chính:
- id: Định danh
- fullName: Tên đầy đủ
- date_of_birth: Ngày sinh
- gender: Giới tính
- kindergarten_id: Trường (FK)
- teacher_id: Giáo viên chủ nhiệm (FK)
- parent_phone: Điện thoại phụ huynh
- parent_email: Email phụ huynh
- special_notes: Ghi chú đặc biệt (VD: chậm phát triển)
- is_active: Trạng thái

Quan hệ:
- (M) Children → (1) Kindergarten
- (M) Children → (1) User (giáo viên chủ nhiệm)
- (1) Child → (M) EducationPlans
```

### 1.7 Templates (Mẫu kế hoạch)
```
Mục đích: Lưu các mẫu kế hoạch tiêu chuẩn

Cột chính:
- id: Định danh
- kindergarten_id: Trường (FK)
- name: Tên mẫu (VD: "Mẫu KH Tháng 4-5 cho trẻ 4-5 tuổi")
- description: Mô tả
- age_group: Nhóm tuổi (VD: "4-5 tuổi")
- month: Tháng (1-12)
- year: Năm
- is_default: Là mẫu mặc định
- created_by: Người tạo (FK → Users)

Quan hệ:
- (M) Template → (1) Kindergarten
- (1) Template → (M) TemplateSkills
```

### 1.8 TemplateSkills (Kỹ năng trong mẫu)
```
Mục đích: Liên kết kỹ năng với mẫu kế hoạch

Cột:
- id: Định danh
- template_id: Mẫu (FK)
- skill_id: Kỹ năng (FK)
- skill_order: Thứ tự
- is_required: Bắt buộc hay không
- custom_notes: Ghi chú tùy chỉnh

Quan hệ:
- (M) TemplateSkills → (1) Template
- (M) TemplateSkills → (1) Skill
```

### 1.9 EducationPlans (Kế hoạch giáo dục)
```
Mục đích: Lưu kế hoạch giáo dục cho mỗi trẻ/tháng/năm

Cột chính:
- id: Định danh
- child_id: Trẻ (FK)
- month: Tháng (1-12)
- year: Năm
- template_id: Mẫu sử dụng (FK, optional)
- teacher_id: Giáo viên soạn (FK)
- kindergarten_id: Trường (FK)
- status: Trạng thái
  - draft: đang soạn
  - completed: hoàn thành
  - submitted: đã nộp
  - approved: đã phê duyệt
- approved_by: Admin/Principal phê duyệt (FK, optional)
- approved_at: Ngày phê duyệt

Unique Constraint: (child_id, month, year) - không trùng lặp

Quan hệ:
- (M) EducationPlans → (1) Child
- (M) EducationPlans → (1) Kindergarten
- (M) EducationPlans → (1) User (giáo viên soạn)
- (M) EducationPlans → (1) Template
- (1) EducationPlan → (M) PlanSkills
```

### 1.10 PlanSkills (Kỹ năng trong kế hoạch)
```
Mục đích: Liên kết kỹ năng cụ thể với kế hoạch của trẻ

Cột chính:
- id: Định danh
- plan_id: Kế hoạch (FK)
- skill_id: Kỹ năng (FK)
- skill_order: Thứ tự
- additional_instructions: Hướng dẫn bổ sung riêng cho trẻ này
- learning_materials: Đồ dùng học tập cần thiết
- is_included: Có áp dụng không (mặc định true)

Unique Constraint: (plan_id, skill_id)

Quan hệ:
- (M) PlanSkills → (1) EducationPlan
- (M) PlanSkills → (1) Skill
- (1) PlanSkill → (M) EvaluationResults
```

### 1.11 EvaluationResults (Kết quả đánh giá)
```
Mục đích: Lưu kết quả đánh giá từng kỹ năng

Cột chính:
- id: Định danh
- plan_skill_id: Kỹ năng trong kế hoạch (FK)
- evaluation_date: Ngày đánh giá
- status: Trạng thái đạt được
  - achieved: đạt
  - not_achieved: chưa đạt
  - partial: có tiến bộ
  - pending: chưa đánh giá
- notes: Nhận xét chi tiết
- evidence_url: URL ảnh/video bằng chứng (optional)
- evaluated_by: Giáo viên đánh giá (FK)

Unique Constraint: (plan_skill_id, evaluation_date)

Quan hệ:
- (M) EvaluationResults → (1) PlanSkill
- (M) EvaluationResults → (1) User (giáo viên đánh giá)
```

### 1.12 ActivityLogs (Lịch sử hoạt động)
```
Mục đích: Ghi lịch sử tất cả các hành động (audit trail)

Cột:
- id: Định danh
- user_id: Người thực hiện (FK)
- action: Hành động (CREATE, UPDATE, DELETE, EXPORT, APPROVE)
- entity_type: Loại đối tượng
- entity_id: ID đối tượng
- old_value: Giá trị cũ (JSONB format)
- new_value: Giá trị mới
- ip_address: Địa chỉ IP
- created_at: Thời gian

Quan hệ:
- (M) ActivityLog → (1) User
```

---

## 3. KEY RELATIONSHIPS

### One-to-Many (1:M)
```
Kindergarten (1) ──── (M) Users
Kindergarten (1) ──── (M) Children
Kindergarten (1) ──── (M) EducationPlans
Kindergarten (1) ──── (M) Templates

User (1) ──── (M) Children (teacher_id)
User (1) ──── (M) Skills (created_by)
User (1) ──── (M) EducationPlans (teacher_id)
User (1) ──── (M) EvaluationResults (evaluated_by)

DevelopmentArea (1) ──── (M) Skills

Skill (1) ──── (M) SkillImages
Skill (1) ──── (M) PlanSkills
Skill (1) ──── (M) TemplateSkills

Template (1) ──── (M) TemplateSkills

Child (1) ──── (M) EducationPlans

EducationPlan (1) ──── (M) PlanSkills

PlanSkill (1) ──── (M) EvaluationResults
```

### Many-to-Many (M:M)
```
Template (M) ──── TemplateSkills ──── (M) Skill
EducationPlan (M) ──── PlanSkills ──── (M) Skill
```

---

## 4. INDEXES STRATEGY

### Performance-Critical Queries

#### Query 1: List all children of a kindergarten
```sql
SELECT * FROM Children WHERE kindergarten_id = ? AND deleted_at IS NULL;
```
**Index**: `idx_children_kindergarten_id`

#### Query 2: Get education plans for a child
```sql
SELECT * FROM EducationPlans 
WHERE child_id = ? AND deleted_at IS NULL
ORDER BY year DESC, month DESC;
```
**Index**: `idx_education_plans_child_id`

#### Query 3: Get skills by development area
```sql
SELECT * FROM Skills 
WHERE development_area_id = ? AND deleted_at IS NULL
ORDER BY display_order;
```
**Index**: `idx_skills_area_id`

#### Query 4: Get evaluation results for a plan
```sql
SELECT * FROM EvaluationResults 
WHERE plan_skill_id = ?
ORDER BY evaluation_date DESC;
```
**Index**: `idx_evaluation_results_plan_skill_id`

#### Query 5: Search education plans by month/year
```sql
SELECT * FROM EducationPlans 
WHERE kindergarten_id = ? AND month = ? AND year = ?
AND status IN ('submitted', 'approved');
```
**Index**: Composite - `idx_education_plans_month_year`

---

## 5. VIEWS

### View 1: PlanSummary
**Mục đích**: Xem tổng quan kế hoạch với thống kê

```
Cột: id, child_id, child_name, month, year, teacher_id, 
     teacher_name, status, total_skills, achieved_count, 
     partial_count, not_achieved_count
```

**Ví dụ kết quả**:
| child_name | month | total_skills | achieved | partial | not_achieved |
|-----------|-------|--------------|----------|---------|--------------|
| Yến Nhi   | 4     | 14           | 8        | 2       | 4            |
| Minh Anh  | 4     | 14           | 10       | 2       | 2            |

### View 2: ChildProgress
**Mục đích**: Xem tiến độ học sinh theo từng lĩnh vực

```
Cột: child_id, child_name, plan_id, month, year, area_id, 
     area_name, total_skills, achieved_skills, achievement_percentage
```

**Ví dụ kết quả**:
| child_name | area_name | month | total | achieved | % |
|-----------|-----------|-------|-------|----------|---|
| Yến Nhi | Vận động thô | 4 | 2 | 1 | 50 |
| Yến Nhi | Vận động tinh | 4 | 2 | 2 | 100 |

---

## 6. DATA TYPES GUIDE

| Data Type | Usage | Example |
|-----------|-------|---------|
| SERIAL | Auto-increment ID | `id SERIAL PRIMARY KEY` |
| VARCHAR(n) | Text with max length | `name VARCHAR(255)` |
| TEXT | Unlimited text | `instruction_text TEXT` |
| DATE | Date only | `date_of_birth DATE` |
| TIMESTAMP | Date + Time | `created_at TIMESTAMP` |
| BOOLEAN | True/False | `is_active BOOLEAN` |
| JSONB | JSON binary | `old_value JSONB` |
| INT | Integer | `month INT` |

---

## 7. CONSTRAINTS

### Primary Key (PK)
```
Mỗi table có 1 primary key duy nhất để định danh
```

### Foreign Key (FK)
```
ON DELETE RESTRICT: Không xóa nếu có tham chiếu
ON DELETE CASCADE: Tự động xóa dữ liệu con
ON DELETE SET NULL: Set FK thành NULL
```

### Unique Constraint
```
email: Không ai dùng email 2 lần
(child_id, month, year): Không trùng kế hoạch
(plan_id, skill_id): Không chèn skill lặp
```

### Check Constraint
```
role IN ('teacher', 'admin', 'parent', 'principal')
gender IN ('male', 'female', 'other')
month BETWEEN 1 AND 12
status IN ('draft', 'completed', 'submitted', 'approved')
```

---

## 8. SAMPLE QUERIES

### 1. Get all plans for a teacher this month
```sql
SELECT 
    ep.id,
    c.fullName as child_name,
    ep.month, ep.year,
    COUNT(ps.id) as total_skills,
    ep.status
FROM EducationPlans ep
JOIN Children c ON ep.child_id = c.id
LEFT JOIN PlanSkills ps ON ep.id = ps.plan_id
WHERE ep.teacher_id = $1 
  AND ep.month = $2
  AND ep.year = $3
  AND ep.deleted_at IS NULL
GROUP BY ep.id, c.fullName;
```

### 2. Get child progress for a specific month
```sql
SELECT 
    da.name as area_name,
    COUNT(s.id) as total_skills,
    COUNT(CASE WHEN er.status = 'achieved' THEN 1 END) as achieved,
    ROUND(COUNT(CASE WHEN er.status = 'achieved' THEN 1 END)::numeric / 
          COUNT(s.id) * 100, 2) as percentage
FROM EducationPlans ep
JOIN PlanSkills ps ON ep.id = ps.plan_id
JOIN Skills s ON ps.skill_id = s.id
JOIN DevelopmentAreas da ON s.development_area_id = da.id
LEFT JOIN EvaluationResults er ON ps.id = er.plan_skill_id 
  AND er.status = 'achieved'
WHERE ep.child_id = $1 
  AND ep.month = $2 
  AND ep.year = $3
GROUP BY da.id, da.name;
```

### 3. Get all evaluations not yet done
```sql
SELECT 
    c.fullName,
    s.name as skill_name,
    da.name as area_name,
    ep.month, ep.year
FROM PlanSkills ps
JOIN EducationPlans ep ON ps.plan_id = ep.id
JOIN Children c ON ep.child_id = c.id
JOIN Skills s ON ps.skill_id = s.id
JOIN DevelopmentAreas da ON s.development_area_id = da.id
LEFT JOIN EvaluationResults er ON ps.id = er.plan_skill_id
WHERE er.id IS NULL
  AND ep.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND ep.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY c.fullName, da.display_order;
```

---

## 9. BACKUP & RESTORE STRATEGY

### Full Backup
```bash
pg_dump -U postgres -d qlhs_dev > backup.sql
```

### Partial Backup (specific table)
```bash
pg_dump -U postgres -t "EducationPlans" -d qlhs_dev > plans_backup.sql
```

### Restore
```bash
psql -U postgres -d qlhs_dev < backup.sql
```

---

## 10. MIGRATION NOTES

- All migration scripts in `/database/` folder
- Follow naming convention: `NN_description.sql`
- Test on staging before production
- Keep backup before each migration
- Document breaking changes

---

## 11. SECURITY CONSIDERATIONS

1. **Passwords**: Always hash with bcrypt before storing
2. **SQL Injection**: Use parameterized queries
3. **Row-Level Security**: Consider for multi-tenant apps
4. **Audit Trail**: All changes logged in ActivityLogs
5. **Access Control**: Use database roles with least privilege
6. **Encryption**: Sensitive data should be encrypted at rest

---

**Last Updated**: 2026-04-13  
**Version**: 1.0  
**Status**: Production-Ready ✓
