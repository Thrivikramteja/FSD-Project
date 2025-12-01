export const checkSession = async () => {
  const res = await fetch("http://localhost:3000/api/check-session")
  const data = await res.json();
  console.log(data);
  return data; 
};
