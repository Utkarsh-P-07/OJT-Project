import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const detectDrift = (formData, threshold = 0.3, groupBy = "day") =>
  api.post(`/detect-drift?threshold=${threshold}&group_by=${groupBy}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getResults = (runId = null) =>
  api.get("/results", { params: runId ? { run_id: runId } : {} });

export const getHistory = (limit = 10) =>
  api.get("/history", { params: { limit } });

export const deleteRun = (runId) =>
  api.delete(`/runs/${runId}`);

export const getStats = () =>
  api.get("/stats");
