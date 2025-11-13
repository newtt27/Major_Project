"use client";

import DashboardWrapper from "../../dashboardWrapper";
import { useState } from "react";

const NewReportPage = () => {
  const [report, setReport] = useState({
    title: "Task Status Report",
    description: "Báo cáo trạng thái công việc của phòng IT",
    report_type: "TaskStatusByDepartment",
    generated_by: "Nguyễn Văn A",
    generated_at: new Date().toISOString(),
    report_data: {
      department: "IT Department",
      total_tasks: 1,
      completed: 0,
      in_progress: 0,
      todo: 1,
    },
    tasks: [
      {
        task_id: 1,
        title: "Setup database",
        description: "Tạo cơ sở dữ liệu cho dự án",
        status_id: 1,
        start_date: "2025-10-25",
        due_date: "2025-10-28",
      },
    ],
  });

  return (
    <DashboardWrapper>
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create New Report</h1>

        <div className="mb-6">
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            value={report.title}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={report.description}
            className="w-full border px-3 py-2 rounded-lg"
            rows={3}
          />
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-1">Report Type</label>
          <select
            value={report.report_type}
            className="w-full border px-3 py-2 rounded-lg"
          >
            <option value="TaskStatusByDepartment">
              Task Status by Department
            </option>
            <option value="TaskStatusByUser">Task Status by User</option>
            <option value="Performance">User Performance</option>
            <option value="Department">Department Overview</option>
          </select>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Summary Data (JSON)</h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(report.report_data, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 text-left">
                  <th className="py-2 px-4">Task ID</th>
                  <th className="py-2 px-4">Title</th>
                  <th className="py-2 px-4">Description</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Start Date</th>
                  <th className="py-2 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {report.tasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b border-gray-200 dark:border-gray-600"
                  >
                    <td className="py-2 px-4">{task.task_id}</td>
                    <td className="py-2 px-4">{task.title}</td>
                    <td className="py-2 px-4">{task.description}</td>
                    <td className="py-2 px-4">{task.status_id}</td>
                    <td className="py-2 px-4">{task.start_date}</td>
                    <td className="py-2 px-4">{task.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="mt-6 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
          Save Report
        </button>
      </div>
    </DashboardWrapper>
  );
};

export default NewReportPage;
