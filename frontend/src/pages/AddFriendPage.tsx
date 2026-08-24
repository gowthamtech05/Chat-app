import { Check, Search, UserPlus, X } from "lucide-react";
import type { User as UserType } from "../types/user";
import type { FriendRequest } from "../types/friend";
import { getUserInitial } from "../utils/userDisplay";

interface AddFriendPageProps {
  friendRequests: FriendRequest[];
  friendSearchTerm: string;
  setFriendSearchTerm: (value: string) => void;
  searchResults: UserType[];
  isSearching: boolean;
  onUserClick: (user: UserType, requestId?: string | null) => void;
  onSendFriendRequest: (userId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
}

export default function AddFriendPage({
  friendRequests,
  friendSearchTerm,
  setFriendSearchTerm,
  searchResults,
  isSearching,
  onUserClick,
  onSendFriendRequest,
  onAcceptRequest,
  onRejectRequest,
}: AddFriendPageProps) {
  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto p-4">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-[#1e1b17]">Add Friend</h1>

      {/* SEARCH BAR */}
      <div className="relative mb-4 flex w-full items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#6c7b6b]" />
        <input
          type="text"
          placeholder="Search user by name or email"
          value={friendSearchTerm}
          onChange={(e) => setFriendSearchTerm(e.target.value)}
          className="w-full rounded-full border border-transparent bg-[#f4ede5] py-2 pl-10 pr-10 text-sm text-[#1e1b17] placeholder-[#6c7b6b] outline-none transition-all focus:border-[#25d366] focus:bg-white focus:ring-2 focus:ring-[#25d366]/20"
        />
        {friendSearchTerm && (
          <button
            onClick={() => setFriendSearchTerm("")}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#6c7b6b]/20 text-[#1e1b17] hover:bg-[#6c7b6b]/40"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* SEARCH RESULTS */}
      {isSearching ? (
        <div className="p-4 text-center text-xs text-[#6c7b6b]">Searching users...</div>
      ) : friendSearchTerm.trim() && searchResults.length === 0 ? (
        <div className="p-4 text-center text-xs text-[#6c7b6b]">No matching users found.</div>
      ) : searchResults.length > 0 ? (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">
            Search Results
          </h3>
          {searchResults.map((user) => (
            <div
              key={user._id}
              onClick={() => onUserClick(user)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#bbcbb9]/30 bg-[#faf2ea] p-3 transition-colors hover:bg-[#f4ede5]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e1d9] text-sm font-bold text-[#1e1b17]">
                  {getUserInitial(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#1e1b17]">{user.name}</h4>
                  <p className="truncate text-xs text-[#6c7b6b]">{user.email}</p>
                </div>

                <div className="ml-3">
                  {(!user.friendshipStatus || user.friendshipStatus === "none") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendFriendRequest(user._id);
                      }}
                      className="rounded-lg bg-[#25d366] px-3 py-1 text-xs font-semibold text-[#005523] transition-colors hover:bg-[#20bd5c]"
                    >
                      Add Friend
                    </button>
                  )}

                  {user.friendshipStatus === "pending_sent" && (
                    <button
                      disabled
                      className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 cursor-not-allowed"
                    >
                      Requested
                    </button>
                  )}

                  {user.friendshipStatus === "pending_received" && user.requestId && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptRequest(user.requestId!);
                        }}
                        className="rounded-lg bg-green-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-600"
                      >
                        Accept
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectRequest(user.requestId!);
                        }}
                        className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {user.friendshipStatus === "friends" && (
                    <button
                      disabled
                      className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-700 cursor-not-allowed"
                    >
                      Friends
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {friendRequests.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">
            Friend Requests ({friendRequests.length})
          </h3>
          {friendRequests.map((req) => (
            <div
              key={req._id}
              className="flex flex-col gap-2 rounded-xl border border-[#bbcbb9]/30 bg-[#faf2ea] p-3"
            >
              <div
                onClick={() => req.sender && onUserClick(req.sender, req._id)}
                className="flex cursor-pointer min-w-0 items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006d2f] text-sm font-bold text-white">
                  {getUserInitial(req.sender?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-[#1e1b17]">
                    {req.sender?.name || "Unknown User"}
                  </h4>
                  <p className="truncate text-xs text-[#6c7b6b]">{req.sender?.email || ""}</p>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => onAcceptRequest(req._id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25d366] py-1.5 text-xs font-semibold text-[#005523] transition-colors hover:bg-[#20bd5c]"
                >
                  <Check className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => onRejectRequest(req._id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#f4ede5] py-1.5 text-xs font-semibold text-[#3c4a3d] transition-colors hover:bg-[#eee7df]"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!friendSearchTerm.trim() && friendRequests.length === 0 && (
        <div className="my-8 flex flex-1 flex-col items-center justify-center text-center text-sm text-[#6c7b6b]">
          <UserPlus className="mb-2 h-10 w-10 text-[#25d366] opacity-80" />
          <p className="font-semibold text-[#1e1b17]">Find new contacts</p>
          <p className="mt-1 text-xs text-[#6c7b6b]">
            Search for users by name or email to send them a friend request.
          </p>
        </div>
      )}
    </div>
  );
}