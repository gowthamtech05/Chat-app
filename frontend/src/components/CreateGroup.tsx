import { useEffect, useState } from "react";
import type { User } from "../types/user";
import {
  searchUsers,
} from "../features/user/userAPI";
import {
  createGroupChat,
} from "../features/chat/chatAPI";

interface CreateGroupProps {
  onCreated: () => void;
}

function CreateGroup({
  onCreated,
}: CreateGroupProps) {
  const [groupName, setGroupName] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [users, setUsers] =
    useState<User[]>([]);

  const [selectedUsers, setSelectedUsers] =
    useState<User[]>([]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      try {
        const data =
          await searchUsers(query);

        setUsers(data);
      } catch (error) {
        console.log(error);
      }
    };

    search();
  }, [query]);

  const toggleUser = (user: User) => {
    const exists =
      selectedUsers.some(
        (item) =>
          item._id === user._id
      );

    if (exists) {
      setSelectedUsers(
        selectedUsers.filter(
          (item) =>
            item._id !== user._id
        )
      );
    } else {
      setSelectedUsers([
        ...selectedUsers,
        user,
      ]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert("Enter group name");
      return;
    }

    if (selectedUsers.length < 1) {
      alert(
        "Select at least one user"
      );
      return;
    }

    try {
      await createGroupChat(
        groupName,
        selectedUsers.map(
          (user) => user._id
        )
      );

      setGroupName("");
      setQuery("");
      setSelectedUsers([]);

      onCreated();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h2>Create Group</h2>

      <input
        placeholder="Group name"
        value={groupName}
        onChange={(e) =>
          setGroupName(
            e.target.value
          )
        }
      />

      <input
        placeholder="Search users"
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
      />

      {users.map((user) => (
        <div
          key={user._id}
          onClick={() =>
            toggleUser(user)
          }
          style={{
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={selectedUsers.some(
              (item) =>
                item._id === user._id
            )}
            readOnly
          />

          {user.name}
        </div>
      ))}

      <h3>Selected Members</h3>

      {selectedUsers.map(
        (user) => (
          <p key={user._id}>
            {user.name}
          </p>
        )
      )}

      <button onClick={handleCreate}>
        Create Group
      </button>
    </div>
  );
}

export default CreateGroup;