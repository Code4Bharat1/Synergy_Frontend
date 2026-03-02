import axiosInstance from "../lib/axios";

/* ---------------- CREATE COMPLAINT ---------------- */
export const createComplaint = async (data) => {
    const res = await axiosInstance.post("/complaints", data);
    return res.data;
};

/* ---------------- GET ALL COMPLAINTS ---------------- */
export const getAllComplaints = async () => {
    const res = await axiosInstance.get("/complaints");
    return res.data;
};

/* ---------------- GET COMPLAINT BY ID ---------------- */
export const getComplaintById = async (id) => {
    const res = await axiosInstance.get(`/complaints/${id}`);
    return res.data;
};

/* ---------------- UPDATE COMPLAINT ---------------- */
export const updateComplaint = async (id, data) => {
    const res = await axiosInstance.put(`/complaints/${id}`, data);
    return res.data;
};

/* ---------------- DELETE COMPLAINT ---------------- */
export const deleteComplaint = async (id) => {
    const res = await axiosInstance.delete(`/complaints/${id}`);
    return res.data;
};
