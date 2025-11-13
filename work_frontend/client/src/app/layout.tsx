// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./redux"; // <-- THÊM DÒNG NÀY
import { Toaster } from "react-hot-toast"; // <-- import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGU Work",
  description: "Work Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          {" "}
          {/* BỌC TOÀN BỘ APP VÀO ĐÂY */}
          {children}
          {/* Thêm Toaster ở đây */}
          <Toaster position="top-right" reverseOrder={false} />
        </StoreProvider>
      </body>
    </html>
  );
}
