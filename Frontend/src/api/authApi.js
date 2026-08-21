import { apiFetch, apiUrl } from "../services/api";

export const checkSession = async () => {
  const res = await apiFetch("/api/me");

  console.log("Checking session at:", apiUrl("/api/me"));

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
};