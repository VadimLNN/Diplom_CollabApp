import { jwtDecode } from "jwt-decode";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import api from "../../shared/api/axios";

const AuthContext = createContext(null);

const getStoredToken = () => {
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
                return token;
            }
        }
        localStorage.removeItem("token");
        return null;
    } catch (error) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(getStoredToken);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            if (token) {
                try {
                    const response = await api.get("/auth/user");
                    setUser(response.data);
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    setToken(null);
                    localStorage.removeItem("token");
                }
            }
            setLoading(false);
        };
        initialize();
    }, []);

    const login = useCallback(async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            const newToken = response.data.token;

            const decodedUser = jwtDecode(newToken);

            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser({ id: decodedUser.id, username: decodedUser.username }); // Устанавливаем юзера из токена

            return true;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
        }
    }, []);

    const contextValue = useMemo(
        () => ({
            token,
            user,
            loading,
            login,
            logout,
        }),
        [token, user, loading, login, logout],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
