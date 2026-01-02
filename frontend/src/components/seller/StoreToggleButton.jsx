import React, { useState, useEffect } from "react";
import { Button, message, Badge, Popover } from "antd";
import axios from "axios";
import { Power, Clock, Info } from "lucide-react";

const StoreStatusButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({
    reason: "",
    lastUpdated: "",
  });

  const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
  });

  // Add request interceptor to include token on each request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.authorization = `Bearer ${token}`; // lowercase for compatibility
    } else {
      console.warn('⚠️ No token found in localStorage for shop-status request');
    }
    return config;
  });

  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        // Optionally redirect to login
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    fetchStoreStatus();
  }, []);

  const fetchStoreStatus = async () => {
    try {
      const response = await api.get("/seller/shop-status");
      setStatus(response.data.data.status);
      setDetails({
        reason: response.data.data.reason,
        lastUpdated: new Date(response.data.data.lastUpdated).toLocaleString(),
      });
    } catch (error) {
      message.error("Failed to fetch store status");
    }
  };

  const handleToggle = async () => {
    const newStatus = status === "open" ? "closed" : "open";
    setLoading(true);
    try {
      await api.patch("/seller/toggle-shutdown", {
        isShutdown: newStatus === "closed",
        reason: newStatus === "closed" ? "Manual shutdown" : "Store reopened",
      });
      await fetchStoreStatus(); // Refresh status after change
      message.success(
        `Store ${newStatus === "open" ? "opened" : "closed"} successfully`
      );
    } catch (error) {
      message.error("Failed to update store status");
    } finally {
      setLoading(false);
    }
  };

  const statusContent = (
    <div className="space-y-2 p-2">
      <div className="flex items-center">
        <Info className="h-4 w-4 mr-2" />
        <span>Reason: {details.reason || "Not specified"}</span>
      </div>
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-2" />
        <span>Last updated: {details.lastUpdated || "Unknown"}</span>
      </div>
    </div>
  );

  if (status === null) return <Button loading>Loading...</Button>;

  return (
    <Popover
      content={statusContent}
      title="Store Status Details"
      trigger="click"
    >
      <Button
        type={status === "open" ? "primary" : "default"}
        danger={status === "closed"}
        onClick={handleToggle}
        loading={loading}
        icon={<Power size={16} />}
        className="flex items-center"
      >
        <Badge
          status={status === "open" ? "success" : "error"}
          className="mr-2"
        />
        {status === "open" ? "Store Open" : "Store Closed"}
      </Button>
    </Popover>
  );
};

export default StoreStatusButton;
