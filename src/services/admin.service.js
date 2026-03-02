import axiosInstance from "../lib/axios";

/* ---------------- CREATE USER ---------------- */
export const createUser = async (data) => {
  const res = await axiosInstance.post("/admin/users", data);
  return res.data;
};

/* ---------------- GET ALL USERS ---------------- */
export const getAllUsers = async () => {
  const res = await axiosInstance.get("/admin/users");
  return res.data;
};

/* ---------------- GET USER BY ID ---------------- */
export const getUserById = async (id) => {
  const res = await axiosInstance.get(`/admin/users/${id}`);
  return res.data;
};

/* ---------------- UPDATE USER ---------------- */
export const updateUser = async (id, data) => {
  const res = await axiosInstance.put(`/admin/users/${id}`, data);
  return res.data;
};

/* ---------------- DELETE USER ---------------- */
export const deleteUser = async (id) => {
  const res = await axiosInstance.delete(`/admin/users/${id}`);
  return res.data;
};
