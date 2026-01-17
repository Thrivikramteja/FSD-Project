export const checkSession = async () => {
  const res = await fetch("http://localhost:3000/api/me", {
    credentials: "include",
  });

  console.log("in check")

  if (!res.ok) throw new Error("Not authenticated");

  return res.json();
};
