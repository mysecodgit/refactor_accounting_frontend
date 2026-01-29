import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3085/",
  // Add any other default configurations here, such as headers, etc.
});

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const authUser = JSON.parse(raw);
        const token = authUser?.accessToken;
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore localStorage parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
