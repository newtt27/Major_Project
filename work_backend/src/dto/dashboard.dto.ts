// src/dto/dashboard.dto.ts
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