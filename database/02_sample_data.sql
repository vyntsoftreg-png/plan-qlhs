-- ============================================
-- SAMPLE DATA for Testing
-- ============================================

-- ============================================
-- 1. INSERT KINDERGARTENS
-- ============================================
INSERT INTO "Kindergartens" (name, address, phone, logo_url) VALUES
('Trường Mầm Non Quốc Tế ABC', 'P. Long Thuận, Tp. HCM', '0123456789', 'https://example.com/logo1.png'),
('Trường Mầm Non Hoa Hồng', '123 Nguyễn Huệ, Quận 1', '0987654321', 'https://example.com/logo2.png'),
('Trường Mầm Non Thần Tiên', '456 Fake St, District 2', '0912345678', 'https://example.com/logo3.png');

-- ============================================
-- 2. INSERT USERS
-- ============================================
-- Password hashed samples (bcrypt): all use password '123456'
-- In production use bcrypt hash
INSERT INTO "Users" (email, password_hash, fullName, phone, role, kindergarten_id) VALUES
-- Admin
('admin@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example1', 'Cô An', '0123456789', 'admin', 1),

-- Teachers at Kindergarten 1
('teacher1@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example2', 'Võ Thị Thanh Thúy', '0912345671', 'teacher', 1),
('teacher2@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example3', 'Nguyễn Thị Minh', '0912345672', 'teacher', 1),
('teacher3@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example4', 'Trần Thị Thu Hương', '0912345673', 'teacher', 1),

-- Teachers at Kindergarten 2
('teacher4@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example5', 'Phạm Thị Hoa', '0912345674', 'teacher', 2),

-- Principal
('principal@qlhs.com', '$2b$10$X5fzVmNxZz8nKw6xYz5lJ.example6', 'Thạc Sĩ Lê Long Thuận', '0123456788', 'principal', 1);

-- ============================================
-- 3. INSERT DEVELOPMENT AREAS
-- ============================================
INSERT INTO "DevelopmentAreas" (name, description, color_code, icon_name, display_order) VALUES
('Vận động thô', 'Kỹ năng chuyển động cơ thể: chạy, nhảy, cân bằng, lăn bóng', '#FF6B6B', 'directions_run', 1),
('Vận động tinh', 'Kỹ năng kiểm soát cơ tinh: cầm nắm, cắm, xếp, viết, vẽ', '#4ECDC4', 'edit', 2),
('Nhận biết ngôn ngữ & Tư duy', 'Phát triển khả năng giao tiếp: nghe, nói, hiểu, nhận biết số, hình, màu', '#45B7D1', 'school', 3),
('Cá nhân & Xã hội', 'Kỹ năng sống độc lập và tương tác xã hội: tự chăm sóc, hành vi, giao tiếp', '#FFA07A', 'people', 4);

-- ============================================
-- 4. INSERT SKILLS (Mẫu chuẩn)
-- ============================================
-- Vận động thô (Area ID: 1)
INSERT INTO "Skills" (development_area_id, name, description, instruction_text, teaching_method, display_order, created_by) VALUES
(1, 'Ngồi lăn bóng về phía trước', 'Kỹ năng lăn bóng về phía trước khi đang ngồi', 
'Cô chuẩn bị 1 quả bóng, báo cho trẻ thực hiện. Trẻ ngồi dưới sàn hai chân dang rộng, các ngón tay ôm nhẹ và bao quanh phía sau quả bóng, hai bàn tay xoè rộng ôm nhẹ bóng, mắt nhìn thẳng. Khi có hiệu lệnh dùng lực cánh tay và bàn tay đẩy bóng từ từ lăn về phía trước.',
'1. Cô làm mẫu để trẻ quan sát\n2. Cô hỗ trợ khi trẻ chưa tự lăn bóng\n3. Từ từ giảm dần sự hỗ trợ cho tới khi trẻ tự lăn bóng được', 1, 2),

(1, 'Nghiêng người sang 2 bên', 'Kỹ năng cân bằng và kiểm soát cơ thể', 
'Khi cô ra hiệu lệnh con nghiêng người sang phải hoặc sang trái theo yêu cầu của cô. Cô có thể thực hiện multiple repetitions.',
'1. Cô làm mẫu động tác\n2. Hướng dẫn trẻ thực hiện\n3. Nâng cao độ khó với tốc độ và chiều khác nhau', 2, 2),

