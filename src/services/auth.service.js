import axiosInstance from "../lib/axios";

/* ---------------- LOGIN ---------------- */
export const loginUser = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);

  console.log(response);

  const { accessToken, user } = response.data;

  const minimalUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(minimalUser));

  return minimalUser;
};

/* ---------------- LOGOUT ---------------- */
export const logoutUser = async () => {
  await axiosInstance.post("/api/auth/logout");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};
