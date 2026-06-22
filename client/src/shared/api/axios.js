import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api`,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isRefreshRequest = originalRequest?.url === "/auth/refresh";

        if (
            originalRequest &&
            !isRefreshRequest &&
            error.response?.status === 401 &&
            error.response?.data?.code === "ACCESS_TOKEN_EXPIRED" &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            isRefreshing = true;

            try {
                const response = await api.post("/auth/refresh");
                const newToken = response.data.token;

                localStorage.setItem("token", newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                if (
                    refreshError.response?.status === 401 ||
                    refreshError.response?.status === 403
                ) {
                    localStorage.removeItem("token");
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default api;
