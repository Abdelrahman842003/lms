-- Demo Data for Academies
-- Run this file to add test data for academies

-- Insert Secretaries
INSERT INTO secretaries (name, phone, password, is_active, created_at, updated_at) VALUES
('سكرتير الأكاديمية التجريبية', '01012345678', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW()),
('سكرتير أكاديمية الاختبار', '01099999999', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Academies
INSERT INTO academies (name, phone, email, address, is_active, created_at, updated_at) VALUES
('أكاديمية النجاح التعليمية', '01012345678', 'academy1@test.com', 'القاهرة، مصر الجديدة', 1, NOW(), NOW()),
('أكاديمية الاختبار', '01099999999', 'academy2@test.com', 'الجيزة، المهندسين', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Link Secretaries to Academies
INSERT INTO academy_secretary (academy_id, secretary_id, permissions, is_active, created_at, updated_at)
SELECT 
    a.id,
    s.id,
    JSON_ARRAY('manage_teachers', 'view_reports', 'view_billing'),
    1,
    NOW(),
    NOW()
FROM academies a
JOIN secretaries s ON a.phone = s.phone
WHERE a.phone = '01012345678'
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO academy_secretary (academy_id, secretary_id, permissions, is_active, created_at, updated_at)
SELECT 
    a.id,
    s.id,
    JSON_ARRAY('manage_teachers', 'view_reports'),
    1,
    NOW(),
    NOW()
FROM academies a
JOIN secretaries s ON a.phone = s.phone
WHERE a.phone = '01099999999'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Teachers for Academy 1
INSERT INTO teachers (name, username, phone, password, is_suspended, academy_id, created_at, updated_at)
SELECT 
    'أحمد محمد',
    'ahmed_mohamed',
    '01111111111',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    0,
    a.id,
    NOW(),
    NOW()
FROM academies a
WHERE a.phone = '01012345678'
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO teachers (name, username, phone, password, is_suspended, academy_id, created_at, updated_at)
SELECT 
    'محمود علي',
    'mahmoud_ali',
    '01222222222',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    0,
    a.id,
    NOW(),
    NOW()
FROM academies a
WHERE a.phone = '01012345678'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Teacher for Academy 2
INSERT INTO teachers (name, username, phone, password, is_suspended, academy_id, created_at, updated_at)
SELECT 
    'سارة أحمد',
    'sara_ahmed',
    '01333333333',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    0,
    a.id,
    NOW(),
    NOW()
FROM academies a
WHERE a.phone = '01099999999'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Students for Teacher Ahmed (5 students)
INSERT INTO students (name, username, phone, password, created_at, updated_at) VALUES
('طالب 1 - أحمد', 'student_ahmed_1', '01555550001', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 2 - أحمد', 'student_ahmed_2', '01555550002', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 3 - أحمد', 'student_ahmed_3', '01555550003', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 4 - أحمد', 'student_ahmed_4', '01555550004', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 5 - أحمد', 'student_ahmed_5', '01555550005', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Students for Teacher Mahmoud (6 students)
INSERT INTO students (name, username, phone, password, created_at, updated_at) VALUES
('طالب 1 - محمود', 'student_mahmoud_1', '01666660001', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 2 - محمود', 'student_mahmoud_2', '01666660002', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 3 - محمود', 'student_mahmoud_3', '01666660003', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 4 - محمود', 'student_mahmoud_4', '01666660004', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 5 - محمود', 'student_mahmoud_5', '01666660005', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 6 - محمود', 'student_mahmoud_6', '01666660006', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert Students for Teacher Sara (4 students)
INSERT INTO students (name, username, phone, password, created_at, updated_at) VALUES
('طالب 1 - سارة', 'student_sara_1', '01777770001', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 2 - سارة', 'student_sara_2', '01777770002', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 3 - سارة', 'student_sara_3', '01777770003', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('طالب 4 - سارة', 'student_sara_4', '01777770004', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Link Students to Teachers (Enrollments)
-- Ahmed's students
INSERT INTO enrollments (student_id, teacher_id, status, created_at, updated_at)
SELECT s.id, t.id, 'active', NOW(), NOW()
FROM students s
CROSS JOIN teachers t
WHERE s.phone LIKE '015555%' AND t.phone = '01111111111'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Mahmoud's students
INSERT INTO enrollments (student_id, teacher_id, status, created_at, updated_at)
SELECT s.id, t.id, 'active', NOW(), NOW()
FROM students s
CROSS JOIN teachers t
WHERE s.phone LIKE '016666%' AND t.phone = '01222222222'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Sara's students
INSERT INTO enrollments (student_id, teacher_id, status, created_at, updated_at)
SELECT s.id, t.id, 'active', NOW(), NOW()
FROM students s
CROSS JOIN teachers t
WHERE s.phone LIKE '017777%' AND t.phone = '01333333333'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Summary
SELECT '✅ Demo data created successfully!' as message;
SELECT '' as '';
SELECT '📊 Summary:' as '';
SELECT '🏢 Academy 1: أكاديمية النجاح التعليمية' as '';
SELECT '   📱 Phone: 01012345678' as '';
SELECT '   👨‍🏫 Teachers: 2 (أحمد: 5 طلاب، محمود: 6 طلاب)' as '';
SELECT '   📚 Total Students: 11' as '';
SELECT '' as '';
SELECT '🏢 Academy 2: أكاديمية الاختبار' as '';
SELECT '   📱 Phone: 01099999999' as '';
SELECT '   👨‍🏫 Teachers: 1 (سارة: 4 طلاب)' as '';
SELECT '   📚 Total Students: 4' as '';
SELECT '' as '';
SELECT '🔑 Password for all: 123456' as '';
