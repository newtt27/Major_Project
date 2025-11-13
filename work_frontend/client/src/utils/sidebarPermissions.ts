export const SIDEBAR_PERMISSIONS: Record<string, string[]> = {
  // Dashboard
  "/dashboard": [
    "auth:logout",
    "auth:change-password",
    "notifications:list",
  ],

  // Users
  "/employees": [
    "user:list",
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "user:profile:read",
    "user:register",
  ],

  // Accounts
  "/accounts": [
    "account:list",
    "account:create",
    "account:read",
    "account:update",
    "account:delete",
    "rbac:account:roles:list",
  ],

  // Roles & Permissions
  "/roles": [
    "rbac:role:list",
    "rbac:role:create",
    "rbac:role:update",     
    "rbac:role:delete",      
    "rbac:role:assign-permission",
    "rbac:role:remove-permission",
    "rbac:role:permissions:list",
  ],

  "/permissions": [
    "rbac:permission:list",
    "rbac:permission:create",
    "rbac:permission:update",  
    "rbac:permission:delete",  
  ],

  // RBAC Assignments
  // "/rbac": [
  //   "rbac:account:assign-role",
  //   "rbac:account:remove-role",
  //   "rbac:account:roles:list",
  // ],

  // Projects
  "/projects": [
    "project:list",
    "project:read",
    "project:create",
    "project:update",
    "project:delete",
    "project:parts:list",
    "project:part:create",
    "project:part:update",
    "project:part:delete",
    "project:parts:my:list",
  ],

  // Tasks
  "/tasks": [
    "task:my:list",
    "task:create",
    "task:read",
    "task:update-progress",
    "task:upload-attachment",
    "task:update",
    "task:delete",
    "task:change-assignee",
    "task:update-assignments",
    "task:history:read",

    //Thêm
    "task:department:create",
  ],

  // Reports
  "/reports": [
    "create:employee:report",
    "create:manager:report",
    "review:employee:report",
    "review:manager:report",
  ],

  // Departments
  "/departments": [
    "department:list",
    "department:read",
    "department:admin",
    "department:create",
    "department:update",
    "department:delete",
  ],

  // AI Features
  "/ai": [
    "ai:chatbot",
    "ai:suggest-assignment",
    "ai:predict-risk",
    "ai:department-risks",
  ],

  // Chat
  "/chatroom": [
    "chat:list",
    "chat:create-room",
    "chat:read",
    "chat:messages:read",
    "chat:add-members",
    "chat:kick-member",
    "chat:members:list",
    "chat:messages:create",
  ],

  // Notifications
  "/notifications": [
    "notifications:list",
    "notifications:mark-read",
    "notifications:mark-all-read",
  ],
};
