import { Radio } from "lucide-react";

export default function ChannelsPage() {
  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto p-4">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1e1b17]">Channels</h1>
      <div className="my-auto flex flex-1 flex-col items-center justify-center text-center text-[#6c7b6b]">
        <Radio className="mb-3 h-10 w-10 text-[#25d366] opacity-80" />
        <p className="font-semibold text-[#1e1b17]">Post Update will coming soon</p>
        <p className="mt-1 text-xs text-[#6c7b6b]">
          Find channels to follow and stay informed on topics that interest you.
        </p>
      </div>
    </div>
  );
}