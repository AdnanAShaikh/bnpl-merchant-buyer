const API_URL = import.meta.env.VITE_API_URL;

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = (): Promise<boolean> => {
  // collapse concurrent refreshes into one in-flight request
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh/bnplToken`, {
      method: "GET",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<Response> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
  });

  const isAuthCall =
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/logout");

  // access token expired → refresh once → retry the original call
  if (res.status === 401 && !isRetry && !isAuthCall) {
    const ok = await refreshAccessToken();
    if (ok) {
      return apiFetch(endpoint, options, true);
    }
  }

  return res;
};
