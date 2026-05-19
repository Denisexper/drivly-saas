import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePermissionsStore } from "./permissionsStore";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      savedSASession: null,
      lastSlug: null,

      login: (token, user, slug) => {
        localStorage.setItem("token", token);
        if (slug) localStorage.setItem("lastSlug", slug);
        set({ token, user, lastSlug: slug ?? null });
      },

      logout: () => {
        const { token } = get();
        if (token) {
          fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        localStorage.removeItem("token");
        usePermissionsStore.getState().reset();
        set({ token: null, user: null, savedSASession: null });
      },

      impersonate: (token, user) => {
        const { token: currentToken, user: currentUser } = get();
        localStorage.setItem("token", token);
        usePermissionsStore.getState().reset();
        set({
          token,
          user,
          savedSASession: { token: currentToken, user: currentUser },
        });
      },

      exitImpersonation: () => {
        const { savedSASession } = get();
        if (!savedSASession) return;
        localStorage.setItem("token", savedSASession.token);
        usePermissionsStore.getState().reset();
        set({ token: savedSASession.token, user: savedSASession.user, savedSASession: null });
      },
    }),
    { name: "auth-storage" }
  )
);
