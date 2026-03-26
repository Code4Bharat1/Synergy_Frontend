import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ---------------- REFRESH MANAGEMENT ---------------- */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // We MUST check for 401 here, not 403.
    // 403 means "Forbidden" (you don't have the role permission).
    // 401 means "Unauthorized" (your token expired).
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        /* IMPORTANT: use base axios here */
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        localStorage.setItem("accessToken", data.accessToken);

        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
alert("Token refreshed")
console.log("Token refreshed");

        return axiosInstance(originalRequest);
      } catch (err) {
        alert("Session Expired. Please login again.");
        console.log(err);

        processQueue(err, null);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
