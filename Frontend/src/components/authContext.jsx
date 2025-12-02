import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    user: null,
    role: null
  });

  const login = (userData) => {
    setAuth({
      isLoggedIn: true,
      user: userData,
      role: userData.role
    });
  };

  const logout = () => {
    setAuth({
      isLoggedIn: false,
      user: null,
      role: null
    });
  };

  const updateUser = (updatedFields) => {
    setAuth((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        ...updatedFields    
      }
    }));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
