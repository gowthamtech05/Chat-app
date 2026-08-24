import type { Status, StatusType } from "../types/status";
import * as statusApi from "../features/status/statusApi";
import type { ApiStatus } from "../features/status/statusApi";


function toFrontendStatus(apiStatus: ApiStatus): Status {
  return {
    id: apiStatus.id,
    userId: apiStatus.userId,
    userName: apiStatus.userName,
    type: apiStatus.type,
    content: apiStatus.type === "text" ? apiStatus.content : apiStatus.mediaUrl,
    backgroundId: apiStatus.backgroundId ?? undefined,
    createdAt: apiStatus.createdAt,
    expiresAt: apiStatus.expiresAt,
    viewers: apiStatus.viewers.map((v) => ({
      userId: v.userId,
      userName: v.userName,
      viewedAt: v.viewedAt,
    })),
    likes: apiStatus.likes.map((l) => ({
      userId: l.userId,
      userName: l.userName,
      likedAt: l.likedAt,
    })),
  };
}

export async function fetchStatuses(): Promise<Status[]> {
  const apiStatuses = await statusApi.getActiveStatuses();
  return apiStatuses.map(toFrontendStatus);
}

export async function createStatus(
  type: StatusType,
  content: string | File,
  backgroundId?: string
): Promise<Status> {
  const created =
    type === "text"
      ? await statusApi.createTextStatus(content as string, backgroundId)
      : await statusApi.createMediaStatus(type, content as File);

  return toFrontendStatus(created);
}

export async function markStatusViewed(statusId: string): Promise<void> {
  await statusApi.viewStatus(statusId);
}

export async function likeStatus(statusId: string): Promise<void> {
  await statusApi.likeStatus(statusId);
}

export async function unlikeStatus(statusId: string): Promise<void> {
  await statusApi.unlikeStatus(statusId);
}

export async function deleteStatus(statusId: string): Promise<void> {
  await statusApi.deleteStatus(statusId);
}