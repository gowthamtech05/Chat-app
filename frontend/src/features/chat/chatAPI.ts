import api from "../../api/axios";
import type { Chat } from "../../types/chat";
import type { Message } from "../../types/message";

export const createChat = async (
  userId: string
) => {
  const response = await api.post("/chats", {
    userId,
  });

  return response.data;
};

export const getMyChats = async (): Promise<Chat[]> => {
  const response = await api.get("/chats");

  return response.data;
};

export const getChatById = async (chatId: string): Promise<Chat> => {
  const response = await api.get(`/chats/${chatId}`);
  return response.data;
};

export const getMessages = async (
  chatId: string
): Promise<Message[]> => {
  const response = await api.get(
    `/chats/${chatId}/messages`
  );

  return response.data;
};

export const sendMessage =
  async (
    chatId: string,
    text: string,
    image?: string | null,
    replyTo?: string
  ) => {
    const response =
      await api.post(
        "/chats/message",
        {
          chatId,
          text,
          image,
          replyTo,
        }
      );

    return response.data;
  };

export const markSeen = async (
  chatId: string
) => {
  await api.put(
    `/chats/${chatId}/seen`
  );
};

export const uploadImage =
  async (
    file: File
  ): Promise<string> => {
    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    const response =
      await api.post(
        "/chats/upload",
        formData
      );

    return response.data.imageUrl;
  };

  export const createGroupChat = async (
  groupName: string,
  members: string[]
): Promise<Chat> => {
  const response = await api.post(
    "/chats/group",
    {
      groupName,
      members,
    }
  );

  return response.data;
};