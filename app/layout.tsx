import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日语强制输出训练台",
  description: "面向 N2 左右但口语输出弱的学习者，训练句式调用和真实场景表达。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
