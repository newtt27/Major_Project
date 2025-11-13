"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/redux";
import { loginSuccess } from "@/state/authSlice";
import { useLoginMutation } from "@/state/api";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login({ email, password }).unwrap();
      console.log("User ID:", response.userId);
      console.log("role", response.roles);
      dispatch(
        loginSuccess({
          accessToken: response.accessToken,
          permissions: response.permissions,
          userId: response.userId,
          roles: response.roles,
          departmentId: response.department_id,
        })
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-10 text-white">
        <h2 className="text-3xl font-bold text-center mb-6">
          Chào mừng trở lại
        </h2>
        <p className="text-center mb-6 text-white/80">
          Đăng nhập để tiếp tục vào hệ thống
        </p>

        {error && (
          <p className="text-red-300 text-center mb-4 bg-red-600/30 py-2 rounded-lg">
            {error}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
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

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-white/70" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-white/10 border border-white/30 rounded-lg pl-10 pr-10 px-3 py-3 placeholder-white/60 focus:ring-2 focus:ring-white outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-white/70 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Nút quên mật khẩu */}
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => router.push("/login/forgot-password")}
              className="text-sm text-white/80 hover:text-white hover:underline transition cursor-pointer bg-transparent border-none"
            >
              Quên mật khẩu?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-white/90 hover:bg-white text-blue-600 font-semibold rounded-lg py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-white/80 mt-6">
          Chưa có tài khoản?{" "}
          <a
            href="/register"
            className="text-white font-semibold hover:underline"
          >
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}
