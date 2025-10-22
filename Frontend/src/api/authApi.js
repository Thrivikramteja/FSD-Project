export const checkSession = async () => {
  const res = await fetch("/api/check-session", {
    method: "GET",
    credentials: "include", 
  });
  const data = await res.json();
  return data; 
};
