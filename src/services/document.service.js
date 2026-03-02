import axiosInstance from "../lib/axios";

/* ---------------- UPLOAD DOCUMENT ---------------- */
export const uploadDocument = async (data) => {
    const res = await axiosInstance.post("/documents", data);
    return res.data;
};

/* ---------------- GET ALL DOCUMENTS ---------------- */
export const getAllDocuments = async () => {
    const res = await axiosInstance.get("/documents");
    return res.data;
};

/* ---------------- GET DOCUMENT BY ID ---------------- */
export const getDocumentById = async (id) => {
    const res = await axiosInstance.get(`/documents/${id}`);
    return res.data;
};

/* ---------------- UPDATE DOCUMENT ---------------- */
export const updateDocument = async (id, data) => {
    const res = await axiosInstance.put(`/documents/${id}`, data);
    return res.data;
};

/* ---------------- DELETE DOCUMENT ---------------- */
export const deleteDocument = async (id) => {
    const res = await axiosInstance.delete(`/documents/${id}`);
    return res.data;
};
