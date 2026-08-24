import { useState } from "react";
import { X, UserPlus, Mail, Check, UserCheck } from "lucide-react";
import type { User as UserType } from "../types/user";

interface UserProfileModalProps {
  user: UserType | null;
  requestId?: string | null;
  onClose: () => void;
  onAddFriend?: (userId: string) => Promise<void> | void;
  onAcceptRequest?: (requestId: string) => Promise<void> | void;
  onRejectRequest?: (requestId: string) => Promise<void> | void;
}

export default function UserProfileModal({
  user,
  requestId,
  onClose,
  onAddFriend,
  onAcceptRequest,
  onRejectRequest,
}: UserProfileModalProps) {
  const [loadingAction, setLoadingAction] = useState<
    "add" | "accept" | "reject" | null
  >(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : "?";

  const handleAddFriendClick = async () => {
    if (!onAddFriend) return;

    setLoadingAction("add");
    setErrorMessage(null);

    try {
      await onAddFriend(user._id);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to send friend request";

      setErrorMessage(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAcceptClick = async () => {
    if (!requestId || !onAcceptRequest) return;

    setLoadingAction("accept");
    setErrorMessage(null);

    try {
      await onAcceptRequest(requestId);
      onClose();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to accept request";

      setErrorMessage(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectClick = async () => {
    if (!requestId || !onRejectRequest) return;

    setLoadingAction("reject");
    setErrorMessage(null);

    try {
      await onRejectRequest(requestId);
      onClose();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to reject request";

      setErrorMessage(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#bbcbb9]/40 bg-[#faf2ea] p-6 shadow-xl">

        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6c7b6b] transition hover:bg-[#eee7df] hover:text-[#1e1b17]"
        >
          <X className="h-5 w-5" />
        </button>

        
        <div className="flex flex-col items-center text-center">

          
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#006d2f] text-2xl font-bold text-white shadow-md">
            {initial}
          </div>

          <h3 className="text-xl font-bold text-[#1e1b17]">
            {user.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-[#6c7b6b]">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>

          {errorMessage && (
            <p className="mt-3 w-full rounded-lg bg-red-100 p-2 text-xs font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="mt-6 w-full">
            {user.friendshipStatus === "pending_received" && requestId ? (
              <div className="flex gap-2">

                <button
                  onClick={handleAcceptClick}
                  disabled={loadingAction !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25d366] py-2.5 text-sm font-semibold text-[#003816] shadow-sm transition hover:bg-[#20bd5c] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {loadingAction === "accept"
                    ? "Accepting..."
                    : "Accept"}
                </button>

                <button
                  onClick={handleRejectClick}
                  disabled={loadingAction !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#f4ede5] py-2.5 text-sm font-semibold text-[#3c4a3d] shadow-sm transition hover:bg-[#eee7df] disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  {loadingAction === "reject"
                    ? "Rejecting..."
                    : "Reject"}
                </button>

              </div>

            ) : user.friendshipStatus === "pending_sent" ? (

              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e2dacd] py-2.5 text-sm font-semibold text-[#6c7b6b] cursor-not-allowed opacity-80"
              >
                <UserCheck className="h-4 w-4" />
                Requested
              </button>

            ) : user.friendshipStatus === "friends" ? (

              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e2dacd] py-2.5 text-sm font-semibold text-[#6c7b6b] cursor-not-allowed opacity-80"
              >
                <UserCheck className="h-4 w-4" />
                Friends
              </button>

            ) : (

              <button
                onClick={handleAddFriendClick}
                disabled={loadingAction !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-2.5 text-sm font-semibold text-[#003816] shadow-sm transition hover:bg-[#20bd5c] disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {loadingAction === "add"
                  ? "Sending..."
                  : "Add Friend"}
              </button>

            )}

          </div>
        </div>
      </div>
    </div>
  );
}