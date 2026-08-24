export type StatusType = "text" | "image" | "video";

export interface StatusViewRecord {
  userId: string;
  userName: string;
  viewedAt: string; 
}

export interface StatusLikeRecord {
  userId: string;
  userName: string;
  likedAt: string; 
}

export interface Status {
  id: string;
  userId: string;
  userName: string;
  type: StatusType;
  content: string;
  
  backgroundId?: string;
  createdAt: string; 
  expiresAt: string; 
  viewers: StatusViewRecord[];
  likes: StatusLikeRecord[];
}

export interface StatusGroup {
  userId: string;
  userName: string;
  statuses: Status[];
  hasUnviewed: boolean;
  latestAt: string;
}