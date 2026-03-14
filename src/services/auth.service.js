import axiosInstance from "../lib/axios";

/* ---------------- LOGIN ---------------- */
export const loginUser = async (data) => {
  const response = await axiosInstance.post("/auth/login", data);

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
  await axiosInstance.post("/auth/logout");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

/* ---------------- SWITCH ROLE ---------------- */
export const switchRole = async (role) => {
  const token = localStorage.getItem("accessToken");

  const response = await axiosInstance.post(
    "/auth/switch-role",
    { role },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ---------------- RESTORE ROLE ---------------- */
export const restoreRole = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await axiosInstance.post(
    "/auth/restore-role",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};