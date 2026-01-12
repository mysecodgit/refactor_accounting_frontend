import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3085/",
  // Add any other default configurations here, such as headers, etc.
});

export default axiosInstance;
