const BASE_URL = "https://fsd-project-backend-2bms.onrender.com";

export const apiClient = async (path, options = {}, accessToken) => {
  // This combines the BASE_URL with the path you want to call
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
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