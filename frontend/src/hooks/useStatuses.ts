import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { Status, StatusGroup, StatusType } from "../types/status";
import * as statusStore from "../data/statusStore";

const POLL_INTERVAL_MS = 45 * 1000;

function isExpired(status: Status): boolean {
  return new Date(status.expiresAt).getTime() <= Date.now();
}

export function useStatuses() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await statusStore.fetchStatuses();
      setStatuses(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load statuses:", err);
      setError("Couldn't load statuses. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const activeStatuses = useMemo(() => statuses.filter((s) => !isExpired(s)), [statuses]);

  const myStatuses = useMemo(
    () => (currentUser ? activeStatuses.filter((s) => s.userId === currentUser._id) : []),
    [activeStatuses, currentUser]
  );

  const contactGroups = useMemo<StatusGroup[]>(() => {
    if (!currentUser) return [];

    const byUser = new Map<string, Status[]>();
    activeStatuses
      .filter((s) => s.userId !== currentUser._id)
      .forEach((s) => {
        const list = byUser.get(s.userId) || [];
        list.push(s);
        byUser.set(s.userId, list);
      });

    const groups = Array.from(byUser.entries()).map(([userId, userStatuses]) => {
      const sorted = [...userStatuses].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const hasUnviewed = sorted.some(
        (s) => !s.viewers.some((v) => v.userId === currentUser._id)
      );
      return {
        userId,
        userName: sorted[0].userName,
        statuses: sorted,
        hasUnviewed,
        latestAt: sorted[sorted.length - 1].createdAt,
      };
    });

    return groups.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  }, [activeStatuses, currentUser]);

  const recentGroups = useMemo(() => contactGroups.filter((g) => g.hasUnviewed), [contactGroups]);
  const viewedGroups = useMemo(() => contactGroups.filter((g) => !g.hasUnviewed), [contactGroups]);

  const postStatus = useCallback(
    async (type: StatusType, content: string | File, backgroundId?: string) => {
      const created = await statusStore.createStatus(type, content, backgroundId);
      setStatuses((prev) => [...prev, created]);
    },
    []
  );

  const viewStatus = useCallback(
    (statusId: string) => {
      if (!currentUser) return;

      setStatuses((prev) =>
        prev.map((s) => {
          if (s.id !== statusId) return s;
          if (s.viewers.some((v) => v.userId === currentUser._id)) return s;
          return {
            ...s,
            viewers: [
              ...s.viewers,
              {
                userId: currentUser._id,
                userName: currentUser.name || "Someone",
                viewedAt: new Date().toISOString(),
              },
            ],
          };
        })
      );

      statusStore.markStatusViewed(statusId).catch((err) => {
        console.error("Failed to record view:", err);
      });
    },
    [currentUser]
  );

  const toggleLike = useCallback(
    (statusId: string) => {
      if (!currentUser) return;

      const target = statuses.find((s) => s.id === statusId);
      const alreadyLiked = Boolean(
        target?.likes.some((l) => l.userId === currentUser._id)
      );

      setStatuses((prev) =>
        prev.map((s) => {
          if (s.id !== statusId) return s;
          return {
            ...s,
            likes: alreadyLiked
              ? s.likes.filter((l) => l.userId !== currentUser._id)
              : [
                  ...s.likes,
                  {
                    userId: currentUser._id,
                    userName: currentUser.name || "Someone",
                    likedAt: new Date().toISOString(),
                  },
                ],
          };
        })
      );

      const request = alreadyLiked
        ? statusStore.unlikeStatus(statusId)
        : statusStore.likeStatus(statusId);

      request.catch((err) => {
        console.error("Failed to update like:", err);
        refresh();
      });
    },
    [currentUser, statuses, refresh]
  );

  const deleteStatus = useCallback(
    (statusId: string) => {
      const previous = statuses;
      setStatuses((prev) => prev.filter((s) => s.id !== statusId));

      statusStore.deleteStatus(statusId).catch((err) => {
        console.error("Failed to delete status:", err);
        setError("Couldn't delete your status. Please try again.");
        setStatuses(previous);
      });
    },
    [statuses]
  );

  return {
    currentUser,
    myStatuses,
    recentGroups,
    viewedGroups,
    isLoading,
    error,
    postStatus,
    viewStatus,
    toggleLike,
    deleteStatus,
  };
}