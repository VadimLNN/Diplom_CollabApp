import { jwtDecode } from "jwt-decode";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import api from "../../shared/api/axios";
import { AuthContext } from "./authContext";

const getStoredToken = () => {
    try {
        return localStorage.getItem("token");
    } catch {
        return null;
    }
};

const isAccessTokenFresh = (token) => {
    if (!token) {
        return false;
    }

    try {
        const decoded = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

const isRejectedSessionError = (error) => {
    const status = error.response?.status;
    return status === 401 || status === 403 || status === 404;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(getStoredToken);
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState("checking");
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            const storedToken = getStoredToken();
            let accessToken = storedToken;

            try {
                if (!isAccessTokenFresh(accessToken)) {
                    const refreshResponse = await api.post("/auth/refresh");
                    accessToken = refreshResponse.data.token;
                    localStorage.setItem("token", accessToken);
                    setToken(accessToken);
                }

                const response = await api.get("/auth/user");
                setUser(response.data);
                setStatus("authenticated");
                setAuthError(null);
            } catch (error) {
                console.error("Auth initialization failed:", error);

                if (isRejectedSessionError(error)) {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                    setStatus("unauthenticated");
                    setAuthError(null);
                    return;
                }

                setStatus("unavailable");
                setAuthError(error);
            }
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
            setUser({ id: decodedUser.id, username: decodedUser.username });
            setStatus("authenticated");
            setAuthError(null);

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
            setStatus("unauthenticated");
            setAuthError(null);
        }
    }, []);

    const loading = status === "checking";

    const contextValue = useMemo(
        () => ({
            token,
            user,
            status,
            loading,
            authError,
            login,
            logout,
        }),
        [token, user, status, loading, authError, login, logout],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
