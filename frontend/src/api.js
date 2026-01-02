import axios from "axios";

const BASE =  "https://api.tastyaana.com";

export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Device APIs 
export const fetchDevices = () => api.get("/api/device");
export const registerDevice = (body) => api.post("/api/device/register", body);

// Schedule APIs
export const fetchSchedulesForDevice = (deviceId) => api.get(`/api/schedule/device/${deviceId}`);
export const createSchedule = (payload) => api.post("/api/schedule", payload);

// Logs APIs
export const fetchLogs = () => api.get("/api/medicine");
export const triggerManual = (payload) => api.post("/api/medicine/log", payload);
