import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setAuth({
            user: data.user,
            role: data.role,
            loading: false,
          });
          
        } else {
          setAuth({
            user: null,
            role: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuth({
          user: null,
          role: null,
          loading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setAuth({
      user: userData.user,
      role: userData.role,
      loading: false,
    });
    localStorage.setItem("token", userData.token); 
    localStorage.setItem("role", userData.role);
  };

  const logout = async () => {
    await fetch(`https://fsd-project-backend-2bms.onrender.com/api/logout`, {
      method: "POST",
      credentials: "include"
    });

    setAuth({
      user: null,
      role: null,
      loading: false
    });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  const updateUser = (userUpdates) => {
    setAuth((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userUpdates } : prev.user,
    }));
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
