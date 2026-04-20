// This looks for VITE_API_URL in Render. If it's not there, it uses localhost.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const checkSession = async () => {
  const res = await fetch(`${BASE_URL}/api/me`, {
    credentials: "include",
  });

  console.log("Checking session at:", `${BASE_URL}/api/me`);

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
};