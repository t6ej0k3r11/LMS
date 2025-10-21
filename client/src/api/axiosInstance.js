import axios from "axios";

// Function to get the server port dynamically
const getServerPort = async () => {
  try {
    // Try to get port from environment variable first
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      const url = new URL(envUrl);
      return url.port || (url.protocol === "https:" ? "443" : "80");
    }

    // Fallback: try to discover port from server
    const response = await axios.get("http://localhost:5001/api/server-port", {
      timeout: 2000,
    });
    return response.data.port.toString();
  } catch {
    // Final fallback to default ports
    return "5001";
  }
};

// Create axios instance with dynamic base URL
const createAxiosInstance = async () => {
  const port = await getServerPort();
  return axios.create({
    baseURL: `http://localhost:${port}`,
  });
};

const axiosInstance = await createAxiosInstance();

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = JSON.parse(sessionStorage.getItem("accessToken")) || "";

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

export default axiosInstance;
