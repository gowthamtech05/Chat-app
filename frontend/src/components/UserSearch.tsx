import { useState } from "react";
import { searchUsers } from "../features/user/userAPI";
import type { User } from "../types/user";
import { createChat } from "../features/chat/chatAPI";

function UserSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const handleSearch = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setQuery(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      const data = await searchUsers(value);

      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleUserClick = async (userId: string) => {
    try {
      const chat = await createChat(userId);

      console.log("Chat:", chat);

      alert("Chat created");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={handleSearch}
      />

      <div>
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => handleUserClick(user._id)}
            style={{ cursor: "pointer" }}
          >
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserSearch;