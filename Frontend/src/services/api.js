const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const apiFetch = (path, options = {}) =>
  fetch(apiUrl(path), {
    credentials: "include",
    ...options,
  });

export default apiFetch;
