import api from "../../api/axios";

export interface ApiStatusViewer {
  userId: string;
  userName: string;
  userAvatar?: string;
  viewedAt: string;
}

export interface ApiStatusLike {
  userId: string;
  userName: string;
  userAvatar?: string;
  likedAt: string;
}

export interface ApiStatus {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: "text" | "image" | "video";
  content: string;
  mediaUrl: string;
  backgroundId: string | null;
  createdAt: string;
  expiresAt: string;
  viewers: ApiStatusViewer[];
  likes: ApiStatusLike[];
}

export const getActiveStatuses = async (): Promise<ApiStatus[]> => {
  const response = await api.get("/statuses");
  return response.data;
};

export const createTextStatus = async (content: string, backgroundId?: string): Promise<ApiStatus> => {
  const response = await api.post("/statuses", {
    type: "text",
    content,
    backgroundId,
  });
  return response.data;
};

export const createMediaStatus = async (
  type: "image" | "video",
  file: File
): Promise<ApiStatus> => {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("media", file);

  const response = await api.post("/statuses", formData);
  return response.data;
};

export const viewStatus = async (statusId: string): Promise<void> => {
  await api.post(`/statuses/${statusId}/view`);
};

export const getStatusViewers = async (statusId: string): Promise<ApiStatusViewer[]> => {
  const response = await api.get(`/statuses/${statusId}/viewers`);
  return response.data;
};

export const likeStatus = async (statusId: string): Promise<void> => {
  await api.post(`/statuses/${statusId}/like`);
};

export const unlikeStatus = async (statusId: string): Promise<void> => {
  await api.delete(`/statuses/${statusId}/like`);
};

export const getStatusLikes = async (statusId: string): Promise<ApiStatusLike[]> => {
  const response = await api.get(`/statuses/${statusId}/likes`);
  return response.data;
};

export const deleteStatus = async (statusId: string): Promise<void> => {
  await api.delete(`/statuses/${statusId}`);
};