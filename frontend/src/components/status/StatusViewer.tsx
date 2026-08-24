import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Heart, Send, Trash2, X } from "lucide-react";
import type { StatusGroup } from "../../types/status";
import { formatStatusTime } from "../../utils/statusTime";
import StatusAvatar from "./StatusAvatar";
import StatusProgress from "./StatusProgress";
import { createChat, sendMessage } from "../../features/chat/chatAPI";

const TEXT_IMAGE_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 100;

interface StatusViewerProps {
  group: StatusGroup;
  startIndex: number;
  currentUserId?: string;
  onClose: () => void;
  onView: (statusId: string) => void;
  onToggleLike: (statusId: string) => void;
  onActiveStatusChange?: (statusId: string) => void;
  onShowViewers: () => void;
  onDeleteStatus: (statusId: string) => void;

  forcePaused?: boolean;
}

export default function StatusViewer({
  group,
  startIndex,
  currentUserId,
  onClose,
  onView,
  onToggleLike,
  onActiveStatusChange,
  onShowViewers,
  onDeleteStatus,
  forcePaused = false,
}: StatusViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);
  const safeIndex = Math.min(index, group.statuses.length - 1);
  const status = group.statuses[safeIndex];
  const isOwn = status.userId === currentUserId;
  const liked = Boolean(currentUserId && status.likes.some((l) => l.userId === currentUserId));

  const goNext = useCallback(() => {
    if (safeIndex >= group.statuses.length - 1) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }, [safeIndex, group.statuses.length, onClose]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    onView(status.id);
    onActiveStatusChange?.(status.id);
    setProgress(0);
  }, [status.id]);

  useEffect(() => {
    if (paused || forcePaused || status.type === "video") return;

    const durationMs = TEXT_IMAGE_DURATION_MS;
    const start = Date.now() - (progress / 100) * durationMs;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        goNext();
      }
    }, PROGRESS_TICK_MS);

    return () => clearInterval(interval);
    
  }, [status.id, paused, forcePaused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || status.type !== "video") return;

    if (paused || forcePaused) {
      video.pause();
    } else {
      video.play().catch(() => {
        
      });
    }
  }, [paused, forcePaused, status.type]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || isSendingReply) return;

    setIsSendingReply(true);
    setReplyError(null);
    try {
      const chat = await createChat(status.userId);
      await sendMessage(chat._id, text);
      setReplyText("");
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch (err) {
      console.error("Failed to send status reply:", err);
      setReplyError("Couldn't send. Try again.");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex flex-col bg-black">
      <div className="px-3 pt-3">
        <StatusProgress count={group.statuses.length} activeIndex={safeIndex} progress={progress} />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StatusAvatar name={group.userName} ring="none" size="sm" />
            <div>
              <p className="text-sm font-semibold text-white">{isOwn ? "My Status" : group.userName}</p>
              <p className="text-xs text-white/70">{formatStatusTime(status.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <button
          onClick={goPrev}
          onMouseDown={pause}
          onMouseUp={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-default"
          aria-label="Previous status"
        />
        <button
          onClick={goNext}
          onMouseDown={pause}
          onMouseUp={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-default"
          aria-label="Next status"
        />

        {status.type === "text" && (
          <div className="flex h-full w-full max-w-md items-center justify-center bg-linear-to-br from-[#25d366] to-[#006d2f] p-8 text-center text-2xl font-semibold text-white">
            {status.content}
          </div>
        )}

        {status.type === "image" && (
          <img src={status.content} alt="Status" className="max-h-full max-w-full object-contain" />
        )}

        {status.type === "video" && (
          <video
            ref={videoRef}
            src={status.content}
            autoPlay
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={goNext}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pb-5 pt-3">
        {isOwn ? (
          <>
            <button onClick={onShowViewers} className="flex items-center gap-1.5 text-sm font-medium text-white/90">
              <Eye className="h-4 w-4" />
              {status.viewers.length} view{status.viewers.length === 1 ? "" : "s"}
            </button>
            <button
              onClick={() => {
                if (window.confirm("Delete this status?")) {
                  onDeleteStatus(status.id);
                }
              }}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
              aria-label="Delete status"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onToggleLike(status.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                liked ? "text-[#25d366]" : "text-white/80 hover:bg-white/10"
              }`}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
            </button>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  onFocus={pause}
                  onBlur={resume}
                  placeholder={replySent ? "Sent!" : "Reply..."}
                  disabled={isSendingReply}
                  className="w-full bg-transparent text-sm text-white placeholder-white/60 outline-none disabled:opacity-60"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSendingReply}
                  aria-label="Send reply"
                  className="shrink-0 disabled:opacity-40"
                >
                  <Send className="h-4 w-4 text-white/70" />
                </button>
              </div>
              {replyError && <p className="px-2 text-xs text-red-300">{replyError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}