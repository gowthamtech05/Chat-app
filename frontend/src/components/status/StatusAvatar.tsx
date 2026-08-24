import { Plus } from "lucide-react";
import { getUserInitial } from "../../utils/userDisplay";

type StatusAvatarSize = "sm" | "md" | "lg";
type StatusAvatarRing = "none" | "unviewed" | "viewed";

interface StatusAvatarProps {
  name?: string | null;
  ring: StatusAvatarRing;
  size?: StatusAvatarSize;
  showAddBadge?: boolean;
}

const SIZE_CLASSES: Record<StatusAvatarSize, { outer: string; inner: string; text: string }> = {
  sm: { outer: "h-11 w-11", inner: "h-9 w-9", text: "text-xs" },
  md: { outer: "h-14 w-14", inner: "h-12 w-12", text: "text-sm" },
  lg: { outer: "h-16 w-16", inner: "h-14 w-14", text: "text-base" },
};

const RING_CLASSES: Record<StatusAvatarRing, string> = {
  none: "border-transparent",
  unviewed: "border-[#25d366]",
  viewed: "border-[#bbcbb9]",
};

export default function StatusAvatar({ name, ring, size = "md", showAddBadge }: StatusAvatarProps) {
  const sizing = SIZE_CLASSES[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full border-2 p-0.5 ${RING_CLASSES[ring]} ${sizing.outer}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-[#006d2f] font-bold text-white ${sizing.inner} ${sizing.text}`}
      >
        {getUserInitial(name)}
      </div>
      {showAddBadge && (
        <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#25d366] text-[#005523]">
          <Plus className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}