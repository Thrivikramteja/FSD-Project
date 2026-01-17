export const apiClient = async (url, options = {}, accessToken) => {
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
