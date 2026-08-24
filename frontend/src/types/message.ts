import type { User } from "./user";

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  text: string;
  createdAt: string;
  updatedAt: string;
  image?: string;

  delivered?: boolean; 
  seen?: boolean;

  replyTo?: {
    _id: string;
    text?: string;
    image?: string;
    sender: {
      _id: string;
      name: string;
    };
  } | null;
}