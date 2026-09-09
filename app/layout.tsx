import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOTOBA｜日语输出课程",
  description: "面向 N2 左右但口语输出较弱的学习者，通过连续场景练习日语表达。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