-- Vận động tinh (Area ID: 2)
INSERT INTO "Skills" (development_area_id, name, description, instruction_text, teaching_method, display_order, created_by) VALUES
(2, 'Rót nước vào ly chén không đổ, không trà ra ngoài', 'Kỹ năng kiểm soát cơ tinh - cuộc sống hàng ngày',
'Cô chuẩn bị 1 chai nước và 1 cái ly. Cô làm mẫu rót từ từ nước vào ly không tràn ly và không đổ ra ngoài. Hỗ trợ con đến khi con tự làm được.',
'1. Chuẩn bị dụng cụ an toàn\n2. Cô làm mẫu chậm\n3. Hỗ trợ cơ thể con\n4. Dần rút sự hỗ trợ', 1, 2),

(2, 'Đóng cọc bàn gỗ', 'Kỹ năng sử dụng dụng cụ, kiểm soát lực',
'Yêu cầu con cố định cây đinh vào lỗ, cầm búa đóng từ từ cây đinh vào bàn gỗ đến khi đầu cây đinh gần chạm vào bàn gỗ.',
'1. Hướng dẫn cách cầm búa\n2. Hỗ trợ hướng lực\n3. Tập rút sự hỗ trợ dần dần', 2, 2),

-- Nhận biết ngôn ngữ (Area ID: 3)
INSERT INTO "Skills" (development_area_id, name, description, instruction_text, teaching_method, display_order, created_by) VALUES
(3, 'Nhận biết số 6, 7', 'Kỹ năng nhận biết số cụ thể',
'Cô sử dụng thẻ số để dạy. Để các thẻ theo thứ tự từ 1 đến 7 và yêu cầu con chỉ theo cô và đọc.',
'1. Dùng thẻ số rơi lẻ\n2. Chỉ và nói tên\n3. Yêu cầu con chỉ', 1, 2),

(3, 'Nói được số 1, 2, 3, 4, 5 (tự nói không nói theo)', 'Kỹ năng nói tên số tự phát',
'Cô đọc thẻ và xào thẻ liên tục trước mặt trẻ. Yêu cầu con lấy thẻ theo yêu cầu của cô.',
'1. Ôn các số từ 1 đến 5\n2. Hỏi "cái này là số mấy?"\n3. Khuyến khích trẻ nói tự động', 2, 2),

(3, 'Nhận biết và nói được to - nhỏ', 'Kỹ năng so sánh kích cỡ',
'Yêu cầu con lấy vật to-nhỏ theo yêu cầu của cô từ các vật chuẩn bị sẵn.',
'1. Chuẩn bị các cặp vật to-nhỏ\n2. Chỉ và nói\n3. Yêu cầu con chỉ', 3, 2),

(3, 'Nhận biết hình ngôi sao', 'Kỹ năng nhận biết hình dạng',
'Ôn nhận biết 4 hình dạng: hình vuông, hình tròn, hình tam giác, hình trái tim. Nói được tên các hình đã học.',
'1. Dùng thẻ hình chuẩn\n2. Chỉ và nói tên\n3. Yêu cầu con lấy thẻ theo yêu cầu', 4, 2),

(3, 'Nhận biết màu cam và các màu cơ bản', 'Kỹ năng nhận biết màu sắc',
'Yêu cầu con lấy 5 thẻ màu tròn từ 8 thẻ màu sắc theo yêu cầu. Lấy vật thật tương ứng với màu.',
'1. Sử dụng thẻ màu chuẩn\n2. Chỉ các vật cùng màu\n3. Yêu cầu con tìm', 5, 2),

(3, 'Ôn nhận biết 6 đồ vật: ca, muỗng, chén, điện thoại, bồn rửa tay, thùng rác', 'Kỹ năng nhận biết đồ vật hàng ngày',
'Yêu cầu con tự bật nói tên 6 đồ vật khi cô hỏi. Sử dụng thẻ hình và đồ vật thật.',
'1. Chuẩn bị thẻ hình và đồ vật thật\n2. Chỉ và nói tên\n3. Yêu cầu con tự nói', 6, 2),

-- Cá nhân và Xã hội (Area ID: 4)
INSERT INTO "Skills" (development_area_id, name, description, instruction_text, teaching_method, display_order, created_by) VALUES
(4, 'Nói \"ạ\" mẹ con mới tới/về', 'Kỹ năng tôn trọng và chào hỏi',
'Hướng dẫn trẻ nói \"ạ\" khi gặp mẹ khi mới tới hoặc khi về nhà.',
'1. Làm mẫu cách nói\n2. Nhắc nhở khi thích hợp\n3. Khen ngợi khi thực hiện đúng', 1, 2),

