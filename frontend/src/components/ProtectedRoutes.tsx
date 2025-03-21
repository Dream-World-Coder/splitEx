import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = () => {
    const { currentUser, token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token) {
        return (
            <Navigate
                to="/login"
                state={{ from: location, message: "Please login first" }}
                replace
            />
        );
    }

    if (!currentUser) {
        return (
            <Navigate
                to="/login"
                state={{ from: location, message: "Unable to verify user" }}
                replace
            />
        );
    }

    return <Outlet />;
    // it renders the nested route components
};
