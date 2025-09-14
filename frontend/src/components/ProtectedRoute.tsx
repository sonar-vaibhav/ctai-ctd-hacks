import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/pages/Login";

type ProtectedRouteProps = {
  children: React.ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;


