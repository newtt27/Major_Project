import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { use } from 'react';

export interface Permission {
  permission_id: number;
  permission_name: string;
  category?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface Project {
  project_id: number;
  project_name: string;
  description?: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Inactive';
  created_at: string;
  updated_at: string;
  parts?: ProjectPart[];
}

export interface ProjectPart {
  part_id: number;
  project_id: number;
  project_name?: string;
  part_name: string;
  description?: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Inactive';
  created_at: string;
  updated_at: string;
  tasks?: Task[];
  project?: Project;

  start_date?: string | null;
  due_date?: string | null;

  // Thông tin phòng ban
  department_id?: number | null;
  assigned_to?: number | null;
}

export interface Task {
  task_id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  priority_order: number;
  created_by: number;
  part_id: number;
  chatroom_id?: number;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Trạng thái:
  status_name: string;

  // Người giao task
  assigned_by_id?: number | null;
  assigned_by_first_name?: string;
  assigned_by_last_name?: string;

  // Số file yêu cầu
  required_file_count: number;

  // Chi tiết lịch sử task
  task_history?: TaskHistory[];

  // Chi tiết tiến độ theo người
  progresses?: TaskProgress[];

  // Các assignment nếu cần
  assignments?: TaskAssignment[];

  // 🆕 Thêm 3 trường mới trả về từ backend:
   project_name?: string | null;
  part_name?: string | null;
  is_main_assignee?: boolean | null;
}

export interface TaskAssignment {
  assignment_id: number;
  task_id: number;
  user_id: number;
  assigned_at: string;

  // Thông tin user
  first_name?: string;
  last_name?: string;
}

export interface TaskProgress {
  progress_id: number;
  task_id: number;
  percentage_complete: number;
  milestone_description?: string;
  updated_at: string;
  updated_by: number | null;
}

export interface Department {
  department_id: number;
  department_name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;

  // Thông tin trưởng phòng
  manager_id?: number | null;
}

export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  accounts?: Account[];
}

export interface Account {
  account_id: number;
  user_id: number;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
  date_join: string;
  last_login?: string | null;
  last_password_change?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  role?: Role;
}

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  position?: string;
  status: 'Active' | 'Inactive';
  department_id?: number | null;
  created_at: string;
  updated_at: string;
  department?: Department;
  account?: Account;
}

export interface Attachment {
  attachment_id: number;
  filename: string;
  filepath: string;
  mimetype: string;
  filesize: number;
  uploaded_by: number;
  uploaded_at: string;
}



export interface Message {
  message_id: number;
  chatroom_id: number;
  sender_id: number;
  receiver_id: number | null;
  message_text: string | null;
  sent_at: string;
  is_read: boolean;
  attachments: Attachment[];
}

export interface ChatroomMember {
  user_id: number;
  first_name: string;
  last_name: string;
  position?: string;
  role: 'Admin' | 'Member';
  joined_at: string;
}

export interface Chatroom {
  chatroom_id: number;
  chatroom_name: string;
  description?: string;
  chatroom_type: 'Private' | 'Group';
  created_by: number;
  created_at: string;
  updated_at: string;
  user_role: 'Admin' | 'Member';
  member_count: number;
  unread_count: number;
}

export interface Notification {
  notificationId: number;
}

export interface Report {
  report_id: number;
  title: string;
  report_type: 'Employee_Report' | 'Manager_Summary';
  generated_by: number;
  submitted_to_id: number;
  report_status: 'Draft' | 'Pending_Review' | 'Approved' | 'Rejected';
  generated_at: string;
  updated_at: string;
  report_data?: Record<string, any>; 
  report_items?: ReportItem[]; 
  report_tasks?: any[]; 
  weekly_tasks?: Array<{  
    task_id: number;
    title: string;
    progress_percentage: number;
    due_date: string;
    status_at_report: string;
  }>;
}
interface ReportItem {
  item_id: number
  task_id: number | null
  work_done_summary: string
  kpi_results: string
  difficulty_proposal: string
  next_plan: string
  manager_evaluation: string
  manager_feedback: string
}

export interface LoginRequest { 
  email: string; 
  password: string; 
}

