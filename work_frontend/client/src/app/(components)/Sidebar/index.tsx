"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Layout,
  User,
  UserCog,
  Shield,
  Clipboard,
  CircleDollarSign,
  Menu,
  Archive,
  MessageSquare,
  Brain,
  Building2,
  Bell,
  Building,
} from "lucide-react";
import Image from "next/image";
import SidebarLink from "./SidebarLink";

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const permissions = useAppSelector((state) => state.auth.permissions); 
  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  // ✅ Danh sách menu khớp với SIDEBAR_PERMISSIONS
  const menuItems = [
    {
      href: "/dashboard",
      icon: Layout,
      label: "Dashboard",
      permissions: [
        "auth:logout",
        "auth:change-password",
        "notifications:list",
      ],
    },
    {
      href: "/employees",
      icon: User,
      label: "Employees",
      permissions: [
        "user:list",
        "user:create",
        "user:read",
        "user:update",
        "user:delete",
      ],
    },
    {
      href: "/accounts",
      icon: UserCog,
      label: "Accounts",
      permissions: [
        "account:list",
        "account:create",
        "account:read",
        "account:update",
        "account:delete",
      ],
    },
    {
      href: "/roles",
      icon: Shield,
      label: "Roles",
      permissions: [
        "rbac:role:list",
        "rbac:role:create",
        "rbac:role:assign-permission",
        "rbac:role:remove-permission",
      ],
    },
    {
      href: "/permissions",
      icon: Shield,
      label: "Permissions",
      permissions: ["rbac:permission:list", "rbac:permission:create"],
    },
    // {
    //   href: "/rbac",
    //   icon: UserCog,
    //   label: "RBAC Assignments",
    //   permissions: [
    //     "rbac:account:assign-role",
    //     "rbac:account:remove-role",
    //     "rbac:account:roles:list",
    //   ],
    // },
    {
      href: "/projects",
      icon: CircleDollarSign,
      label: "Projects",
      permissions: [
        "project:list",
        "project:read",
        "project:create",
        "project:update",
        "project:delete",
      ],
    },
    {
      href: "/tasks",
      icon: Clipboard,
      label: "Tasks",
      permissions: [
        "task:my:list",
        "task:create",
        "task:read",
        "task:update-progress",
      ],
    },
    {
      href: "/department-tasks",
      icon: Building,
      label: "Department Tasks",
      permissions: ["task:department:create"],
    },
    {
      href: "/reports",
      icon: Archive,
      label: "Reports",
      permissions: [
        "create:employee:report",
        "create:manager:report",
        "review:employee:report",
      ],
    },
    {
      href: "/departments",
      icon: Building2,
      label: "Departments",
      permissions: [
        "department:list",
        "department:read",
        "department:admin",
        "department:create",
        "department:update",
        "department:delete",
      ],
    },
    {
      href: "/ai",
      icon: Brain,
      label: "AI Features",
      permissions: [
        "ai:chatbot",
        "ai:suggest-assignment",
        "ai:predict-risk",
        "ai:department-risks",
      ],
    },
    {
      href: "/chatroom",
      icon: MessageSquare,
      label: "Chat",
      permissions: [
        "chat:list",
        "chat:create-room",
        "chat:read",
        "chat:messages:read",
        "chat:add-members",
        "chat:kick-member",
        "chat:members:list",
        "chat:messages:create",
      ],
    },
    {
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      permissions: [
        "notifications:list",
        "notifications:mark-read",
        "notifications:mark-all-read",
      ],
    },
  ];

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-8 ${
          isSidebarCollapsed ? "px-5" : "px-8"
        }`}
      >
        {/* <Image
          src="https://s3-inventorymanagement.s3.us-east-2.amazonaws.com/logo.png"
          alt="edstock-logo"
          width={27}
          height={27}
          className="rounded w-8"
        /> */}
        <h1
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } font-extrabold text-2xl`}
        >
          SGU Work 
        </h1>

        <button
          className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* LINKS */}
      <div className="flex-grow mt-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        {menuItems.map((item) => {
          const hasPermission =
            item.permissions.length === 0 ||
            item.permissions.some((perm) => permissions.includes(perm));

          if (!hasPermission) return null;

          return (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isSidebarCollapsed}
            />
          );
        })}
      </div>

      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">&copy; 2025 SGU</p>
      </div>
    </div>
  );
};

export default Sidebar;
