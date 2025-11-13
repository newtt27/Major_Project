DROP TABLE IF EXISTS Report_Tasks CASCADE;
DROP TABLE IF EXISTS Reports CASCADE;

DROP TABLE IF EXISTS Department_Tasks CASCADE;

DROP TABLE IF EXISTS Account_Roles CASCADE;
DROP TABLE IF EXISTS Accounts CASCADE;

DROP TABLE IF EXISTS User_skills CASCADE;

DROP TABLE IF EXISTS Notifications CASCADE;

DROP TABLE IF EXISTS Attachments CASCADE;
DROP TABLE IF EXISTS Messages CASCADE;
DROP TABLE IF EXISTS ChatroomMembers CASCADE;
DROP TABLE IF EXISTS Chatrooms CASCADE;

DROP TABLE IF EXISTS Taskhistories CASCADE;
DROP TABLE IF EXISTS Taskprogresses CASCADE;
DROP TABLE IF EXISTS TaskStatuses CASCADE;
DROP TABLE IF EXISTS TaskAssignments CASCADE;
DROP TABLE IF EXISTS Tasks CASCADE;

DROP TABLE IF EXISTS ProjectParts CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;

DROP TABLE IF EXISTS Role_Permissions CASCADE;

-- 2. Xóa các bảng gốc (không còn FK nào trỏ tới)
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Departments CASCADE;
DROP TABLE IF EXISTS Permissions CASCADE;
DROP TABLE IF EXISTS Roles CASCADE;

-- 3. Xóa bảng session (nếu dùng express-session)
DROP TABLE IF EXISTS session CASCADE;

-- 1. Roles
CREATE TABLE Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('Active','Inactive')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Permissions
CREATE TABLE Permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('Active','Inactive')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Departments (tạm không FK)
CREATE TABLE Departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manager_id INTEGER,
    status VARCHAR(20) CHECK (status IN ('Active','Inactive')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users (tạm không FK)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    position VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('Active','Inactive')) DEFAULT 'Active',
    department_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Users
ADD COLUMN IF NOT EXISTS created_by INTEGER;

ALTER TABLE Users
ADD CONSTRAINT fk_users_created_by
  FOREIGN KEY (created_by) REFERENCES Users(user_id)
  ON DELETE SET NULL;
  
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid);

-- 5. Role_Permissions
CREATE TABLE Role_Permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permissions(permission_id) ON DELETE CASCADE
);

-- 6. Projects
CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('Planning','Active','Completed','Inactive')) DEFAULT 'Planning',
    created_by INTEGER NOT NULL,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_project_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

-- 7. ProjectParts
CREATE TABLE ProjectParts (
    part_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('Planning','Active','Completed','Inactive')) DEFAULT 'Planning',
    department_id INTEGER,
    assigned_to INTEGER,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES Users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_part_assignment CHECK (
        (department_id IS NOT NULL AND assigned_to IS NULL) OR
        (department_id IS NULL AND assigned_to IS NOT NULL)
    ),
    CONSTRAINT chk_part_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date),
    UNIQUE (project_id, part_name)
);

-- 8. Tasks
CREATE TABLE Tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    priority_order INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    part_id INTEGER,
    is_direct_assignment BOOLEAN DEFAULT FALSE,
    required_file_count INTEGER DEFAULT 0 CHECK (required_file_count >= 0),
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES ProjectParts(part_id) ON DELETE CASCADE,
    CONSTRAINT chk_task_dates CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date),
    CONSTRAINT chk_task_type CHECK (
        (is_direct_assignment = TRUE AND part_id IS NULL) OR
        (is_direct_assignment = FALSE AND part_id IS NOT NULL)
    ),
    UNIQUE (part_id, title)
);

-- 9. TaskAssignments
CREATE TABLE TaskAssignments (
    assignment_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_main_assignee BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (task_id, user_id)
);

-- 10. TaskStatuses
CREATE TABLE TaskStatuses (
    status_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    status_name VARCHAR(50) NOT NULL
                CHECK (status_name IN ('pending','in_progress','review','done','archived')),
    description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CONSTRAINT unique_current_status UNIQUE (task_id, is_current)
);