export interface LoginResponse { 
  accessToken: string; 
  refreshToken: string; 
  permissions: string[];
  userId: number;           
  department_id?: number;    
  roles: string[];
}
export interface TaskHistory {
  history_id: number;
  task_id: number;
  user_id: number;
  status_id?: number | null;
  action: string;
  old_percentage_complete?: number | null;
  new_percentage_complete?: number | null;
  status_after_update?: 'pending' | 'in_progress' | 'review' | 'done' | 'archived';
  created_at: string;
  first_name?: string;
  last_name?: string;

}
export interface CreateAccountPayload {
  email: string;
  password: string;
  status?: 'Active' | 'Inactive';
  role_id: number;
  user_id?: number;
}
interface CreateUserResponse {
  message: string;
  data: {
    user_id: number;
  };
}

export interface EmployeeReportCreateDTO {
    title: string;
    summary: string; 
    issues_and_proposals: string; 
    next_plan_or_resources: string;
    attachment_ids?: number[]; 
    submitted_to_id: number; 
}

export interface ManagerReportCreateDTO {
  title: string;
  summary: string;
  issues_and_proposals?: string;
  next_plan_or_resources?: string;
  submitted_to_id: number; 
  attachment_ids?: number[];
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface SuggestAssignmentRequest {
  taskId: string;
}

export interface SuggestAssignmentResponse {
  reply: string;
}

export interface PredictTaskRiskRequest {
  taskId: string;
}

export interface PredictTaskRiskResponse {
  reply: string;
}
// === THÊM INTERFACE CHO RESPONSE ===
export interface SuggestAssignmentResponse {
  reply: string;
}

export interface PredictTaskRiskResponse {
  reply: string;
}

export interface ChatResponse {
  reply: string;
}

// === CÁC REQUEST BODY ===
export interface ChatRequest {
  message: string;
}
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;

  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;

  totalUsers: number;
  activeUsers: number;

  departmentTaskLoad: Array<{
    department_name: string;
    task_count: number;
  }>;

  weeklyTaskProgress: Array<{
    day: string;
    completed: number;
    pending: number;
  }>;

  projectStatus: Array<{
    status: string;
    count: number;
  }>;

