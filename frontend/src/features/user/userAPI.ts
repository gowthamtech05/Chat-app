import api from "../../api/axios";
import type { User } from "../../types/user";

export const searchUsers = async (query: string): Promise<User[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const response = await api.get(
    `/users/search?query=${encodeURIComponent(trimmedQuery)}`
  );

  return response.data;
};