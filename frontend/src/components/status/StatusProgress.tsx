interface StatusProgressProps {
  count: number;
  activeIndex: number;
  progress: number;
}

export default function StatusProgress({ count, activeIndex, progress }: StatusProgressProps) {
  return (
    <div className="flex w-full gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-100 ease-linear"
            style={{ width: i < activeIndex ? "100%" : i === activeIndex ? `${progress}%` : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}