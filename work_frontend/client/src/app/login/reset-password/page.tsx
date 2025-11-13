"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useResetPasswordMutation } from "@/state/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Liên kết không hợp lệ hoặc đã hết hạn.");
      return;
    }

    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      setSuccess("Mật khẩu đã được đặt lại thành công!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.data?.message || "Không thể đặt lại mật khẩu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-10 text-white">
        <h2 className="text-3xl font-bold text-center mb-6">
          Đặt lại mật khẩu
        </h2>

        {success && (
          <p className="text-green-300 text-center mb-4 bg-green-600/30 py-2 rounded-lg">
            {success}
          </p>
        )}
        {error && (
          <p className="text-red-300 text-center mb-4 bg-red-600/30 py-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-white/70" size={18} />
            <input
              type={show ? "text" : "password"}
              className="w-full bg-white/10 border border-white/30 rounded-lg pl-10 pr-10 px-3 py-3 placeholder-white/60 focus:ring-2 focus:ring-white outline-none transition"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-3 text-white/70 hover:text-white transition"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-white/90 hover:bg-white text-blue-600 font-semibold rounded-lg py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Đang đặt lại..." : "Xác nhận mật khẩu mới"}
          </button>
        </form>
      </div>
    </div>
  );
}
