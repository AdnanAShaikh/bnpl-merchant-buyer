const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = (
  endpoint: string,
  options: RequestInit = {}
) => {
  return fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
  });
};