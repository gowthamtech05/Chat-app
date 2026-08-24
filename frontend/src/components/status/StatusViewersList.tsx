import { Heart, X } from "lucide-react";
import type { Status } from "../../types/status";
import { formatStatusTime } from "../../utils/statusTime";
import StatusAvatar from "./StatusAvatar";

interface StatusViewersListProps {
  status: Status;
  onClose: () => void;
}

export default function StatusViewersList({ status, onClose }: StatusViewersListProps) {
  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#bbcbb9]/40 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1e1b17]">
            {status.viewers.length} view{status.viewers.length === 1 ? "" : "s"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#3c4a3d] hover:bg-[#f4ede5]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">Viewed by</h4>
          {status.viewers.length === 0 ? (
            <p className="mb-4 text-xs text-[#6c7b6b]">No views yet.</p>
          ) : (
            <div className="mb-4 space-y-2">
              {[...status.viewers]
                .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
                .map((v) => (
                  <div key={v.userId} className="flex items-center gap-3">
                    <StatusAvatar name={v.userName} ring="none" size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#1e1b17]">
                      {v.userName}
                    </p>
                    <span className="shrink-0 text-xs text-[#6c7b6b]">{formatStatusTime(v.viewedAt)}</span>
                  </div>
                ))}
            </div>
          )}

          <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">
            <Heart className="h-3.5 w-3.5" /> Likes ({status.likes.length})
          </h4>
          {status.likes.length === 0 ? (
            <p className="text-xs text-[#6c7b6b]">No likes yet.</p>
          ) : (
            <div className="space-y-2">
              {status.likes.map((l) => (
                <div key={l.userId} className="flex items-center gap-3">
                  <StatusAvatar name={l.userName} ring="none" size="sm" />
                  <p className="truncate text-sm font-medium text-[#1e1b17]">{l.userName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}