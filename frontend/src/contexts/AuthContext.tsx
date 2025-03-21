import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { toast } from "sonner";
import authAxios from "@/services/AuthAxios";

// types
interface User {
    id: string;
    name: string;
    email: string;
    username: string;
}

interface AuthContextType {
    currentUser: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

//initial AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//props for AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token") || null,
    );
    const [loading, setLoading] = useState<boolean>(true);

    //logout (memoized)
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        toast.success("Logged out successfully");
    }, []);

    // login (memoized)
    const login = useCallback((newToken: string) => {
        if (!newToken) {
            toast.error("Invalid token received");
            return;
        }
        localStorage.setItem("token", newToken);
        setToken(newToken);
        toast.success("Logged in successfully");
    }, []);

    //fetch user-data func
    const fetchUserData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await authAxios.get("/auth/u");

            if (response.status === 200) {
                setUser(response.data);
            }
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 401) {
                    toast.error("Session expired. Please login again.");
                    logout();
                } else if (error.response.status === 404) {
                    toast.error("User not found.");
                    logout();
                } else {
                    toast.error(
                        `Failed to fetch user data (${error.response.status})`,
                    );
                    logout();
                }
            } else {
                toast.error("Network error. Please check your connection.");
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    //fetch user data when the token changes
    useEffect(() => {
        let isSubscribed = true;

        const initializeAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                await fetchUserData();
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            isSubscribed = false;
        };
    }, [token, fetchUserData]);

    //function to manually refresh user data
    const refreshUser = useCallback(async () => {
        if (!token) return;
        await fetchUserData();
    }, [token, fetchUserData]);

    const contextValue: AuthContextType = {
        currentUser,
        token,
        loading,
        login,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

//hook for using Auth Context
const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Type-safe authentication check function
export const isAuthenticated = (
    user: User | null,
    token: string | null,
): boolean => {
    return !!user && !!token;
};

export default AuthProvider;
export { useAuth };
