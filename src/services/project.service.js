  import axiosInstance from "../lib/axios";

/* ---------------- CREATE PROJECT ---------------- */
export const createProject = async (data) => {
    const res = await axiosInstance.post("/projects", data);
    return res.data;
};

/* ---------------- GET ALL PROJECTS ---------------- */
export const getAllProjects = async () => {
    const res = await axiosInstance.get("/projects");
    return res.data;
};

/* ---------------- GET PROJECT BY ID ---------------- */
export const getProjectById = async (id) => {
    const res = await axiosInstance.get(`/projects/${id}`);
    return res.data;
};

/* ---------------- UPDATE PROJECT ---------------- */
export const updateProject = async (id, data) => {
    const res = await axiosInstance.put(`/projects/${id}`, data);
    return res.data;
};

/* ---------------- DELETE PROJECT ---------------- */
export const deleteProject = async (id) => {
    const res = await axiosInstance.delete(`/projects/${id}`);
    return res.data;
};
