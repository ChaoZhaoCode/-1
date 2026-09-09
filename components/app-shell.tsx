"use client";

import { BookOpenText, CircleUserRound, GraduationCap, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "今日", icon: House },
  { href: "/course", label: "课程", icon: GraduationCap },
  { href: "/patterns", label: "句式库", icon: BookOpenText },
  { href: "/me", label: "我的", icon: CircleUserRound }
];

export function AppShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={compact ? "v2-app v2-app--compact" : "v2-app"}>
      <header className="v2-nav">
        <Link className="v2-brand" href="/" aria-label="Kotoba 首页">
          <span>こ</span>
          <b>KOTOBA</b>
        </Link>
        <nav aria-label="主导航">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link className={active ? "is-active" : ""} href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}

