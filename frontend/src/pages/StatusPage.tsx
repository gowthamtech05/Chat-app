import { useState } from "react";
import { AlertCircle, CircleDashed, Sparkles } from "lucide-react";
import type { Status, StatusGroup, StatusType } from "../types/status";
import type { User as UserType } from "../types/user";
import MyStatus from "../components/status/MyStatus";
import StatusItem from "../components/status/StatusItem";
import StatusComposer from "../components/status/StatusComposer";
import StatusViewer from "../components/status/StatusViewer";
import StatusViewersList from "../components/status/StatusViewersList";

interface ViewerState {
  userId: string;
  startIndex: number;
}

interface StatusPageProps {
  currentUser: UserType | null | undefined;
  myStatuses: Status[];
  recentGroups: StatusGroup[];
  viewedGroups: StatusGroup[];
  isLoading: boolean;
  error: string | null;
  postStatus: (type: StatusType, content: string | File, backgroundId?: string) => Promise<void> | void;
  viewStatus: (statusId: string) => void;
  toggleLike: (statusId: string) => void;
  deleteStatus: (statusId: string) => void;
}


export default function StatusPage({
  currentUser,
  myStatuses,
  recentGroups,
  viewedGroups,
  isLoading,
  error,
  postStatus,
  viewStatus,
  toggleLike,
  deleteStatus,
}: StatusPageProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerState, setViewerState] = useState<ViewerState | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [viewersListStatusId, setViewersListStatusId] = useState<string | null>(null);

  const myGroup: StatusGroup | null =
    currentUser && myStatuses.length > 0
      ? {
          userId: currentUser._id,
          userName: currentUser.name || "Me",
          statuses: myStatuses,
          hasUnviewed: false,
          latestAt: myStatuses[myStatuses.length - 1].createdAt,
        }
      : null;


  const allGroups = myGroup ? [myGroup, ...recentGroups, ...viewedGroups] : [...recentGroups, ...viewedGroups];
  const liveGroup = viewerState ? allGroups.find((g) => g.userId === viewerState.userId) || null : null;
  const viewersListStatus =
    viewersListStatusId && liveGroup
      ? liveGroup.statuses.find((s) => s.id === viewersListStatusId) || null
      : null;

  const openGroup = (group: StatusGroup) => {
    const firstUnviewed = group.statuses.findIndex(
      (s) => !currentUser || !s.viewers.some((v) => v.userId === currentUser._id)
    );
    setViewerState({ userId: group.userId, startIndex: firstUnviewed >= 0 ? firstUnviewed : 0 });
  };

  const closeViewer = () => {
    setViewerState(null);
    setActiveStatusId(null);
  };

  const hasAnyContactStatus = recentGroups.length > 0 || viewedGroups.length > 0;

  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto">
      <div className="px-4 pb-3 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#1e1b17]">Status</h1>
      </div>

      {error && (
        <div className="mx-2 mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-40 flex-col items-center justify-center text-xs text-[#6c7b6b]">
          <CircleDashed className="mb-2 h-6 w-6 animate-spin text-[#25d366]" />
          Loading statuses...
        </div>
      ) : (
        <>
          
          <div className="px-2 pb-2">
            <MyStatus
              currentUser={currentUser}
              myStatuses={myStatuses}
              onAdd={() => setComposerOpen(true)}
              onOpen={() => myGroup && openGroup(myGroup)}
            />
          </div>

          {!hasAnyContactStatus && myStatuses.length === 0 ? (
            <div className="my-auto flex flex-1 flex-col items-center justify-center p-8 text-center text-[#6c7b6b]">
              <Sparkles className="mb-3 h-10 w-10 text-[#25d366] opacity-80" />
              <p className="font-semibold text-[#1e1b17]">No status updates</p>
              <p className="mt-1 text-xs text-[#6c7b6b]">
                Status updates from your contacts will appear here.
              </p>
            </div>
          ) : (
            <>
              {recentGroups.length > 0 && (
                <div className="px-2 pb-2 pt-2">
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">
                    Recent Updates
                  </h3>
                  <div className="space-y-0.5">
                    {recentGroups.map((group) => (
                      <StatusItem key={group.userId} group={group} onClick={() => openGroup(group)} />
                    ))}
                  </div>
                </div>
              )}

              {viewedGroups.length > 0 && (
                <div className="px-2 pb-4 pt-2">
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-[#6c7b6b]">
                    Viewed Updates
                  </h3>
                  <div className="space-y-0.5">
                    {viewedGroups.map((group) => (
                      <StatusItem key={group.userId} group={group} onClick={() => openGroup(group)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {composerOpen && (
        <StatusComposer
          onPost={async (type, content, backgroundId) => {
            await postStatus(type, content, backgroundId);
            setComposerOpen(false);
          }}
          onClose={() => setComposerOpen(false)}
        />
      )}

      {liveGroup && viewerState && (
        <StatusViewer
          group={liveGroup}
          startIndex={viewerState.startIndex}
          currentUserId={currentUser?._id}
          onClose={closeViewer}
          onView={viewStatus}
          onToggleLike={toggleLike}
          onActiveStatusChange={setActiveStatusId}
          onShowViewers={() => {
            if (activeStatusId) setViewersListStatusId(activeStatusId);
          }}
          onDeleteStatus={deleteStatus}
          forcePaused={Boolean(viewersListStatusId)}
        />
      )}

      {viewersListStatus && (
        <StatusViewersList status={viewersListStatus} onClose={() => setViewersListStatusId(null)} />
      )}
    </div>
  );
}