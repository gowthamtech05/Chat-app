import React, { useState } from "react";
import { X, UserPlus, Clock, UserCheck, Mail } from "lucide-react";
import type { User } from "../types/user";

export type ModalUser = User & {
  friendshipStatus?: string;
  requestId?: string | null;
};

interface UserProfileModalProps {
  user: ModalUser | null;
  currentUserId?: string;  
  requestId?: string | null;
  onClose: () => void;
  onAddFriend: (userId: string) => Promise<void>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string) => Promise<void>;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUserId,  
  requestId: propRequestId,
  onClose,
  onAddFriend,
  onAcceptRequest,
  onRejectRequest,
}) => {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitial = (name?: string) =>
    name ? name.charAt(0).toUpperCase() : "?";

  const activeRequestId = propRequestId || user.requestId;

  const friendshipStatus =
    currentUserId && user._id === currentUserId   
      ? "self"
      : (user.friendshipStatus as string) ||
        (activeRequestId ? "pending_received" : "none");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#bbcbb9]/30">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ede5] text-[#3c4a3d] hover:bg-[#eee7df]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#006d2f] text-2xl font-bold text-white shadow-md">
            {getUserInitial(user.name)}
          </div>

          <h2 className="text-xl font-bold text-[#1e1b17]">{user.name}</h2>
          <p className="flex items-center gap-1.5 text-xs text-[#6c7b6b] mt-1">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
          <div className="mt-6 w-full">
            {friendshipStatus === "self" ? (
              <div className="rounded-xl bg-[#f4ede5] py-2.5 text-xs font-semibold text-[#3c4a3d]">
                This is your account
              </div>
            ) : friendshipStatus === "friends" ? (
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366]/20 py-2.5 text-xs font-bold text-[#006d2f] cursor-not-allowed"
              >
                <UserCheck className="h-4 w-4" /> You both are friends
              </button>
            ) : friendshipStatus === "pending_sent" ? (
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4ede5] py-2.5 text-xs font-bold text-[#6c7b6b] cursor-not-allowed"
              >
                <Clock className="h-4 w-4" /> Requested
              </button>
            ) : friendshipStatus === "pending_received" && activeRequestId ? (
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={() =>
                    handleAction(() => onAcceptRequest(activeRequestId))
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] py-2.5 text-xs font-bold text-[#005523] hover:bg-[#20bd5c] transition-colors"
                >
                  Accept
                </button>
                <button
                  disabled={loading}
                  onClick={() =>
                    handleAction(() => onRejectRequest(activeRequestId))
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f4ede5] py-2.5 text-xs font-bold text-[#3c4a3d] hover:bg-[#eee7df] transition-colors"
                >
                  Reject
                </button>
              </div>
            ) : (
              <button
                disabled={loading}
                onClick={() => handleAction(() => onAddFriend(user._id))}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-2.5 text-xs font-bold text-[#005523] hover:bg-[#20bd5c] transition-colors shadow-sm"
              >
                <UserPlus className="h-4 w-4" /> Add Friend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;