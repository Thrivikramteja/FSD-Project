import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../components/authContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useContext(AuthContext);

  if (auth.loading) {
    return <p>Loading...</p>;
  }

  console.log(auth.user);

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
