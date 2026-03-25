import axiosInstance from "../lib/axios";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Expense Sheets ─────────────────────────────────────────────────────────────

export const createExpenseSheet = (data) =>
  axiosInstance.post("/expenses", data, { headers: authHeaders() });

export const getMyExpenseSheets = () =>
  axiosInstance.get("/expenses/my", { headers: authHeaders() });

export const getExpenseSheetById = (id) =>
  axiosInstance.get(`/expenses/${id}`, { headers: authHeaders() });

export const updateExpenseSheetHeader = (id, data) =>
  axiosInstance.patch(`/expenses/${id}/header`, data, { headers: authHeaders() });

export const submitExpenseSheet = (id) =>
  axiosInstance.patch(`/expenses/${id}/submit`, {}, { headers: authHeaders() });

// ── Line Items ─────────────────────────────────────────────────────────────────

export const addExpenseItem = (sheetId, item) =>
  axiosInstance.post(`/expenses/${sheetId}/items`, item, { headers: authHeaders() });

export const updateExpenseItem = (sheetId, itemId, data) =>
  axiosInstance.patch(`/expenses/${sheetId}/items/${itemId}`, data, { headers: authHeaders() });

export const deleteExpenseItem = (sheetId, itemId) =>
  axiosInstance.delete(`/expenses/${sheetId}/items/${itemId}`, { headers: authHeaders() });

// ── Hard-copy Attachments ──────────────────────────────────────────────────────

export const uploadHardcopy = (sheetId, files) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("hardcopy", f));
  return axiosInstance.post(`/expenses/${sheetId}/hardcopy`, fd, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
};

// ── Director / Admin ───────────────────────────────────────────────────────────

export const getAllExpenseSheets = (params = {}) =>
  axiosInstance.get("/expenses/all", { headers: authHeaders(), params });

export const getProjectExpenseSheets = (projectId, params = {}) =>
  axiosInstance.get(`/expenses/project/${projectId}`, { headers: authHeaders(), params });

export const approveExpenseSheet = (id, status, reviewNotes = "") =>
  axiosInstance.patch(
    `/expenses/${id}/approve`,
    { status, reviewNotes },
    { headers: authHeaders() }
  );

export const getExpenseBudgetSummary = (projectId) =>
  axiosInstance.get(`/expenses/project/${projectId}/summary`, { headers: authHeaders() });
