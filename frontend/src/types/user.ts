export interface User {
  _id: string;
  name: string;
  email: string;

  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
  friends?: (string | User)[];

  friendshipStatus?:
    | "none"
    | "pending_sent"
    | "pending_received"
    | "friends";

  requestId?: string | null;
}