import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./app/store";
import { setUser } from "./features/auth/authSlice";
import api from "./api/axios";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

const ProtectedRoute = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  return user ? <Navigate to="/chats" replace /> : <Outlet />;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        const userData =
          response.data?.user || response.data?.data?.user || response.data;
        if (userData) dispatch(setUser(userData));
      } catch (error) {
        console.log("Not logged in");
      } finally {
        setInitializing(false);
      }
    };
    initAuth();
  }, [dispatch]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#fff8f1] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#25d366] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/chats" replace />} />
        <Route path="/chats" element={<Chat />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/status" element={<Chat />} />
        <Route path="/channels" element={<Chat />} />
        <Route path="/add-friend" element={<Chat />} />
        <Route path="/settings" element={<Chat />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;