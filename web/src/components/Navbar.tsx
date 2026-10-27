"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, Cpu, Gamepad2, Wrench, GitCompare, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Monitor },
    { href: "/link", label: "Liên kết máy", icon: ShieldCheck },
    { href: "/games", label: "FPS theo game", icon: Gamepad2 },
    { href: "/recommendations", label: "Khuyến nghị", icon: Wrench },
    { href: "/compare", label: "So sánh cấu hình", icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
                ⚡
              </div>
              <div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  FPS Advisor
                </span>
                <span className="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
                  Chẩn đoán & Tối ưu PC Gaming
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/link"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              Nhập mã liên kết
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
