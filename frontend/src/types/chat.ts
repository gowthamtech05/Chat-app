import type { User } from "./user";

export interface Chat {
  _id: string;

  isGroupChat: boolean;

  groupName: string | null;

  groupAdmin: string | null;

  members: User[];

  lastMessage: {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
  } | null;

  unreadCounts: Record<
  string,
  number
>;

replyTo?: {
  _id: string;

  text: string;

  sender: {
    name: string;
  };
} | null;

  createdAt: string;
  updatedAt: string;
}