const BASE_URL = "https://fsd-project-backend-2bms.onrender.com";

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