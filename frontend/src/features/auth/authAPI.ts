import api from "../../api/axios";

export const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data.user;
};