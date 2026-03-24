import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const detectDrift = (formData, threshold = 0.3) =>
  api.post(`/detect-drift?threshold=${threshold}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getResults = () => api.get("/results");
