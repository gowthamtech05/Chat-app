import { useCallback, useEffect, useState } from "react";
import { searchUsers } from "../features/user/userAPI";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "../features/friend/friendAPI";
import type { User as UserType } from "../types/user";
import type { FriendRequest } from "../types/friend";

interface UseFriendRequestsOptions {
  onFriendAccepted?: () => void;
}


export function useFriendRequests({ onFriendAccepted }: UseFriendRequestsOptions = {}) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getFriendRequests();
      setFriendRequests(data || []);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const query = friendSearchTerm.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(query);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [friendSearchTerm]);

  const handleSendFriendRequest = useCallback(async (userId: string) => {
    try {
      await sendFriendRequest(userId);

      setSelectedUser((prev) =>
        prev && prev._id === userId ? { ...prev, friendshipStatus: "pending_sent" } : prev
      );

      setSearchResults((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, friendshipStatus: "pending_sent" } : user
        )
      );
    } catch (error) {
      console.error("Failed to send friend request:", error);
      throw error;
    }
  }, []);

  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      if (!requestId) return;

      try {
        await acceptFriendRequest(requestId);

        setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));

        setSearchResults((prev) =>
          prev.map((user) =>
            user.requestId === requestId
              ? { ...user, friendshipStatus: "friends", requestId: null }
              : user
          )
        );

        setSelectedUser(null);
        setSelectedRequestId(null);

       
        onFriendAccepted?.();
      } catch (error) {
        console.error("Failed to accept friend request:", error);
        throw error;
      }
    },
    [onFriendAccepted]
  );

  const handleRejectRequest = useCallback(async (requestId: string) => {
    if (!requestId) return;

    try {
      await rejectFriendRequest(requestId);

      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));

      setSearchResults((prev) =>
        prev.map((user) =>
          user.requestId === requestId
            ? { ...user, friendshipStatus: "none", requestId: null }
            : user
        )
      );

      setSelectedUser(null);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      throw error;
    }
  }, []);

  const handleUserSearchClick = useCallback((user: UserType, requestId?: string | null) => {
    setSelectedUser(user);
    setSelectedRequestId(requestId || user.requestId || null);
  }, []);

  return {
    friendRequests,
    friendSearchTerm,
    setFriendSearchTerm,
    searchResults,
    isSearching,
    selectedUser,
    setSelectedUser,
    selectedRequestId,
    setSelectedRequestId,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleUserSearchClick,
  };
}