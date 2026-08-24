import type { User as UserType } from "./user";

export interface FriendRequest {
  _id: string;
  sender: UserType;
  receiver: string;
  status: "pending" | "accepted" | "rejected";
}