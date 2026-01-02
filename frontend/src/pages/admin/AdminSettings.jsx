import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Key,
  Users,
  Truck,
  DollarSign,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
} from "lucide-react";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    general: {
      siteName: "OnlineStore",
      siteDescription: "Premium food delivery service",
      timezone: "Asia/Kolkata",
      language: "en",
      currency: "INR",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      driverAssignments: true,
      lowStockAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: "medium",
      apiRateLimit: 100,
      loginAttempts: 5,
    },
    delivery: {
      defaultDeliveryFee: 50,
      freeDeliveryThreshold: 500,
      maxDeliveryRadius: 10,
      avgDeliveryTime: 30,
      rushHourMultiplier: 1.5,
    },
    payment: {
      acceptCOD: true,
      acceptOnline: true,
      processingFee: 2.5,
      refundPolicy: 7,
      autoRefund: false,
    },
    app: {
      maintenanceMode: false,
      appVersion: "2.1.0",
      forceUpdate: false,
      debugMode: false,
      analyticsEnabled: true,
    },
  });

  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "payment", label: "Payment", icon: DollarSign },
    { id: "app", label: "App Settings", icon: Smartphone },
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Error saving settings!");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "admin-settings.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const InputField = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    min,
    max,
    step,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  const ToggleField = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-sm text-gray-600">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  const SelectField = ({ label, value, onChange, options, description }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Site Name"
                value={settings.general.siteName}
                onChange={(value) =>
                  handleSettingChange("general", "siteName", value)
                }
                placeholder="Enter site name"
              />
              <SelectField
                label="Timezone"
                value={settings.general.timezone}
                onChange={(value) =>
                  handleSettingChange("general", "timezone", value)
                }
                options={[
                  { value: "Asia/Kolkata", label: "India (IST)" },
                  { value: "UTC", label: "UTC" },
                  { value: "America/New_York", label: "Eastern Time" },
                ]}
              />
              <InputField
                label="Site Description"
                value={settings.general.siteDescription}
                onChange={(value) =>
                  handleSettingChange("general", "siteDescription", value)
                }
                placeholder="Enter site description"
              />
              <SelectField
                label="Currency"
                value={settings.general.currency}
                onChange={(value) =>
                  handleSettingChange("general", "currency", value)
                }
                options={[
                  { value: "INR", label: "Indian Rupee (₹)" },
                  { value: "USD", label: "US Dollar ($)" },
                  { value: "EUR", label: "Euro (€)" },
                ]}
              />
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <ToggleField
              label="Email Notifications"
              value={settings.notifications.emailNotifications}
              onChange={(value) =>
                handleSettingChange(
                  "notifications",
                  "emailNotifications",
                  value
                )
              }
              description="Send email notifications for important events"
            />
            <ToggleField
              label="SMS Notifications"
              value={settings.notifications.smsNotifications}
              onChange={(value) =>
                handleSettingChange("notifications", "smsNotifications", value)
              }
              description="Send SMS updates to customers and drivers"
            />
            <ToggleField
              label="Push Notifications"
              value={settings.notifications.pushNotifications}
              onChange={(value) =>
                handleSettingChange("notifications", "pushNotifications", value)
              }
              description="Enable mobile app push notifications"
            />
            <ToggleField
              label="Order Updates"
              value={settings.notifications.orderUpdates}
              onChange={(value) =>
                handleSettingChange("notifications", "orderUpdates", value)
              }
              description="Notify customers about order status changes"
            />
            <ToggleField
              label="Driver Assignments"
              value={settings.notifications.driverAssignments}
              onChange={(value) =>
                handleSettingChange("notifications", "driverAssignments", value)
              }
              description="Notify drivers about new delivery assignments"
            />
            <ToggleField
              label="Low Stock Alerts"
              value={settings.notifications.lowStockAlerts}
              onChange={(value) =>
                handleSettingChange("notifications", "lowStockAlerts", value)
              }
              description="Alert sellers when inventory is running low"
            />
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <ToggleField
              label="Two-Factor Authentication"
              value={settings.security.twoFactorAuth}
              onChange={(value) =>
                handleSettingChange("security", "twoFactorAuth", value)
              }
              description="Require 2FA for admin accounts"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Session Timeout (minutes)"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(value) =>
                  handleSettingChange(
                    "security",
                    "sessionTimeout",
                    parseInt(value)
                  )
                }
                min="5"
                max="480"
              />
              <SelectField
                label="Password Policy"
                value={settings.security.passwordPolicy}
                onChange={(value) =>
                  handleSettingChange("security", "passwordPolicy", value)
                }
                options={[
                  { value: "low", label: "Low (6+ characters)" },
                  { value: "medium", label: "Medium (8+ chars, mixed case)" },
                  { value: "high", label: "High (12+ chars, symbols)" },
                ]}
              />
              <InputField
                label="API Rate Limit (per minute)"
                type="number"
                value={settings.security.apiRateLimit}
                onChange={(value) =>
                  handleSettingChange(
                    "security",
                    "apiRateLimit",
                    parseInt(value)
                  )
                }
                min="10"
                max="1000"
              />
              <InputField
                label="Max Login Attempts"
                type="number"
                value={settings.security.loginAttempts}
                onChange={(value) =>
                  handleSettingChange(
                    "security",
                    "loginAttempts",
                    parseInt(value)
                  )
                }
                min="3"
                max="10"
              />
            </div>
          </div>
        );

      case "delivery":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Default Delivery Fee (₹)"
                type="number"
                value={settings.delivery.defaultDeliveryFee}
                onChange={(value) =>
                  handleSettingChange(
                    "delivery",
                    "defaultDeliveryFee",
                    parseFloat(value)
                  )
                }
                min="0"
                step="0.01"
              />
              <InputField
                label="Free Delivery Threshold (₹)"
                type="number"
                value={settings.delivery.freeDeliveryThreshold}
                onChange={(value) =>
                  handleSettingChange(
                    "delivery",
                    "freeDeliveryThreshold",
                    parseFloat(value)
                  )
                }
                min="0"
                step="0.01"
              />
              <InputField
                label="Max Delivery Radius (km)"
                type="number"
                value={settings.delivery.maxDeliveryRadius}
                onChange={(value) =>
                  handleSettingChange(
                    "delivery",
                    "maxDeliveryRadius",
                    parseInt(value)
                  )
                }
                min="1"
                max="50"
              />
              <InputField
                label="Average Delivery Time (minutes)"
                type="number"
                value={settings.delivery.avgDeliveryTime}
                onChange={(value) =>
                  handleSettingChange(
                    "delivery",
                    "avgDeliveryTime",
                    parseInt(value)
                  )
                }
                min="10"
                max="120"
              />
              <InputField
                label="Rush Hour Multiplier"
                type="number"
                value={settings.delivery.rushHourMultiplier}
                onChange={(value) =>
                  handleSettingChange(
                    "delivery",
                    "rushHourMultiplier",
                    parseFloat(value)
                  )
                }
                min="1"
                max="3"
                step="0.1"
              />
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <ToggleField
                label="Accept Cash on Delivery"
                value={settings.payment.acceptCOD}
                onChange={(value) =>
                  handleSettingChange("payment", "acceptCOD", value)
                }
                description="Allow customers to pay with cash"
              />
              <ToggleField
                label="Accept Online Payments"
                value={settings.payment.acceptOnline}
                onChange={(value) =>
                  handleSettingChange("payment", "acceptOnline", value)
                }
                description="Accept credit/debit cards and digital payments"
              />
              <ToggleField
                label="Auto Refund"
                value={settings.payment.autoRefund}
                onChange={(value) =>
                  handleSettingChange("payment", "autoRefund", value)
                }
                description="Automatically process refunds for cancelled orders"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Processing Fee (%)"
                type="number"
                value={settings.payment.processingFee}
                onChange={(value) =>
                  handleSettingChange(
                    "payment",
                    "processingFee",
                    parseFloat(value)
                  )
                }
                min="0"
                max="10"
                step="0.1"
              />
              <InputField
                label="Refund Policy (days)"
                type="number"
                value={settings.payment.refundPolicy}
                onChange={(value) =>
                  handleSettingChange(
                    "payment",
                    "refundPolicy",
                    parseInt(value)
                  )
                }
                min="0"
                max="30"
              />
            </div>
          </div>
        );

      case "app":
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Maintenance Mode</span>
              </div>
              <ToggleField
                label="Enable Maintenance Mode"
                value={settings.app.maintenanceMode}
                onChange={(value) =>
                  handleSettingChange("app", "maintenanceMode", value)
                }
                description="Temporarily disable the app for maintenance"
              />
            </div>

            <div className="space-y-4">
              <ToggleField
                label="Force Update"
                value={settings.app.forceUpdate}
                onChange={(value) =>
                  handleSettingChange("app", "forceUpdate", value)
                }
                description="Force users to update to the latest app version"
              />
              <ToggleField
                label="Debug Mode"
                value={settings.app.debugMode}
                onChange={(value) =>
                  handleSettingChange("app", "debugMode", value)
                }
                description="Enable detailed logging and debug information"
              />
              <ToggleField
                label="Analytics Enabled"
                value={settings.app.analyticsEnabled}
                onChange={(value) =>
                  handleSettingChange("app", "analyticsEnabled", value)
                }
                description="Collect user behavior analytics"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="App Version"
                value={settings.app.appVersion}
                onChange={(value) =>
                  handleSettingChange("app", "appVersion", value)
                }
                placeholder="e.g., 2.1.0"
              />
            </div>
          </div>
        );

      default:
        return <div>Select a settings category</div>;
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Categories</h2>
            </div>
            <div className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((tab) => tab.id === activeTab)?.label} Settings
              </h2>
            </div>
            <div className="p-6">{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
