import axiosInstance from "../lib/axios";

/* ---------------- PUNCH IN ---------------- */
export const punchIn = async (location, notes) => {
    const res = await axiosInstance.post("/attendance/punch-in", { location, notes });
    return res.data;
};

/* ---------------- PUNCH OUT ---------------- */
export const punchOut = async () => {
    const res = await axiosInstance.post("/attendance/punch-out");
    return res.data;
};

/* ---------------- GET MY ATTENDANCE ---------------- */
export const getMyAttendance = async () => {
    const res = await axiosInstance.get("/attendance/me");
    return res.data;
};

/* ---------------- GET ALL ATTENDANCE ---------------- */
export const getAllAttendance = async () => {
    const res = await axiosInstance.get("/attendance/all");
    return res.data;
};
