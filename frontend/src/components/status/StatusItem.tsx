import type { StatusGroup } from "../../types/status";
import { formatStatusTime } from "../../utils/statusTime";
import StatusAvatar from "./StatusAvatar";

interface StatusItemProps {
  group: StatusGroup;
  onClick: () => void;
}

export default function StatusItem({ group, onClick }: StatusItemProps) {
  const latest = group.statuses[group.statuses.length - 1];

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#f4ede5]"
    >
      <StatusAvatar name={group.userName} ring={group.hasUnviewed ? "unviewed" : "viewed"} size="sm" />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-[#1e1b17]">{group.userName}</h4>
        <p className="truncate text-xs text-[#6c7b6b]">{formatStatusTime(latest.createdAt)}</p>
      </div>
    </div>
  );
}