(4, 'Tự lấy ghế ngồi vào bàn', 'Kỹ năng tự chăm sóc bản thân',
'Yêu cầu trẻ tự lấy ghế và kéo ghế vào dưới bàn trước khi ăn cơm.',
'1. Hướng dẫn cách làm\n2. Hỗ trợ ban đầu\n3. Rút hỗ trợ dần', 2, 2),

(4, 'Tự xúc cơm ăn, sau khi ăn xong con biết đi dẹp chén', 'Kỹ năng tự chăm sóc và trách nhiệm',
'Hướng dẫn trẻ tự xúc cơm từ nồi vào bát, ăn xong tự dẹp chén đặt vào nơi quy định.',
'1. Chuẩn bị dụng cụ an toàn\n2. Làm mẫu từng bước\n3. Yêu cầu trẻ thực hành', 3, 2),

(4, 'Biết chờ đợi khi chơi', 'Kỹ năng xã hội cơ bản',
'Khi chơi game tập thể, hướng dẫn trẻ biết chờ lượt của trẻ khác.',
'1. Giải thích luật chơi\n2. Nhắc nhở khi cần\n3. Khen ngợi khi chờ đợi đúng', 4, 2);

-- ============================================
-- 5. INSERT SKILL_IMAGES
-- ============================================
INSERT INTO "SkillImages" (skill_id, image_url, alt_text, uploaded_by) VALUES
(1, 'https://example.com/images/rolling-ball.jpg', 'Trẻ lăn bóng', 2),
(2, 'https://example.com/images/lean-sides.jpg', 'Trẻ nghiêng người sang 2 bên', 2),
(3, 'https://example.com/images/pouring-water.jpg', 'Trẻ rót nước vào ly', 2),
(8, 'https://example.com/images/numbers-6-7.jpg', 'Thẻ số 6 và 7', 2),
(10, 'https://example.com/images/big-small.jpg', 'Vật to và vật nhỏ', 2),
(11, 'https://example.com/images/star-shape.jpg', 'Hình ngôi sao', 2);

-- ============================================
-- 6. INSERT CHILDREN
-- ============================================
INSERT INTO "Children" (fullName, date_of_birth, gender, kindergarten_id, teacher_id, parent_phone, parent_email, special_notes) VALUES
('Võ Lê Yến Nhi', '2021-10-16', 'female', 1, 2, '0912111111', 'parent1@email.com', 'Trẻ chậm phát triển, cần sự hỗ trợ nhiều'),
('Nguyễn Minh Anh', '2021-11-20', 'female', 1, 2, '0912222222', 'parent2@email.com', 'Trẻ ổn định, phát triển bình thường'),
('Trần Bảo An', '2021-12-05', 'male', 1, 3, '0912333333', 'parent3@email.com', 'Trẻ hoạt động cao'),
('Phạm Thị Linh', '2021-9-15', 'female', 2, 4, '0912444444', 'parent4@email.com', 'Chậm phát triển về vận động'),
('Lê Minh Khoa', '2021-8-10', 'male', 1, 2, '0912555555', 'parent5@email.com', 'Phát triển bình thường');

-- ============================================
-- 7. INSERT TEMPLATES
-- ============================================
INSERT INTO "Templates" (kindergarten_id, name, description, age_group, month, year, is_default, created_by) VALUES
(1, 'Mẫu KH Tháng 4-5/2026 cho trẻ 4-5 tuổi', 'Mẫu kế hoạch chuẩn cho trẻ chậm phát triển độ tuổi 4-5', '4-5 tuổi', 4, 2026, TRUE, 2),
(1, 'Mẫu KH Tháng 3/2026 cho trẻ 4-5 tuổi', 'Mẫu kế hoạch tháng 3', '4-5 tuổi', 3, 2026, FALSE, 2),
(2, 'Mẫu KH Tháng 4-5/2026 cho trẻ 3-4 tuổi', 'Mẫu kế hoạch cho trẻ 3-4 tuổi', '3-4 tuổi', 4, 2026, TRUE, 4);

