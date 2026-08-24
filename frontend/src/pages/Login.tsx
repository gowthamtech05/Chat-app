import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import type { AppDispatch } from "../app/store";
import { setUser } from "../features/auth/authSlice";
import api from "../api/axios";

function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const userData = response.data?.user || response.data?.data?.user;

      if (userData) {
        dispatch(setUser(userData));
      }

      navigate("/chat", { replace: true });
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] text-[#1e1b17] flex items-center justify-center p-4 antialiased selection:bg-[#25d366] selection:text-[#005523]">
      <main className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[#bbcbb9] p-8 sm:p-12 relative overflow-hidden group">
  
        <div className="absolute top-0 left-0 w-full h-1 bg-[#25d366]"></div>

        <header className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#25d366] rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <svg
              className="w-8 h-8 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#1e1b17] mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-[#3c4a3d] text-center">
            Log in to reconnect with your network.
          </p>
        </header>


        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {errorMessage}
          </div>
        )}

  
        <form onSubmit={handleLogin} className="space-y-6">

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-[#1e1b17] block tracking-wide"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3c4a3d]">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#fff8f1] border border-[#bbcbb9] rounded-lg text-sm text-[#1e1b17] placeholder-[#3c4a3d]/60 focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:border-transparent transition-shadow duration-200 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-[#1e1b17] block tracking-wide"
              >
                Password
              </label>
              <a
                href="#"
                className="text-xs font-semibold text-[#006d2f] hover:text-[#25d366] transition-colors duration-200"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3c4a3d]">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3 3.1-3 1.71 0 3.1 1.29 3.1 3v2z" />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#fff8f1] border border-[#bbcbb9] rounded-lg text-sm text-[#1e1b17] placeholder-[#3c4a3d]/60 focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:border-transparent transition-shadow duration-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#3c4a3d] hover:text-[#1e1b17] transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.17c0-1.66-1.34-3-3-3l-.17.02z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#25d366] text-[#005523] rounded-lg font-semibold text-sm flex flex-row justify-center items-center gap-2 hover:bg-[#20bd5a] transition-colors duration-200 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25d366] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Logging in..." : "Log In"}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#3c4a3d]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#006d2f] hover:underline hover:text-[#25d366] transition-colors duration-200 ml-1"
            >
              Register here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;