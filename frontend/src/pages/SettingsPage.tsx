import { LogOut } from "lucide-react";
import type { User as UserType } from "../types/user";
import { getUserInitial } from "../utils/userDisplay";

interface SettingsPageProps {
  currentUser: UserType | null | undefined;
  onLogout: () => void;
}

export default function SettingsPage({ currentUser, onLogout }: SettingsPageProps) {
  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto p-4">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1e1b17]">Settings</h1>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#bbcbb9]/30 bg-[#faf2ea] p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006d2f] text-sm font-bold text-white">
          {getUserInitial(currentUser?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-[#1e1b17]">{currentUser?.name}</h4>
          <p className="truncate text-xs text-[#6c7b6b]">{currentUser?.email}</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}