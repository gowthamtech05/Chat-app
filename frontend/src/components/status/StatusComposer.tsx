import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ArrowLeft, Image as ImageIcon, Send, Type, Video, X } from "lucide-react";
import type { StatusType } from "../../types/status";
import { getVideoDurationSeconds } from "../../utils/fileToDataUrl";

interface StatusComposerProps {
  onPost: (type: StatusType, content: string | File, backgroundId?: string) => Promise<void> | void;
  onClose: () => void;
}

const BACKGROUNDS = [
  { id: "green", className: "bg-gradient-to-br from-[#25d366] to-[#006d2f] text-white" },
  { id: "mint", className: "bg-gradient-to-br from-[#a5ede0] to-[#25d366] text-[#005047]" },
  { id: "warm", className: "bg-gradient-to-br from-[#faf2ea] to-[#e8e1d9] text-[#1e1b17]" },
  { id: "dark", className: "bg-[#1e1b17] text-white" },
];

const MAX_VIDEO_SECONDS = 30;

export default function StatusComposer({ onPost, onClose }: StatusComposerProps) {
  const [mode, setMode] = useState<StatusType>("text");
  const [text, setText] = useState("");
  const [backgroundId, setBackgroundId] = useState(BACKGROUNDS[0].id);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const background = BACKGROUNDS.find((b) => b.id === backgroundId) || BACKGROUNDS[0];

  const resetMedia = () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    setMediaFile(null);
  };

  const handlePickMedia = (type: "image" | "video") => {
    setMode(type);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (mode === "video") {
      try {
        const duration = await getVideoDurationSeconds(file);
        if (duration > MAX_VIDEO_SECONDS) {
          setError(`Videos must be under ${MAX_VIDEO_SECONDS} seconds.`);
          return;
        }
      } catch {
        setError("Couldn't read that video file.");
        return;
      }
    }

    resetMedia();
    setMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
  };

  const canPost = mode === "text" ? text.trim().length > 0 : Boolean(mediaFile);

  const handlePost = async () => {
    if (!canPost || isPosting) return;
    setIsPosting(true);
    setError(null);
    try {
      if (mode === "text") {
        await onPost("text", text.trim(), backgroundId);
      } else if (mediaFile) {
        await onPost(mode, mediaFile);
      }
    } catch (err) {
      console.error("Failed to post status:", err);
      setError("Something went wrong posting your status. Please try again.");
      setIsPosting(false);
      return;
    }
    setIsPosting(false);
  };

  return (
    <div className="fixed inset-0 z-70 flex flex-col bg-[#1e1b17]">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              resetMedia();
              setMode("text");
              setError(null);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              mode === "text" ? "bg-[#25d366] text-[#005523]" : "text-white/80 hover:bg-white/10"
            }`}
            aria-label="Text status"
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePickMedia("image")}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              mode === "image" ? "bg-[#25d366] text-[#005523]" : "text-white/80 hover:bg-white/10"
            }`}
            aria-label="Image status"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePickMedia("video")}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              mode === "video" ? "bg-[#25d366] text-[#005523]" : "text-white/80 hover:bg-white/10"
            }`}
            aria-label="Video status"
          >
            <Video className="h-4 w-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={mode === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {mode === "text" && (
          <div
            className={`flex h-full w-full max-w-md items-center justify-center rounded-2xl p-6 text-center text-2xl font-semibold ${background.className}`}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a status"
              rows={4}
              autoFocus
              className="w-full resize-none bg-transparent text-center outline-none placeholder:opacity-70"
            />
          </div>
        )}

        {mode === "image" &&
          (mediaPreviewUrl ? (
            <div className="relative max-h-full max-w-md">
              <img
                src={mediaPreviewUrl}
                alt="Status preview"
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
              <button
                onClick={resetMedia}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handlePickMedia("image")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/30 px-10 py-14 text-white/70 transition-colors hover:border-white/60"
            >
              <ImageIcon className="h-8 w-8" />
              Choose an image
            </button>
          ))}

        {mode === "video" &&
          (mediaPreviewUrl ? (
            <div className="relative max-h-full max-w-md">
              <video src={mediaPreviewUrl} controls className="max-h-[70vh] w-full rounded-xl object-contain" />
              <button
                onClick={resetMedia}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                aria-label="Remove video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handlePickMedia("video")}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/30 px-10 py-14 text-white/70 transition-colors hover:border-white/60"
            >
              <Video className="h-8 w-8" />
              Choose a video (under {MAX_VIDEO_SECONDS}s)
            </button>
          ))}
      </div>

      {mode === "text" && (
        <div className="flex items-center justify-center gap-2 pb-3">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBackgroundId(bg.id)}
              className={`h-7 w-7 rounded-full ${bg.className} ${
                backgroundId === bg.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1b17]" : ""
              }`}
              aria-label={`Background ${bg.id}`}
            />
          ))}
        </div>
      )}

      {error && <p className="px-4 pb-2 text-center text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-3 px-4 pb-5">
        <button
          onClick={handlePost}
          disabled={!canPost || isPosting}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-[#005523] shadow-sm transition-all enabled:hover:bg-[#20bd5c] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Post status"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}