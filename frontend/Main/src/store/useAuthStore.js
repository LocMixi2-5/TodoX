import { create } from "zustand";
import api from "../lib/axios.js";
import { toast } from "sonner";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,

  checkAuth: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ authUser: res.data });
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await api.post("/auth/signup", data);
      toast.success("Account created successfully");
      set({ authUser: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await api.post("/auth/login", data);
      toast.success("Logged in successfully");
      set({ authUser: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Logged out successfully");
      set({ authUser: null });
    } catch (error) {
      toast.error(error.response?.data?.error || "Logout failed");
    }
  },
}));
