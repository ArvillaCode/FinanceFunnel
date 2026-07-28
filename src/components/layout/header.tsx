"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { SidebarContent } from "./sidebar-content";

export function Header() {
  const { profile } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-background sticky top-0 z-40">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <span className="font-bold text-lg tracking-tight">FinanceFunnel</span>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>{profile?.full_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
