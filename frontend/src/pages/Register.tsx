import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      console.log(response.data);
      alert("Registration successful!");
      navigate("/login");
    } catch (error: any) {
      console.log(error);
      const serverMessage =
        error.response?.data?.message || "Registration failed";
      setErrorMessage(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex items-center justify-center p-4 font-sans text-[#1e1b17]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 flex flex-col p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#25d366] text-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">
                chat_bubble
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1e1b17] mb-2">
              Create Account
            </h1>
            <p className="text-sm text-[#3c4a3d]">Join our global community</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleRegister} className="flex flex-col gap-5 grow">
            <div>
              <label
                className="block text-xs font-semibold text-[#1e1b17] mb-2 uppercase tracking-wide"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#faf2ea] border border-emerald-200/60 rounded-lg px-4 py-3 text-sm text-[#1e1b17] focus:outline-none focus:ring-2 focus:ring-[#006d2f] focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-[#1e1b17] mb-2 uppercase tracking-wide"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#faf2ea] border border-emerald-200/60 rounded-lg px-4 py-3 text-sm text-[#1e1b17] focus:outline-none focus:ring-2 focus:ring-[#006d2f] focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-[#1e1b17] mb-2 uppercase tracking-wide"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#faf2ea] border border-emerald-200/60 rounded-lg px-4 py-3 text-sm text-[#1e1b17] focus:outline-none focus:ring-2 focus:ring-[#006d2f] focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-[#1e1b17] mb-2 uppercase tracking-wide"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#faf2ea] border border-emerald-200/60 rounded-lg px-4 py-3 text-sm text-[#1e1b17] focus:outline-none focus:ring-2 focus:ring-[#006d2f] focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#25d366] hover:bg-[#20bd5a] text-[#003816] font-semibold py-3 rounded-full transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-[#3c4a3d]">
              Already have an account?
              <Link
                to="/login"
                className="text-[#006d2f] hover:text-emerald-700 font-semibold ml-1 transition-colors"
              >
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;