import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useContext(AuthContext);

  if (!auth.isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
