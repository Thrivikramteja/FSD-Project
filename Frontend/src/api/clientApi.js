import { apiFetch } from "../services/api";

export const apiClient = async (path, options = {}, accessToken) => {
  const res = await apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "include"
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  return res.json();
};