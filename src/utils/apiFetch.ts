
import { store } from "../store/store";
import {
  logoutUser,
} from "../store/slices/authSlice";

export const apiFetch = async (
  url: string,
  options: RequestInit = {}
) => {

  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // ─────────────────────────────
  // ACCESS TOKEN EXPIRED
  // ─────────────────────────────

  if (res.status === 401) {

    const refreshRes = await fetch(
      "/api/auth/refresh/bnplToken",
      {
        method: "POST",
        credentials: "include",
      }
    );

    // refresh failed
    if (!refreshRes.ok) {

      store.dispatch(
        logoutUser()
      );

      window.location.href = "/";

      throw new Error(
        "Session expired"
      );
    }

    // retry original request
    res = await fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  return res;
};

