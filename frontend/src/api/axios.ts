import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-app-gkzh.onrender.com/api",
  withCredentials: true,
});

export default api;