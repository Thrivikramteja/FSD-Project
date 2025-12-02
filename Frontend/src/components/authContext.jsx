import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const storedAuth = JSON.parse(localStorage.getItem("auth"));

  const [auth, setAuth] = useState(
    storedAuth || {
      isLoggedIn: false,
      user: null,
      role: null,
    }
  );

  const login = (userData) => {
    const authData = {
      isLoggedIn: true,
      user: userData,
      role: userData.role,
    };

    setAuth(authData);
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const logout = () => {
    setAuth({
      isLoggedIn: false,
      user: null,
      role: null,
    });

    localStorage.removeItem("auth");
  };

  const updateUser = (updatedFields) => {
    setAuth((prev) => {
      const updatedAuth = {
        ...prev,
        user: {
          ...prev.user,
          ...updatedFields,
        },
      };

      localStorage.setItem("auth", JSON.stringify(updatedAuth));
      return updatedAuth;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
