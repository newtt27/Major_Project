// components/SidebarLink.tsx (hoặc trong Sidebar.tsx)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { useAppSelector } from "@/app/redux";
import { SIDEBAR_PERMISSIONS } from "@/utils/sidebarPermissions";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const { permissions } = useAppSelector((state) => state.auth); // LẤY PERMISSIONS
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  // KIỂM TRA QUYỀN
  const requiredPermissions = SIDEBAR_PERMISSIONS[href] || [];
  const hasPermission =
    requiredPermissions.length === 0 ||
    requiredPermissions.some((perm) => permissions.includes(perm));

  // ẨN HOÀN TOÀN NẾU KHÔNG CÓ QUYỀN
  if (!hasPermission) return null;

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        }
        hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-white" : ""
        }`}
      >
        <Icon className="w-6 h-6 !text-gray-700" />
        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium text-gray-700`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

export default SidebarLink;