-- 11. Taskprogresses
CREATE TABLE Taskprogresses (
    progress_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    percentage_complete INTEGER DEFAULT 0 CHECK (percentage_complete BETWEEN 0 AND 100),
    milestone_description TEXT,
    is_tick_complete BOOLEAN DEFAULT FALSE,
    tick_reverted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 12. Taskhistories
CREATE TABLE Taskhistories (
    history_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status_id INTEGER,
    action VARCHAR(255) NOT NULL,
    old_percentage_complete INTEGER CHECK (old_percentage_complete BETWEEN 0 AND 100),
    new_percentage_complete INTEGER CHECK (new_percentage_complete BETWEEN 0 AND 100),
    status_after_update VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES TaskStatuses(status_id) ON DELETE SET NULL
);

-- 13. Chatrooms
CREATE TABLE Chatrooms (
    chatroom_id SERIAL PRIMARY KEY,
    chatroom_name VARCHAR(255) NOT NULL,
    description TEXT,
    chatroom_type VARCHAR(50) CHECK (chatroom_type IN ('Private','Group')) DEFAULT 'Group',
    created_by INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 14. ChatroomMembers
CREATE TABLE ChatroomMembers (
    chatroom_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) CHECK (role IN ('Admin','Member')) DEFAULT 'Member',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chatroom_id, user_id),
    FOREIGN KEY (chatroom_id) REFERENCES Chatrooms(chatroom_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 15. Messages
CREATE TABLE Messages (
    message_id SERIAL PRIMARY KEY,
    chatroom_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatroom_id) REFERENCES Chatrooms(chatroom_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 16. Attachments
CREATE TABLE Attachments (
    attachment_id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    chatroom_id INTEGER,
    task_id INTEGER,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES Messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (chatroom_id) REFERENCES Chatrooms(chatroom_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 17. Notifications
CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    task_id INTEGER,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('Reminder','Update','Overdue')) DEFAULT 'Reminder',
    priority VARCHAR(10) CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 18. Reports
CREATE TABLE Reports (
    report_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    
    -- Loại báo cáo: 'Employee_Report', 'Manager_Summary'
    report_type VARCHAR(50) NOT NULL 
        CHECK (report_type IN ('Employee_Report', 'Manager_Summary')),
    
    -- Người gửi báo cáo (Nhân viên hoặc Trưởng phòng)
    generated_by INTEGER NOT NULL, 
    -- Người nhận báo cáo (Trưởng phòng hoặc Admin)
    submitted_to_id INTEGER NOT NULL,
    
    -- Trạng thái báo cáo: 'Draft', 'Pending_Review', 'Approved', 'Rejected'
    report_status VARCHAR(50) NOT NULL 
        CHECK (report_status IN ('Draft', 'Pending_Review', 'Approved', 'Rejected')) 
        DEFAULT 'Draft',
    
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Lưu trữ số liệu tổng hợp (dùng cho Manager_Summary Report)
    report_data JSONB, 
    
    -- Khóa ngoại: Người gửi và Người nhận phải là User hợp lệ
    CONSTRAINT fk_report_generated_by FOREIGN KEY (generated_by) REFERENCES Users(user_id),
    CONSTRAINT fk_report_submitted_to FOREIGN KEY (submitted_to_id) REFERENCES Users(user_id)
);

-- 2. Bảng Report_Items (Chi tiết nội dung và đánh giá báo cáo)
CREATE TABLE Report_Items (
    item_id BIGSERIAL PRIMARY KEY,
    
    -- Liên kết với báo cáo (Employee_Report hoặc Manager_Summary)
    report_id INTEGER NOT NULL, 
    
    -- Công việc mà nhân viên báo cáo (chỉ dùng cho Employee_Report)
    task_id INTEGER, 
    
    -- Nội dung báo cáo của Nhân viên
    work_done_summary TEXT,           -- Công việc đã thực hiện
    kpi_results TEXT,                 -- Kết quả đạt được/Minh chứng
    difficulty_proposal TEXT,         -- Khó khăn & đề xuất
    next_plan TEXT,                   -- Kế hoạch tiếp theo
    
    -- Đánh giá và Phản hồi của Trưởng phòng
    manager_evaluation VARCHAR(50),   -- Đánh giá: 'Pass', 'Fail', 'Late'
    manager_feedback TEXT,            -- Nhận xét chi tiết
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Khóa ngoại
    CONSTRAINT fk_item_report FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_task FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE SET NULL
);


-- 19. Report_Tasks 
CREATE TABLE Report_Tasks (
    report_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    
    -- Thêm các cột theo EmployeeReportCreateDTO/ReportTaskDTO
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100), -- number
    actual_output TEXT, -- string
    status_at_report VARCHAR(50), -- string ('Hoàn thành', 'Đang làm',...)
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id, task_id),
    FOREIGN KEY (report_id) REFERENCES Reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);

-- 20. User_skills
CREATE TABLE User_skills (
    skill_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 21. Accounts
CREATE TABLE Accounts (
    account_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    status VARCHAR(20) CHECK (status IN ('Active','Inactive')) DEFAULT 'Active',
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    date_join TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 22. Account_Roles
CREATE TABLE Account_Roles (
    account_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, role_id),
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE
);

-- 23. Department_Tasks
CREATE TABLE Department_Tasks (
    department_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (department_id, task_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE
);

-- =============================================
-- 2. THÊM FK VÒNG (SAU KHI BẢNG ĐÃ TỒN TẠI)
-- =============================================
ALTER TABLE Departments
    ADD CONSTRAINT fk_dept_manager
        FOREIGN KEY (manager_id) REFERENCES Users(user_id) ON DELETE SET NULL;
		
  
ALTER TABLE Users
    ADD CONSTRAINT fk_user_dept
        FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL;
ALTER TABLE Roles
ADD CONSTRAINT valid_role_name_format
CHECK (
  role_name ~ '^[a-zA-Z0-9\s\-_]{2,50}$'
);
-- =============================================
-- 3. DỮ LIỆU MẪU (THỨ TỰ ĐÚNG – KHÔNG LỖI)
-- =============================================

-- 1. Roles
INSERT INTO Roles (role_name, description, status) VALUES
('admin', 'Quản trị viên hệ thống', 'Active'),
('manager', 'Quản lý phòng ban', 'Active'),
('staff', 'Nhân viên', 'Active');

-- 2. Permissions
INSERT INTO Permissions (permission_name, category, description, status) VALUES
('auth:change-password', 'Auth', 'Change own password', 'Active'),
('auth:logout', 'Auth', 'Logout session', 'Active'),
('user:profile:read', 'User', 'View own profile', 'Active'),
('user:register', 'User', 'Register new user (admin only)', 'Active'),
('user:list', 'User', 'List all users (admin only)', 'Active'),
('user:create', 'User', 'Create new user (admin only)', 'Active'),
('user:read', 'User', 'View user details (admin only)', 'Active'),
('user:update', 'User', 'Update user (admin only)', 'Active'),
('user:delete', 'User', 'Delete user (admin only)', 'Active'),
('account:create', 'Account', 'Create new account (admin only)', 'Active'),
('account:list', 'Account', 'List all accounts (admin only)', 'Active'),
('account:read', 'Account', 'View account details (admin only)', 'Active'),
('account:update', 'Account', 'Update account (admin only)', 'Active'),
('account:delete', 'Account', 'Delete account (admin only)', 'Active'),

-- Permissions cho AI
('ai:chatbot', 'AI', 'Use AI chatbot', 'Active'),
('ai:suggest-assignment', 'AI', 'Suggest task assignment', 'Active'),
('ai:predict-risk', 'AI', 'Predict task risk', 'Active'),
('ai:department-risks', 'AI', 'Analyze department risks', 'Active'),

-- Permissions cho Task
('task:create', 'Task', 'Create new task', 'Active'),
('task:my:list', 'Task', 'List my tasks', 'Active'),
('task:read', 'Task', 'View task details', 'Active'),
('task:update-progress', 'Task', 'Update task progress', 'Active'),
('task:upload-attachment', 'Task', 'Upload attachments to task', 'Active'),
('task:update', 'Task', 'Update task', 'Active'),
('task:delete', 'Task', 'Delete task', 'Active'),
('task:change-assignee', 'Task', 'Change main assignee', 'Active'),
('task:update-assignments', 'Task', 'Update task assignments', 'Active'),
('task:history:read', 'Task', 'View task history', 'Active'),
('task:department:create', 'Task', 'Create Task Department', 'Active'),


-- Permissions cho Chat
('chat:create-room', 'Chat', 'Create chatroom', 'Active'),
('chat:list', 'Chat', 'List my chatrooms', 'Active'),
('chat:read', 'Chat', 'View chatroom details', 'Active'),
('chat:messages:read', 'Chat', 'View chatroom messages', 'Active'),
('chat:add-members', 'Chat', 'Add members to chatroom', 'Active'),
('chat:kick-member', 'Chat', 'Kick member from chatroom', 'Active'),
('chat:members:list', 'Chat', 'List chatroom members', 'Active'),
('chat:messages:create', 'Chat', 'Send message in chatroom', 'Active'),

-- Permissions cho RBAC
('rbac:permission:create', 'RBAC', 'Create permission', 'Active'),
('rbac:permission:list', 'RBAC', 'List permissions', 'Active'),
('rbac:role:create', 'RBAC', 'Create role', 'Active'),
('rbac:role:list', 'RBAC', 'List roles', 'Active'),
('rbac:role:assign-permission', 'RBAC', 'Assign permission to role', 'Active'),
('rbac:role:remove-permission', 'RBAC', 'Remove permission from role', 'Active'),
('rbac:role:permissions:list', 'RBAC', 'List role permissions', 'Active'),
('rbac:account:assign-role', 'RBAC', 'Assign role to account', 'Active'),
('rbac:account:remove-role', 'RBAC', 'Remove role from account', 'Active'),
('rbac:account:roles:list', 'RBAC', 'List account roles', 'Active'),

-- Permissions cho Notification
('notifications:list', 'Notification', 'List notifications', 'Active'),
('notifications:mark-read', 'Notification', 'Mark notification as read', 'Active'),
('notifications:mark-all-read', 'Notification', 'Mark all notifications as read', 'Active'),

-- Permissions cho Project
('project:create', 'Project', 'Create project', 'Active'),
('project:part:create', 'Project', 'Create project part', 'Active'),
('project:list', 'Project', 'List projects', 'Active'),
('project:read', 'Project', 'View project details', 'Active'),
('project:parts:list', 'Project', 'List project parts', 'Active'),
('project:parts:my:list', 'Project', 'List my project parts', 'Active'),
('project:update', 'Project', 'Update project', 'Active'),
('project:delete', 'Project', 'Delete project', 'Active'),
('project:part:update', 'Project', 'Update project part', 'Active'),
('project:part:delete', 'Project', 'Delete project part', 'Active'),

-- Permissions cho Report
('create:employee:report', 'Report', 'Create employee report', 'Active'),
('create:manager:report', 'Report', 'Create manager report', 'Active'),
('review:employee:report', 'Report', 'Review employee report', 'Active'),
('review:manager:report', 'Report', 'Review manager report', 'Active'),
('view:reports', 'Report', 'View Report', 'Active'),
('view:managers', 'Report', 'View Admin', 'Active'),
('view:admins', 'Report', 'View Manager', 'Active'),

-- Permissions cho Department
('department:list', 'Department', 'Xem danh sách phòng ban', 'Active'),
('department:read', 'Department', 'Xem chi tiết phòng ban', 'Active'),
('department:admin', 'Department', 'Quản trị phòng ban (CRUD)', 'Active'),
('department:users:list', 'Department', 'Xem danh sách nhân viên theo phòng ban', 'Active'),
('department:create', 'Department', 'Thêm phòng ban', 'Active'),
('department:update', 'Department', 'Sửa phòng ban', 'Active'),
('department:delete', 'Department', 'Xóa phòng ban', 'Active');

-- 3. Users (TRƯỚC Departments)
INSERT INTO Users (first_name, last_name, phone, position, status, created_by) VALUES
('Admin',     'System',     '0900000001', 'Quản trị viên', 'Active', NULL),  
('Nguyễn',    'Văn A',      '0900000002', 'Trưởng phòng',  'Active', 1),     
('Trần',      'Thị B',      '0900000003', 'Nhân viên',     'Active', 1 ),    
('Lê',        'Văn C',      '0900000004', 'Nhân viên',     'Active', 1);

-- 4. Departments (SAU Users)
INSERT INTO Departments (department_name, description, manager_id, status) VALUES
('Phòng Kỹ thuật', 'Phát triển phần mềm', 2, 'Active'),
('Phòng Nhân sự', 'Quản lý nhân viên', NULL, 'Active');

-- 5. Gán phòng ban
UPDATE Users SET department_id = 1 WHERE user_id IN (1, 4);
UPDATE Users SET department_id = 2 WHERE user_id IN (2, 3);

-- 6. Accounts
INSERT INTO Accounts (user_id, status, password, email, date_join) VALUES
(1, 'Active', '$2a$10$HIxS.PaLBhhWNOOucZhlsujFreN8KZNd8sSx2SwWsmGHqoUzQrLXa', 'admin@example.com', CURRENT_TIMESTAMP),
(2, 'Active', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'nguyenvana@example.com', CURRENT_TIMESTAMP),
(3, 'Active', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tranthib@example.com', CURRENT_TIMESTAMP),
(4, 'Active', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'levanc@example.com', CURRENT_TIMESTAMP);

-- 7. Account_Roles
INSERT INTO Account_Roles (account_id, role_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 3);

-- 8. Role_Permissions
INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 1, permission_id FROM Permissions;

INSERT INTO Role_Permissions (role_id, permission_id)
SELECT 2, permission_id 
FROM Permissions 
WHERE permission_name IN (
  'create:employee:report',
  'create:manager:report',
  'review:employee:report',
  'review:manager:report',
  'view:reports',
  'view:admins'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
-- 9. Projects
INSERT INTO Projects (project_name, description, status, created_by, start_date, due_date) VALUES
('Hệ thống Quản lý Nhân sự', 'Xây dựng phần mềm quản lý nhân viên', 'Active', 1, '2025-01-01', '2025-06-30');

-- 10. ProjectParts
INSERT INTO ProjectParts (project_id, part_name, description, status, department_id, assigned_to, start_date, due_date) VALUES
(1, 'Thiết kế giao diện', 'UI/UX', 'Active', 1, NULL, '2025-01-01', '2025-02-28'),
(1, 'Backend API', 'Xây dựng API', 'Planning', NULL, 4, '2025-03-01', '2025-05-31');

-- 11. Tasks
INSERT INTO Tasks (title, description, priority, created_by, assigned_by, part_id, is_direct_assignment, required_file_count, start_date, due_date) VALUES
('Thiết kế form đăng nhập', 'Giao diện login', 'High', 2, 2, 1, FALSE, 1, '2025-01-10', '2025-01-20'),
('Nghiên cứu bcrypt', 'Tìm hiểu mã hóa mật khẩu', 'Medium', 1, 1, NULL, TRUE, 0, '2025-01-05', '2025-01-07');

-- 12. TaskAssignments
INSERT INTO TaskAssignments (task_id, user_id, is_main_assignee) VALUES
(1, 3, TRUE), (1, 4, FALSE), (2, 4, TRUE);

-- 13. TaskStatuses
INSERT INTO TaskStatuses (task_id, status_name, is_current, updated_by) VALUES
(1, 'pending', TRUE, 2),
(2, 'in_progress', TRUE, 1);

-- 14. Taskprogresses
INSERT INTO Taskprogresses (task_id, user_id, percentage_complete, is_tick_complete) VALUES
(1, 3, 60, FALSE),
(2, 4, 100, TRUE);

-- 15. Taskhistories
INSERT INTO Taskhistories (task_id, user_id, action, old_percentage_complete, new_percentage_complete, status_after_update) VALUES
(1, 3, 'Cập nhật tiến độ', 0, 60, 'in_progress'),
(2, 4, 'Hoàn thành bằng tick', 90, 100, 'done');

-- 16. Chatrooms
INSERT INTO Chatrooms (chatroom_name, description, chatroom_type, created_by) VALUES
('Phòng Kỹ thuật', 'Thảo luận dự án', 'Group', 1),
('Chat riêng', 'Tin nhắn cá nhân', 'Private', 3);

-- 17. ChatroomMembers
INSERT INTO ChatroomMembers (chatroom_id, user_id, role) VALUES
(1, 1, 'Admin'), (1, 3, 'Member'), (1, 4, 'Member'),
(2, 3, 'Member'), (2, 4, 'Member');

-- 18. Messages
INSERT INTO Messages (chatroom_id, sender_id, receiver_id, message_text) VALUES
(1, 3, NULL, 'Ai làm phần login?'),
(1, 4, NULL, 'Em làm ạ!'),
(2, 3, 4, 'Gửi file thiết kế đi');

-- 19. Attachments
INSERT INTO Attachments (message_id, chatroom_id, task_id, file_name, file_path, mime_type, file_size, uploaded_by) VALUES
(3, 2, 1, 'login_design.png', '/uploads/login_design.png', 'image/png', 245760, 3);

-- 20. Notifications
INSERT INTO Notifications (task_id, user_id, message, notification_type, priority) VALUES
(1, 3, 'Nhiệm vụ sắp đến hạn', 'Reminder', 'High'),
(2, 4, 'Công việc đã hoàn thành', 'Update', 'Medium');

-- 21. Reports
DO $$
DECLARE
    report_c_id INTEGER;
    manager_b_id INTEGER := 2; -- Giả sử user_id của Manager B là 2
    staff_c_id INTEGER := 3;   -- Giả sử user_id của Staff C là 3
    admin_a_id INTEGER := 1;   -- Giả sử user_id của Admin A là 1
    task_101_id INTEGER := 1;-- Giả sử task_id Thiết kế UI/UX là 1
    task_102_id INTEGER := 2;-- Giả sử task_id Xây dựng API là 2
BEGIN
    -------------------------------------------------------
    -- 1. BÁO CÁO CỦA NHÂN VIÊN (Employee_Report)
    -------------------------------------------------------
    INSERT INTO Reports (title, report_type, generated_by, submitted_to_id, report_status) 
    VALUES ('Báo cáo công việc 24/10/2025 - Staff C', 'Employee_Report', staff_c_id, manager_b_id, 'Pending_Review')
    RETURNING report_id INTO report_c_id;

    -- Chi tiết báo cáo (Report_Items)
    INSERT INTO Report_Items (report_id, task_id, work_done_summary, kpi_results, difficulty_proposal, next_plan) VALUES
    (
        report_c_id, task_101_id,
        'Hoàn thành bản nháp thiết kế màn hình đăng nhập và dashboard.',
        'File: UI_Draft_v1.pdf. Đạt 80% KPI về UX/UI.',
        'Cần xin ý kiến Marketing.',
        'Hoàn thành 2 màn còn lại (deadline 25/10)'
    ),
    (
        report_c_id, task_102_id,
        'Đã hoàn thành 50% API user management.',
        'Đã commit lên Git với hash abc1234.',
        'Không có khó khăn.',
        'Hoàn thành phần còn lại (deadline 26/10)'
    );

    -------------------------------------------------------
    -- 2. ĐÁNH GIÁ CỦA TRƯỞNG PHÒNG
    -------------------------------------------------------
    UPDATE Report_Items
    SET manager_evaluation = 'Pass',
        manager_feedback = 'Thiết kế tốt. Tiếp tục phát huy!'
    WHERE report_id = report_c_id AND task_id = task_101_id;

    UPDATE Report_Items
    SET manager_evaluation = 'Late',
        manager_feedback = 'Tiến độ API chậm. Yêu cầu tăng tốc.'
    WHERE report_id = report_c_id AND task_id = task_102_id;

    UPDATE Reports
    SET report_status = 'Approved'
    WHERE report_id = report_c_id;

    -------------------------------------------------------
    -- 3. BÁO CÁO TỔNG HỢP CỦA MANAGER GỬI ADMIN
    -------------------------------------------------------
    INSERT INTO Reports (title, report_type, generated_by, submitted_to_id, report_status, report_data) 
    VALUES (
        'Báo cáo tổng hợp Phòng Dev - Tuần 43',
        'Manager_Summary',
        manager_b_id,
        admin_a_id,
        'Pending_Review',
        '{"completion_rate": 0.85, "overdue_tasks": 3, "top_staff": "Staff C", "issues": ["Thiếu 1 nhân sự Frontend"]}'::jsonb
    );
END $$;

DO $$
DECLARE
    manager_summary_id INTEGER;
    admin_a_id INTEGER := 1;
    manager_b_id INTEGER := 2;
BEGIN
    SELECT report_id INTO manager_summary_id
    FROM Reports
    WHERE report_type = 'Manager_Summary'
      AND generated_by = manager_b_id
      AND submitted_to_id = admin_a_id
    LIMIT 1;

    -- Thêm các report_items tổng hợp
    INSERT INTO Report_Items (
        report_id,
        work_done_summary,
        kpi_results,
        difficulty_proposal,
        next_plan,
        manager_evaluation,
        manager_feedback
    )
    VALUES
    (
        manager_summary_id,
        'Hoàn thành 85% các nhiệm vụ trong tuần 43.',
        'Số nhiệm vụ quá hạn: 3; Nhân viên xuất sắc: Staff C',
        'Thiếu 1 nhân sự Frontend, cần bổ sung.',
        'Tiếp tục hoàn thiện các module còn lại và theo dõi tiến độ nhân viên.',
        'Pass',
        'Các chỉ số tổng quan tốt, nhưng cần bổ sung nhân sự để đảm bảo deadline.'
    );
END $$;

INSERT INTO Report_Tasks (
    report_id,
    task_id,
    progress_percentage,
    actual_output,
    status_at_report
)
VALUES
    (1, 1, 80, 'Đã hoàn thành module đăng nhập và phân quyền cơ bản', 'Đang làm'),
    (1, 2, 50, 'Hoàn thành API lấy danh sách sản phẩm, đang làm phần filter nâng cao', 'Vướng mắc');


-- 23. User_skills
INSERT INTO User_skills (user_id, skill_name, level) VALUES
(3, 'Figma', 8),
(4, 'PostgreSQL', 7),
(4, 'Node.js', 9);

-- 24. Department_Tasks
INSERT INTO Department_Tasks (department_id, task_id) VALUES
(1, 1), (1, 2);


-- Index for file count queries
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON Attachments(task_id);

-- =============================================
-- 2. INDEXES
-- =============================================

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON Projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON Projects(status);

-- ProjectParts
CREATE INDEX IF NOT EXISTS idx_projectparts_project_id    ON ProjectParts(project_id);
CREATE INDEX IF NOT EXISTS idx_projectparts_department_id ON ProjectParts(department_id);
CREATE INDEX IF NOT EXISTS idx_projectparts_assigned_to   ON ProjectParts(assigned_to);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_part_id       ON Tasks(part_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by    ON Tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by   ON Tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON Tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority      ON Tasks(priority);

-- TaskAssignments
CREATE INDEX IF NOT EXISTS idx_taskassignments_task_id ON TaskAssignments(task_id);
CREATE INDEX IF NOT EXISTS idx_taskassignments_user_id ON TaskAssignments(user_id);

-- TaskStatuses
CREATE INDEX IF NOT EXISTS idx_taskstatuses_task_current 
    ON TaskStatuses(task_id) WHERE is_current = TRUE;

-- Taskprogresses
CREATE INDEX IF NOT EXISTS idx_taskprogresses_task_user 
    ON Taskprogresses(task_id, user_id);

-- Department_Tasks
CREATE INDEX IF NOT EXISTS idx_depttasks_dept ON Department_Tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_depttasks_task ON Department_Tasks(task_id);

-- Chat
CREATE INDEX IF NOT EXISTS idx_messages_chatroom_sent ON Messages(chatroom_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatmembers_chatroom   ON ChatroomMembers(chatroom_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON Notifications(user_id, is_read);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_type_generated ON Reports(report_type, generated_at DESC);
-- Index cho Reports: Tối ưu việc truy vấn báo cáo theo người gửi, người nhận và trạng thái
CREATE INDEX idx_reports_generated_by ON Reports (generated_by);
CREATE INDEX idx_reports_submitted_to ON Reports (submitted_to_id);
CREATE INDEX idx_reports_status_type ON Reports (report_status, report_type);
CREATE INDEX idx_reports_generated_at ON Reports (generated_at DESC);

-- Index cho Report_Items: Tối ưu việc lọc các mục báo cáo theo báo cáo cha và công việc
CREATE INDEX idx_report_items_report_id ON Report_Items (report_id);
CREATE INDEX idx_report_items_task_id ON Report_Items (task_id);
-- =============================================
-- 3. FUNCTIONS
-- =============================================
-- Function chung để cập nhật updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho bảng Reports
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON Reports
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- Function: Cập nhật trạng thái Task khi task được báo cáo đã hoàn thành
CREATE OR REPLACE FUNCTION update_task_status_on_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ áp dụng cho Employee_Report khi manager đánh giá 'Pass' (Hoàn thành)
    IF (SELECT report_type FROM Reports WHERE report_id = NEW.report_id) = 'Employee_Report' 
        AND NEW.task_id IS NOT NULL 
        AND NEW.manager_evaluation = 'Pass' 
    THEN
        -- Cập nhật trạng thái task thành 'Done'
        INSERT INTO TaskStatuses (task_id, status_name, status_date, is_current)
        VALUES (NEW.task_id, 'done', CURRENT_DATE, TRUE)
        ON CONFLICT (task_id, status_date, status_name) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Kích hoạt khi Manager đánh giá
CREATE TRIGGER trg_task_status_update
AFTER UPDATE OF manager_evaluation ON Report_Items
FOR EACH ROW
WHEN (NEW.manager_evaluation IS NOT NULL AND NEW.manager_evaluation IS DISTINCT FROM OLD.manager_evaluation)
EXECUTE PROCEDURE update_task_status_on_report();
-- 1. update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. restrict_private_chatroom_members
CREATE OR REPLACE FUNCTION restrict_private_chatroom_members()
RETURNS TRIGGER AS $$
DECLARE
    room_type TEXT;
    member_count INT;
BEGIN
    SELECT chatroom_type INTO room_type
    FROM Chatrooms WHERE chatroom_id = NEW.chatroom_id;

    IF room_type = 'Private' THEN
        -- Count existing members (excluding the one being inserted)
        SELECT COUNT(*) INTO member_count
        FROM ChatroomMembers
        WHERE chatroom_id = NEW.chatroom_id;

        IF member_count >= 2 THEN
            RAISE EXCEPTION 'Phòng chat Private chỉ được có tối đa 2 thành viên';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. handle_task_progress (ĐÃ SỬA – ỔN ĐỊNH 100%)
CREATE OR REPLACE FUNCTION handle_task_progress()
RETURNS TRIGGER AS $$
DECLARE
    old_pct INTEGER := 0;
    action_text TEXT := 'Cập nhật tiến độ';
    new_status_name VARCHAR(50) := 'in_progress';
    file_count INTEGER := 0;
    required_files INTEGER := 0;
BEGIN
    -- LẤY TIẾN ĐỘ CŨ (SỬA: KHÔNG DÙNG progress_id)
    SELECT COALESCE(MAX(percentage_complete), 0) INTO old_pct
    FROM Taskprogresses
    WHERE task_id = NEW.task_id
      AND user_id = NEW.user_id
      AND (TG_OP = 'UPDATE' AND progress_id < OLD.progress_id OR TG_OP = 'INSERT');

    -- Tick complete logic
    IF NEW.is_tick_complete AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NOT OLD.is_tick_complete)) THEN
        action_text := 'Hoàn thành bằng tick';
        NEW.percentage_complete := LEAST(100, old_pct + 10);
    ELSIF TG_OP = 'UPDATE' AND NOT NEW.is_tick_complete AND OLD.is_tick_complete THEN
        action_text := 'Hủy tick hoàn thành';
        NEW.percentage_complete := old_pct;
    END IF;

    -- File requirement check (CHỈ KHI required_files > 0 VÀ 100%)
    SELECT required_file_count INTO required_files
    FROM Tasks WHERE task_id = NEW.task_id;

    IF required_files > 0 AND NEW.percentage_complete = 100 THEN
        SELECT COUNT(*) INTO file_count
        FROM Attachments
        WHERE task_id = NEW.task_id;

        IF file_count < required_files THEN
            RAISE EXCEPTION 'Cần nộp đủ % file (còn thiếu %)', required_files, required_files - file_count;
        END IF;
    END IF;

    -- Xác định trạng thái
    IF NEW.percentage_complete = 100 THEN
        new_status_name := 'done';
    ELSIF NEW.percentage_complete > 0 THEN
        new_status_name := 'in_progress';
    ELSE
        new_status_name := 'pending';
    END IF;

    -- Cập nhật trạng thái hiện tại
    UPDATE TaskStatuses
    SET is_current = FALSE
    WHERE task_id = NEW.task_id AND is_current = TRUE;

    INSERT INTO TaskStatuses (task_id, status_name, is_current, updated_by, updated_at)
    VALUES (NEW.task_id, new_status_name, TRUE, NEW.user_id, CURRENT_TIMESTAMP)
    ON CONFLICT (task_id) WHERE is_current = TRUE DO UPDATE
    SET status_name = EXCLUDED.status_name,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at;

    -- Ghi lịch sử
    INSERT INTO Taskhistories (
        task_id, user_id, action, old_percentage_complete,
        new_percentage_complete, status_after_update
    )
    VALUES (
        NEW.task_id, NEW.user_id, action_text, old_pct,
        NEW.percentage_complete, new_status_name
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 4. check_task_assignment_count (TỐI ƯU – KHÔNG LỖI)
CREATE OR REPLACE FUNCTION check_task_assignment_count()
RETURNS TRIGGER AS $$
DECLARE
    is_direct BOOLEAN;
BEGIN
    SELECT is_direct_assignment INTO is_direct
    FROM Tasks WHERE task_id = NEW.task_id;

    IF is_direct THEN
        PERFORM 1 FROM TaskAssignments WHERE task_id = NEW.task_id LIMIT 1;
        IF FOUND THEN
            RAISE EXCEPTION 'Task cá nhân chỉ được phân công cho 1 người duy nhất';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 5. ensure_one_current_status (ĐÃ SỬA – HOÀN HẢO)
CREATE OR REPLACE FUNCTION ensure_one_current_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Tắt tất cả trạng thái hiện tại
        UPDATE TaskStatuses
        SET is_current = FALSE
        WHERE task_id = NEW.task_id AND is_current = TRUE;

        -- Bật trạng thái mới
        NEW.is_current := TRUE;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_current AND NOT OLD.is_current THEN
            -- Tắt các trạng thái khác
            UPDATE TaskStatuses
            SET is_current = FALSE
            WHERE task_id = NEW.task_id
              AND status_id <> NEW.status_id
              AND is_current = TRUE;

        ELSIF NOT NEW.is_current AND OLD.is_current THEN
            -- Không cho phép bỏ trạng thái hiện tại nếu không có cái mới
            RAISE EXCEPTION 'Không thể bỏ trạng thái hiện tại nếu không có trạng thái mới';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE Accounts
ALTER COLUMN user_id DROP NOT NULL;


-- Thêm cột report_id vào bảng Notifications
ALTER TABLE Notifications
ADD COLUMN IF NOT EXISTS report_id INTEGER;

-- Tạo FK (tùy chọn, để đảm bảo toàn vẹn dữ liệu)
ALTER TABLE Notifications
ADD CONSTRAINT fk_notification_report
    FOREIGN KEY (report_id) REFERENCES Reports(report_id)
    ON DELETE SET NULL;

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_notifications_report_id 
ON Notifications(report_id);

-- Ví dụ: Gán report_id cho thông báo cũ (nếu có)
UPDATE Notifications 
SET report_id = 1 
WHERE notification_id = 1;

-- Xóa constraint cũ
ALTER TABLE Notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Tạo lại với giá trị mới
ALTER TABLE Notifications
ADD CONSTRAINT notifications_notification_type_check
    CHECK (notification_type IN ('Reminder', 'Update', 'Overdue', 'New'));

CREATE TABLE Task_Required_Skills (
    task_id INTEGER NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    required_level INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (task_id, skill_name),
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE

    -- Nếu muốn kiểm soát định dạng skill, bỏ comment ở dòng dưới
    -- ,CONSTRAINT chk_skill_name_format CHECK (skill_name ~ '^[a-zA-Z0-9\s\-\.]{2,100}$')
);


CREATE INDEX idx_task_required_skills_skill ON Task_Required_Skills(skill_name);
CREATE INDEX idx_task_required_skills_level ON Task_Required_Skills(required_level);
-- Task 1: "Thiết kế form đăng nhập" → cần Figma level 6+
INSERT INTO Task_Required_Skills (task_id, skill_name, required_level) VALUES
(1, 'Figma', 6),
(1, 'UI/UX Design', 5);

-- Task 2: "Nghiên cứu bcrypt" → cần Node.js level 7+
INSERT INTO Task_Required_Skills (task_id, skill_name, required_level) VALUES
(2, 'Node.js', 7),
(2, 'Cryptography', 5);