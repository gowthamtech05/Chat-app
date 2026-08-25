import axios from "axios";

const API_URL = "https://chat-app-gkzh.onrender.com/api/friends";

export const sendFriendRequest = async (userId: string) => {
  const response = await axios.post(
    `${API_URL}/request/${userId}`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const getFriendRequests = async () => {
  const response = await axios.get(`${API_URL}/requests`, {
    withCredentials: true,
  });

  return response.data;
};

export const acceptFriendRequest = async (requestId: string) => {
  const response = await axios.post(
    `${API_URL}/accept/${requestId}`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const rejectFriendRequest = async (requestId: string) => {
  const response = await axios.delete(
    `${API_URL}/reject/${requestId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};
