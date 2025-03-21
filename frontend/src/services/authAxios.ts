import axios from "axios";

const authAxios = axios.create({
    baseURL: "https://adfreenews.pythonanywhere.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// interceptor to attach token to every request
authAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default authAxios;