  topPerformers: Array<{
    full_name: string;
    completed_tasks: number;
  }>;
}
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',

      // Luôn gửi cookies (accessToken, refreshToken) trong mọi request
      credentials: 'include',

      prepareHeaders: (headers, { getState }) => {
        // 1. Lấy token từ Redux store
        const reduxToken = (getState() as RootState).auth?.token;

        // 2. Nếu không có trong Redux → thử lấy từ localStorage (fallback)
        const storageToken = reduxToken || localStorage.getItem('token');

        // 3. Nếu có token → thêm Authorization header
        if (storageToken) {
          headers.set('Authorization', `Bearer ${storageToken}`);
        }

        // Không cần set cookie thủ công → trình duyệt tự gửi nếu `credentials: 'include'`
        return headers;
      },
  }),
  tagTypes: [
   'Project', 'ProjectPart', 'Task', 'TaskAssignment', 'TaskProgress', 
    'Account', 'User', 'Department', 'Role', 'Permission', 'RolePermission',
    'Chatroom', 'Message', 'Notification', 'Report', 'ChatroomMember'
  ],
  endpoints: (builder) => ({
    // ========== AUTH ==========
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),

    getProfile: builder.query<User, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
    // =========== ACCOUNTS ===========
    getAccounts: builder.query<{ data: Account[] }, void>({
      query: () => "/auth/accounts",
      providesTags: ["Account"],
    }),
    deleteAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `/auth/accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Account"],
    }),
    updateAccount: builder.mutation<Account, { id: number; body: Partial<Account & { password?: string }> }>({
      query: ({ id, body }) => ({
        url: `/auth/accounts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Account"],
    }),
    createAccount: builder.mutation<Account, CreateAccountPayload>({
  query: (body) => ({
    url: "/auth/accounts",
    method: "POST",
    body,
  }),
  invalidatesTags: ["Account"],
}),
    // ========== PROJECTS ==========
    getProjects: builder.query<{data: Project[]}, void>({
      query: () => '/projects/',
      providesTags: ['Project'],
    }),

    getProjectById: builder.query<{data: Project}, number>({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),

    createProject: builder.mutation<Project, Partial<Project>>({
      query: (body) => ({ url: '/projects/', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),

    updateProject: builder.mutation<Project, { id: number; data: Partial<Project> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }],
    }),

    deleteProject: builder.mutation<void, number>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),

    // ========== PROJECT PARTS ==========
    getProjectParts: builder.query<{data: ProjectPart[]}, number>({
      query: (projectId) => `/projects/${projectId}/parts`,
      providesTags: ['ProjectPart'],
    }),

    getMyProjectParts: builder.query<{data: ProjectPart[]}, void>({
      query: () => '/projects/parts/my',
      providesTags: ['ProjectPart'],
    }),

    createProjectPart: builder.mutation<ProjectPart, { project_id: number; part_name: string }>({
      query: (body) => ({ url: '/projects/parts', method: 'POST', body }),
      invalidatesTags: ['ProjectPart'],
    }),

    updateProjectPart: builder.mutation<ProjectPart, { id: number; data: Partial<ProjectPart> }>({
      query: ({ id, data }) => ({ url: `/projects/parts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectPart', id }],
    }),

    deleteProjectPart: builder.mutation<void, number>({
      query: (id) => ({ url: `/projects/parts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ProjectPart'],
    }),

    // ========== TASKS ==========
    getMyTasks: builder.query<{data: Task[]}, void>({
      query: () => '/tasks/my',
      providesTags: ['Task'],
    }),

    getTaskById: builder.query<Task, number>({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation<Task, { title: string; assigned_users: number[] }>({
      query: (body) => ({ url: '/tasks/', method: 'POST', body }),
      invalidatesTags: ['Task'],
    }),

    updateTask: builder.mutation<Task, { id: number; data: Partial<Task> }>({
      query: ({ id, data }) => ({ url: `/tasks/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    deleteTask: builder.mutation<void, number>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
    getTasksByPartId: builder.query<{ data: Task[] }, number>({
      query: (partId) => `/tasks/part/${partId}`,
      providesTags: (result, error, partId) => [{ type: 'Task', id: partId }],
    }),
    getTaskFullDetail: builder.query<
      { data: Task & { task_history?: TaskHistory[]; assignments?: TaskAssignment[]; progresses?: TaskProgress[] } },
      number
    >({
      query: (taskId) => `/tasks/full/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: "Task", id: taskId }],
    }),
    getAssignedTasks: builder.query<{ data: Task[] }, void>({
      query: () => '/tasks/assigned',
      providesTags: ['Task'],
    }),

    // Task Progress (KHÔNG TRÙNG TÊN)
    updateTaskProgress: builder.mutation<void, { id: number; progress_percentage?: number, is_tick_complete?: boolean, milestone_description?: string }>({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}/progress`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    // Task Assignments
    changeMainAssignee: builder.mutation<void, { id: number; assignee_id: number }>({
      query: ({ id, assignee_id }) => ({
        url: `/tasks/${id}/main-assignee`,
        method: 'PUT',
        body: { assignee_id }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    updateTaskAssignments: builder.mutation<void, { id: number; assigned_users: number[] }>({
      query: ({ id, assigned_users }) => ({
        url: `/tasks/${id}/assignments`,
        method: 'PUT',
        body: { assigned_users }
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    // ========== CHAT ==========

   // 1. Tạo phòng chat
    createChatroom: builder.mutation<Chatroom, {
      chatroom_name: string;
      description?: string;
      chatroom_type: 'Private' | 'Group';
      member_ids: number[];
    }>({
      query: (body) => ({
        url: '/chat/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Chatroom'],
    }),

    // 2. Lấy danh sách phòng chat của tôi
    getMyChatrooms: builder.query<{ data: Chatroom[] }, void>({
      query: () => '/chat/',
      providesTags: ['Chatroom'],
    }),

    // 3. Lấy chi tiết phòng chat
    getChatroomById: builder.query<Chatroom, number>({
      query: (id) => `/chat/${id}`,
      providesTags: (result, error, id) => [{ type: 'Chatroom', id }],
    }),

    // 4. Lấy tin nhắn (phân trang)
    getMessages: builder.query<{ data: Message[] }, { chatroomId: number; limit?: number; offset?: number }>({
      query: ({ chatroomId, limit = 50, offset = 0 }) => ({
        url: `/chat/${chatroomId}/messages`,
        params: { limit, offset },
      }),
      providesTags: (result, error, { chatroomId }) => [
        { type: 'Message', id: 'LIST' },
        { type: 'Chatroom', id: chatroomId },
      ],
    }),

    // 5. Gửi tin nhắn (text + file)
   sendMessage: builder.mutation<{ success: boolean; data: Message }, FormData>({
  query: (formData) => {
    const chatroomId = formData.get('chatroom_id') as string;
    return {
      url: `/chat/${chatroomId}/messages`,
      method: 'POST',
      body: formData, // FormData chứa message_text (optional) và files[]
    };
  },
  invalidatesTags: (result, error, formData) => {
    const chatroomId = formData.get('chatroom_id') as string;
    return [
      { type: 'Message', id: 'LIST' },
      { type: 'Chatroom', id: Number(chatroomId) },
    ];
  },
}),

    // 6. Lấy danh sách thành viên
    getChatroomMembers: builder.query<{ data: ChatroomMember[] }, number>({
  query: (chatroomId) => `/chat/${chatroomId}/members`,
  providesTags: (result, error, chatroomId) => [
    { type: 'ChatroomMember', id: 'LIST' },
    { type: 'Chatroom', id: chatroomId },
  ],
}),

    // 7. Thêm thành viên
    addMembersToChatroom: builder.mutation<{ message: string }, {
      chatroomId: number;
      user_ids: number[];
    }>({
      query: ({ chatroomId, user_ids }) => ({
        url: `/chat/${chatroomId}/members`,
        method: 'POST',
        body: { user_ids },
      }),
      invalidatesTags: (result, error, { chatroomId }) => [
        { type: 'ChatroomMember', id: 'LIST' },
        { type: 'Chatroom', id: chatroomId },
      ],
    }),

    // 8. Xóa thành viên
    kickMemberFromChatroom: builder.mutation<{ message: string }, {
      chatroomId: number;
      userId: number;
    }>({
      query: ({ chatroomId, userId }) => ({
        url: `/chat/${chatroomId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { chatroomId }) => [
        { type: 'ChatroomMember', id: 'LIST' },
        { type: 'Chatroom', id: chatroomId },
      ],
    }),

downloadAttachment: builder.query<Blob, { chatroomId: number; attachmentId: number }>({
  query: ({ chatroomId, attachmentId }) => ({
    url: `/chat/${chatroomId}/attachments/${attachmentId}/download`,
    responseHandler: (response) => response.blob(),
    cache: "no-cache",
  }),

}),

    markChatroomAsRead: builder.mutation<void, number>({
  query: (chatroomId) => ({
    url: `/chat/${chatroomId}/read`,
    method: 'PUT',
  }),
  invalidatesTags: (result, error, chatroomId) => [
    { type: 'Chatroom', id: chatroomId },
    { type: 'Message', id: 'LIST' },
  ],
}),

    // ========== NOTIFICATIONS ==========
    getNotifications: builder.query<Notification[], void>({
      query: () => '/notifications/',
      providesTags: ['Notification'],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),

    // ========== DEPARTMENTS ==========
    getDepartments: builder.query<{data: Department[]}, void>({
      query: () => '/departments/',
      providesTags: ['Department'],
    }),

    getMyDepartmentUsers: builder.query<{ data: User[] }, void>({
      query: () => '/departments/my/users',
      providesTags: ['User'],
    }),
    getDepartmentById: builder.query<{ data: Department }, number>({
          query: (id) => `/departments/${id}`,
          providesTags: (result, error, id) => [{ type: 'Department', id }],
        }),
        getUsersByDepartment: builder.query<{ data: User[] }, number>({
      query: (departmentId) => `/auth/department/${departmentId}/users`,
      providesTags: ['User'],
    }),
    createDepartment: builder.mutation<{ data: Department }, Partial<Department>>({
  query: (body) => ({
    url: '/departments',
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Department'],
}),

  updateDepartment: builder.mutation<{ data: Department }, { id: number; body: Partial<Department> }>({
    query: ({ id, body }) => ({
      url: `/departments/${id}`,
      method: 'PUT',
      body,
    }),
    invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }],
  }),

  deleteDepartment: builder.mutation<{ message: string }, number>({
    query: (id) => ({
      url: `/departments/${id}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['Department'],
  }),
    // ========== RBAC ==========
    createRole: builder.mutation<Role, Partial<Role>>({ // <--- THÊM ENDPOINT NÀY
      query: (body) => ({
        url: '/rbac/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Role'],
    }),
    updateRole: builder.mutation<Role, { id: number; body: Partial<Role> }>({ // <--- THÊM ENDPOINT NÀY
      query: ({ id, body }) => ({
        url: `/rbac/roles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Role', id }],
    }),
    deleteRole: builder.mutation<void, number>({
      query: (id) => ({ 
        url: `/rbac/roles/${id}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['Role'],
    }),
    createPermission: builder.mutation<Permission, Partial<Permission>>({
      query: (body) => ({
        url: '/rbac/permissions', // Giả định endpoint API là /rbac/permissions
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),

    updatePermission: builder.mutation<Permission, { id: number; body: Partial<Permission> }>({
      query: ({ id, body }) => ({
        url: `/rbac/permissions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Permission', id }],
    }),

    deletePermission: builder.mutation<void, number>({
      query: (id) => ({
        url: `/rbac/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission'],
    }),
    
    getPermissions: builder.query<Permission[], void>({
      query: () => '/rbac/permissions',
     transformResponse: (response: { data: Permission[] }) => response.data,
      providesTags: ['Permission'],
    }),

    getRoles: builder.query<Role[], void>({
    query: () => '/rbac/roles',
    transformResponse: (response: any) => response.data || response,
   providesTags: ['Role'],
    }),

    getRolePermissions: builder.query<Permission[], number>({
      query: (role_id) => `/rbac/roles/${role_id}/permissions`,
      providesTags: (result, error, role_id) => [{ type: 'Role', id: role_id }],
    }),

    deletePermissionFromRole: builder.mutation<void, { role_id: number; permission_id: number }>({
  query: ({ role_id, permission_id }) => ({ 
    url: `/rbac/roles/${role_id}/permissions/${permission_id}`, 
    method: 'DELETE'  
  }),
  invalidatesTags: ['Role', 'Permission'],
}),

    assignPermissionToRole: builder.mutation<void, { role_id: number; permission_id: number }>({
      query: (body) => ({ 
        url: '/rbac/roles/permissions', 
        method: 'POST', 
        body 
      }),
      invalidatesTags: ['Role', 'Permission'],
    }),

    // ========== REPORTS ==========
getReports: builder.query<Report[], void>({
  query: () => '/reports/',
  transformResponse: (response: { message: string; data: Report[] }) => response.data,
  providesTags: ['Report'],
}),

    createEmployeeReport: builder.mutation<Report, EmployeeReportCreateDTO>({
  query: (body) => ({
    url: '/reports/employee',
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Report'],
}),

createManagerReport: builder.mutation<Report, ManagerReportCreateDTO>({
  query: (body) => ({
    url: '/reports/manager',
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Report'],
}),

reviewEmployeeReport: builder.mutation<Report, { reportId: number; review_result: string; comment: string; performance_rating: string }>({
  query: ({ reportId, ...body }) => ({
    url: `/reports/${reportId}/review/manager`,
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Report'],
}),

reviewManagerReport: builder.mutation<Report, { reportId: number; admin_review_result: string; admin_comment: string; strategic_value_rating: string }>({
  query: ({ reportId, ...body }) => ({
    url: `/reports/${reportId}/review/admin`,
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Report'],
}),
getReportById: builder.query<Report, number>({
  query: (id) => `/reports/${id}`,
  providesTags: (result, error, id) => [{ type: 'Report', id }],
}),

getMyManagers: builder.query<any[], void>({
  query: () => '/reports/my-managers',
  transformResponse: (response: { message: string; data: any[] }) => response.data,
  providesTags: [{ type: 'Report', id: 'MANAGERS' }],
}),
getAdmins: builder.query<any[], void>({
  query: () => '/reports/admins',
  transformResponse: (response: { message: string; data: any[] }) => response.data,
  providesTags: [{ type: 'Report', id: 'ADMINS' }],
}),
    // ========== USERS ==========
  getUsers: builder.query<{ data: User[] }, void>({
  query: () => 'auth/users/', 
  providesTags: ['User'],
}),
getUsersByIds: builder.query<User[], number[]>({
      query: (ids) => `/auth/users/by-ids?ids=${ids.join(",")}`,
    }),
    getUserById: builder.query<User, number>({
      query: (id) => `/auth/users/${id}`,
    }),
    updateUser: builder.mutation<User, { id: number; body: Partial<User> }>({
      query: ({ id, body }) => ({
        url: `/auth/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    createUser: builder.mutation<CreateUserResponse, Partial<User>>({
      query: (body) => ({
        url: "/auth/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    // ========== TASK HISTORY ==========
    getTaskHistory: builder.query<{ data: any[] }, number>({
      query: (id) => `/tasks/${id}/history`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    // ========== RESET PASSWORD ==========//
    resetPassword: builder.mutation({
  query: (data) => ({
    url: "/auth/reset-password",
    method: "POST",
    body: data,
  }),
  }),
  forgotPassword: builder.mutation({
  query: (data) => ({
    url: "/auth/forgot-password",
    method: "POST",
    body: data,
  }),
}),

chatbot: builder.mutation<ChatResponse, ChatRequest>({
  query: (body) => ({
    url: '/ai/chat',  
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Task'],
}),

suggestAssignment: builder.mutation<SuggestAssignmentResponse, SuggestAssignmentRequest>({
  query: (body) => ({
    url: '/ai/suggest',  
    method: 'POST',
    body,
  }),
  invalidatesTags: ['TaskAssignment'],
}),

predictTaskRisk: builder.mutation<PredictTaskRiskResponse, PredictTaskRiskRequest>({
  query: (body) => ({
    url: '/ai/risk',  
    method: 'POST',
    body,
  }),
  invalidatesTags: ['Task'],
}),

getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/dashboard/stats',
      transformResponse: (response: { data: DashboardStats }) => response.data, // Giả sử backend trả { success: true, data: {...} }
    }),

  }),
});

export const {
  // Auth
  useLoginMutation,
  useGetProfileQuery,

  // Projects
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,

  // Project Parts
  useGetProjectPartsQuery,
  useGetMyProjectPartsQuery,
  useCreateProjectPartMutation,
  useUpdateProjectPartMutation,
  useDeleteProjectPartMutation,

  // Tasks
  useGetMyTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskProgressMutation,  // Đã sửa tên không trùng
  useChangeMainAssigneeMutation,
  useUpdateTaskAssignmentsMutation,

  // Chat

  useCreateChatroomMutation,
  useGetMyChatroomsQuery,
  useGetChatroomByIdQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetChatroomMembersQuery,
  useAddMembersToChatroomMutation,
  useKickMemberFromChatroomMutation,
  useMarkChatroomAsReadMutation,
  useDownloadAttachmentQuery,
  useLazyDownloadAttachmentQuery,
  // Notifications
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,

  // Departments
  useGetDepartmentsQuery,
  useGetMyDepartmentUsersQuery,


  // RBAC
  useCreatePermissionMutation, 
  useUpdatePermissionMutation, 
  useDeletePermissionMutation, 
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetRolePermissionsQuery,
  useAssignPermissionToRoleMutation,
  useDeletePermissionFromRoleMutation,
  useDeleteRoleMutation,
  useUpdateRoleMutation,
  useCreateRoleMutation,

  // Reports
  useGetReportsQuery,
  useGetReportByIdQuery,   
  useCreateEmployeeReportMutation, 
  useCreateManagerReportMutation,  
  useReviewEmployeeReportMutation,
  useReviewManagerReportMutation,  
  useGetMyManagersQuery,
  useGetAdminsQuery,

  // Users
  useGetUsersQuery,

  //Thêm
  useGetTasksByPartIdQuery,
  useGetTaskFullDetailQuery,
  useGetUsersByIdsQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateAccountMutation,
  useCreateAccountMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetDepartmentByIdQuery,
  useGetTaskHistoryQuery,
  // useUploadAttachmentsMutation,
  useGetUsersByDepartmentQuery,
  useGetAssignedTasksQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  //Accounts
  useGetAccountsQuery, 
  useDeleteAccountMutation,

  // Reset Password
  useResetPasswordMutation,
  useForgotPasswordMutation,

  useChatbotMutation,  // Cho chat
  useSuggestAssignmentMutation,  // Cho gợi ý phân công
  usePredictTaskRiskMutation,

  useGetDashboardStatsQuery,
} = api;