-- ============================================
-- 8. INSERT TEMPLATE_SKILLS
-- ============================================
-- Template 1 (Tháng 4-5 cho trẻ 4-5 tuổi)
INSERT INTO "TemplateSkills" (template_id, skill_id, skill_order, is_required) VALUES
(1, 1, 1, TRUE), -- Ngồi lăn bóng
(1, 2, 2, TRUE), -- Nghiêng người
(1, 3, 3, TRUE), -- Rót nước
(1, 4, 4, TRUE), -- Đóng cọc
(1, 8, 5, TRUE), -- Nhận biết số 6,7
(1, 9, 6, TRUE), -- Nói số 1-5
(1, 10, 7, TRUE), -- Nhận biết to-nhỏ
(1, 11, 8, TRUE), -- Nhận biết hình
(1, 12, 9, TRUE), -- Nhận biết màu
(1, 13, 10, TRUE), -- Nhận biết 6 đồ vật
(1, 14, 11, TRUE), -- Nói "ạ" mẹ
(1, 15, 12, TRUE), -- Tự lấy ghế
(1, 16, 13, TRUE), -- Tự xúc cơm
(1, 17, 14, TRUE); -- Biết chờ đợi

-- ============================================
-- 9. INSERT EDUCATION PLANS
-- ============================================
INSERT INTO "EducationPlans" (child_id, month, year, template_id, teacher_id, kindergarten_id, status) VALUES
(1, 4, 2026, 1, 2, 1, 'draft'), -- Yến Nhi - Tháng 4-5
(2, 4, 2026, 1, 2, 1, 'draft'), -- Minh Anh - Tháng 4-5
(3, 4, 2026, 1, 3, 1, 'draft'), -- Bảo An - Tháng 4-5
(1, 3, 2026, 2, 2, 1, 'approved'), -- Yến Nhi - Tháng 3 (đã phê duyệt)
(5, 4, 2026, 1, 2, 1, 'draft'); -- Minh Khoa - Tháng 4-5

-- ============================================
-- 10. INSERT PLAN_SKILLS (for plan 1 - Yến Nhi Tháng 4-5)
-- ============================================
INSERT INTO "PlanSkills" (plan_id, skill_id, skill_order, is_included) VALUES
(1, 1, 1, TRUE),
(1, 2, 2, TRUE),
(1, 3, 3, TRUE),
(1, 4, 4, TRUE),
(1, 8, 5, TRUE),
(1, 9, 6, TRUE),
(1, 10, 7, TRUE),
(1, 11, 8, TRUE),
(1, 12, 9, TRUE),
(1, 13, 10, TRUE),
(1, 14, 11, TRUE),
(1, 15, 12, TRUE),
(1, 16, 13, TRUE),
(1, 17, 14, TRUE);

-- ============================================
-- 11. INSERT EVALUATION_RESULTS (for sample data)
-- ============================================
INSERT INTO "EvaluationResults" (plan_skill_id, evaluation_date, status, notes, evaluated_by) VALUES
(1, '2026-04-15', 'achieved', 'Trẻ lăn bóng tốt, cần giảm hỗ trợ thêm', 2),
(2, '2026-04-15', 'partial', 'Trẻ vẫn cần hỗ trợ khi nghiêng sang trái', 2),
(3, '2026-04-16', 'not_achieved', 'Trẻ còn đổ nước ngoài, tiếp tục tập', 2),
(4, '2026-04-16', 'pending', 'Chưa bắt đầu tập', 2),
(5, '2026-04-17', 'achieved', 'Trẻ nhận biết số 6 và 7 rõ ràng', 2),
(6, '2026-04-17', 'partial', 'Trẻ nói được số 1-4 rõ, số 5 còn nhoẹc', 2),
(7, '2026-04-18', 'achieved', 'Trẻ phân biệt được to-nhỏ tốt', 2),
(8, '2026-04-18', 'achieved', 'Trẻ nhận biết hình ngôi sao, có thể tiếp tục với hình phức tạp', 2);

-- ============================================
-- SUMMARY
-- ============================================
-- Total records inserted:
-- Kindergartens: 3
-- Users: 6
-- DevelopmentAreas: 4
-- Skills: 17 (mẫu chuẩn)
-- SkillImages: 6
-- Children: 5
-- Templates: 3
-- TemplateSkills: 14
-- EducationPlans: 5
-- PlanSkills: 14
-- EvaluationResults: 8
