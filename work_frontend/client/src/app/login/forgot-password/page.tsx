"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForgotPasswordMutation } from "@/state/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await forgotPassword({ email }).unwrap();
      setMessage("Trang đổi mật khẩu đã được gửi về email của bạn.");
    } catch (err: any) {
      setError(
        err.data?.message || "Không thể xử lý yêu cầu, vui lòng thử lại."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-10 text-white">
        <h2 className="text-3xl font-bold text-center mb-6">Quên mật khẩu</h2>
        <p className="text-center mb-6 text-white/80">
          Nhập email của bạn để nhận trang đổi mật khẩu
        </p>

        {message && (
          <p className="text-green-300 text-center mb-4 bg-green-600/30 py-2 rounded-lg">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-300 text-center mb-4 bg-red-600/30 py-2 rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-white/70" size={18} />
            <input
              type="email"
              className="w-full bg-white/10 border border-white/30 rounded-lg pl-10 px-3 py-3 placeholder-white/60 focus:ring-2 focus:ring-white outline-none transition"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/90 hover:bg-white text-blue-600 font-semibold rounded-lg py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang xử lý..." : "Gửi yêu cầu đổi mật khẩu"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-white/80 hover:text-white hover:underline transition"
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
