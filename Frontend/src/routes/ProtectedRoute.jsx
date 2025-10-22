import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkSession } from "../api/authApi";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    checkSession().then((data) => {
      if (!data.loggedIn) {
        setIsAllowed(false);
      } else if (allowedRoles && !allowedRoles.includes(data.role)) {
        setIsAllowed(false);
      } else {
        setIsAllowed(true);
      }
      setLoading(false);
    });
  }, [allowedRoles]);

  if (loading) return <div>Loading...</div>; 
  if (!isAllowed) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
