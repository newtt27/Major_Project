// DashboardWrapper.tsx
"use client";

import React, { useEffect } from "react";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import { useAppSelector } from "./redux";

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.classList.toggle("light", !isDarkMode);
  }, [isDarkMode]);

  // TẮT SCROLL TOÀN TRANG
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={`
        ${isDarkMode ? "dark" : "light"}
        flex bg-gray-50 text-gray-900 w-full h-screen overflow-hidden
      `}
    >
      <Sidebar />

      {/* Main Content */}
      <main
        className={`
          flex flex-col flex-1 overflow-hidden
          ${isSidebarCollapsed ? "md:pl-24" : "md:pl-72"}
          transition-all duration-300
        `}
      >
        {/* Navbar cố định */}
        <div className="h-16 flex-shrink-0 border-b bg-white dark:bg-gray-800">
          <Navbar />
        </div>

        {/* Nội dung chính: scroll riêng */}
        <div className="flex-1 overflow-y-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardWrapper;