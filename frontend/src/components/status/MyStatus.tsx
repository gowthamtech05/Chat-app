import { Plus } from "lucide-react";
import type { Status } from "../../types/status";
import type { User as UserType } from "../../types/user";
import { formatStatusTime } from "../../utils/statusTime";
import StatusAvatar from "./StatusAvatar";

interface MyStatusProps {
  currentUser: UserType | null | undefined;
  myStatuses: Status[];
  onAdd: () => void;
  onOpen: () => void;
}

export default function MyStatus({ currentUser, myStatuses, onAdd, onOpen }: MyStatusProps) {
  const hasStatus = myStatuses.length > 0;
  const latest = hasStatus ? myStatuses[myStatuses.length - 1] : null;

  return (
    <div
      onClick={hasStatus ? onOpen : onAdd}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#f4ede5]"
    >
      <div className="relative">
        <StatusAvatar name={currentUser?.name} ring={hasStatus ? "unviewed" : "none"} size="md" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#25d366] text-[#005523] shadow-sm transition-colors hover:bg-[#20bd5c]"
          aria-label="Add status"
        >
          <Plus className="h-3 w-3" strokeWidth={3} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-[#1e1b17]">My Status</h4>
        <p className="truncate text-xs text-[#6c7b6b]">
          {hasStatus
            ? `${formatStatusTime(latest!.createdAt)} · ${myStatuses.length} update${
                myStatuses.length > 1 ? "s" : ""
              }`
            : "Add a status update"}
        </p>
      </div>
    </div>
  );
}