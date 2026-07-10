"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings, User, LifeBuoy, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants/enums";
import { useApp } from "./app-context";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

export function UserMenu() {
  const { user, role } = useApp();
  const router = useRouter();

  async function logout() {
    try {
      await api.post<{ redirect: string }>("/api/auth/logout");
      toast.success("Signed out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight">{user.name}</span>
          <span className="block text-2xs text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar name={user.name} color={user.avatarColor} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="px-2.5 pb-2">
          <Badge variant="primary" size="sm">{ROLE_LABELS[role]}</Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings"><User /> Profile & account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings /> Workspace settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="mailto:support@actioninbox.ai"><LifeBuoy /> Help & support</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
