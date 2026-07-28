"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard, ArrowRightLeft, Tags, Wallet, Settings,
  PanelLeftClose, PanelLeftOpen, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      className="hidden md:flex flex-col border-r bg-card h-screen sticky top-0 overflow-hidden"
    >
      <div className={cn("flex items-center p-4 h-14", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">FinanceFunnel</span>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className={cn("space-y-2 p-4 border-t", collapsed && "flex flex-col items-center")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full justify-center"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="text-sm ml-2">{resolvedTheme === "dark" ? "Light" : "Dark"}</span>}
        </Button>
        {profile && (
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{profile.full_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
