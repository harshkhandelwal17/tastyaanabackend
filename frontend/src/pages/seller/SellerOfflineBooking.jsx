import React, { useState, useEffect } from "react";
import { vehicleRentalAPI } from "../../services/vehicleRentalApi";
import { getSellerZones } from "../../api/sellerVehicleApi";
import "./SellerOfflineBooking.css";

const SellerOfflineBooking = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [cashFlowData, setCashFlowData] = useState(null);
  const [selectedZone, setSelectedZone] = useState("all");
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "cash-flow") {
      loadCashFlowData();
    }
  }, [selectedZone, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load zones using seller vehicle API
      const zonesResponse = await getSellerZones();
      setZones(zonesResponse.data || []);

      // Load initial cash flow data
      loadCashFlowData();
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCashFlowData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      const response = await vehicleRentalAPI.getCashFlowSummary(
        startOfMonth,
        today,
        selectedZone === "all" ? null : selectedZone
      );
      setCashFlowData(response.data || {});
    } catch (error) {
      console.error("Error loading cash flow data:", error);
    }
  };

  const TabNavigation = () => (
    <div className="offline-booking-tabs">
      <button
        className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
        onClick={() => setActiveTab("overview")}
      >
        📊 Overview
      </button>
      <button
        className={`tab-btn ${activeTab === "create-booking" ? "active" : ""}`}
        onClick={() => setActiveTab("create-booking")}
      >
        ➕ Create Offline Booking
      </button>
      <button
        className={`tab-btn ${activeTab === "cash-flow" ? "active" : ""}`}
        onClick={() => setActiveTab("cash-flow")}
      >
        💰 Cash Flow
      </button>
    </div>
  );

  const ZoneSelector = () => (
    <div className="zone-selector">
      <label>Select Zone: </label>
      <select
        value={selectedZone}
        onChange={(e) => setSelectedZone(e.target.value)}
        className="zone-select"
      >
        <option value="all">All Zones</option>
        {zones.map((zone) => (
          <option key={zone.zoneCode} value={zone.zoneCode}>
            {zone.zoneName} ({zone.zoneCode})
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading offline booking management...</div>;
  }

  return (
    <div className="seller-offline-booking">
      <div className="page-header">
        <h1>🏪 Offline Booking Management</h1>
        <p>Create bookings for walk-in customers and manage cash flow</p>
      </div>

      <TabNavigation />
      <ZoneSelector />

      <div className="tab-content">
        {activeTab === "overview" && (
          <OverviewTab
            cashFlowData={cashFlowData}
            onRefresh={loadCashFlowData}
          />
        )}
        {activeTab === "create-booking" && (
          <CreateOfflineBookingTab
            selectedZone={selectedZone}
            zones={zones}
            onBookingCreated={loadCashFlowData}
          />
        )}
        {activeTab === "cash-flow" && (
          <CashFlowTab
            selectedZone={selectedZone}
            cashFlowData={cashFlowData}
            onRefresh={loadCashFlowData}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ cashFlowData, onRefresh }) => {
  if (!cashFlowData) return <div className="loading">Loading overview...</div>;

  return (
    <div className="overview-tab">
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Bookings Today</h3>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-value">{cashFlowData.totalBookings || 0}</div>
          <div className="stat-breakdown">
            <span className="online">
              Online: {cashFlowData.onlineBookings || 0}
            </span>
            <span className="offline">
              Offline: {cashFlowData.offlineBookings || 0}
            </span>
          </div>
        </div>

        <div className="stat-card cash">
          <div className="stat-header">
            <h3>Cash in Hand</h3>
            <span className="stat-icon">💵</span>
          </div>
          <div className="stat-value">
            ₹{(cashFlowData.cashInHand || 0).toLocaleString()}
          </div>
          <div className="stat-breakdown">
            <span className="collected">
              Collected: ₹
              {(cashFlowData.totalCashCollected || 0).toLocaleString()}
            </span>
            <span className="pending">
              Pending: ₹{(cashFlowData.pendingCash || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-header">
            <h3>Today's Revenue</h3>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value">
            ₹{(cashFlowData.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="stat-breakdown">
            <span className="cash-part">
              Cash: ₹{(cashFlowData.totalCashCollected || 0).toLocaleString()}
            </span>
            <span className="online-part">
              Online: ₹
              {(cashFlowData.totalOnlinePayments || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card handover">
          <div className="stat-header">
            <h3>Handover Status</h3>
            <span className="stat-icon">🏪</span>
          </div>
          <div className="stat-value">
            ₹{(cashFlowData.cashHandedOver || 0).toLocaleString()}
          </div>
          <div className="stat-breakdown">
            <span className="to-handover">
              To Hand Over: ₹{(cashFlowData.cashInHand || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button
          className="btn btn-primary"
          onClick={() => setActiveTab && setActiveTab("create-booking")}
        >
          📱 Create Walk-in Booking
        </button>
        <button className="btn btn-secondary" onClick={onRefresh}>
          🔄 Refresh Data
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab && setActiveTab("cash-flow")}
        >
          📊 View Cash Flow
        </button>
      </div>
    </div>
  );
};

// Create Offline Booking Tab Component
const CreateOfflineBookingTab = ({ selectedZone, zones, onBookingCreated }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    vehicleId: "",
    startDateTime: "",
    endDateTime: "",
    cashAmount: 0,
    onlineAmount: 0,
    notes: "",
  });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicleSearched, setVehicleSearched] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset vehicle selection when time changes
    if (field === "startDateTime" || field === "endDateTime") {
      setFormData((prev) => ({ ...prev, vehicleId: "" }));
      setAvailableVehicles([]);
      setVehicleSearched(false);
      setEstimatedCost(0);
    }
  };

  const calculateEstimatedCost = () => {
    if (!formData.startDateTime || !formData.endDateTime) return 0;

    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);
    const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));

    // Basic rate calculation (you can customize this)
    const hourlyRate = 150; // Example rate per hour
    return durationHours * hourlyRate;
  };

  useEffect(() => {
    const estimated = calculateEstimatedCost();
    setEstimatedCost(estimated);
  }, [formData.startDateTime, formData.endDateTime]);

  const searchAvailableVehicles = async () => {
    if (!formData.startDateTime || !formData.endDateTime) {
      alert("Please select start and end date/time first");
      return;
    }

    if (selectedZone === "all") {
      alert("Please select a specific zone first");
      return;
    }

    try {
      setLoading(true);
      const response = await vehicleRentalAPI.getAvailableVehiclesForBooking(
        formData.startDateTime,
        formData.endDateTime,
        selectedZone
      );
      setAvailableVehicles(response.data || []);
      setVehicleSearched(true);
    } catch (error) {
      console.error("Error searching vehicles:", error);
      alert("Error searching for available vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (selectedZone === "all") {
      alert("Please select a specific zone");
      return;
    }

    if (!formData.vehicleId) {
      alert("Please select a vehicle");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        vehicleId: formData.vehicleId,
        customerDetails: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail,
        },
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        cashAmount: formData.cashAmount,
        onlineAmount: formData.onlineAmount,
        notes: formData.notes,
        zoneId: selectedZone,
      };

      const response = await vehicleRentalAPI.createOfflineBooking(bookingData);

      if (response.success) {
        alert(
          `🎉 Booking created successfully!\n\nBooking ID: ${response.booking.bookingId}\nCustomer: ${formData.customerName}`
        );

        // Reset form
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          vehicleId: "",
          startDateTime: "",
          endDateTime: "",
          cashAmount: 0,
          onlineAmount: 0,
          notes: "",
        });
        setAvailableVehicles([]);
        setVehicleSearched(false);
        setEstimatedCost(0);

        if (onBookingCreated) onBookingCreated();
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("❌ Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-offline-booking-tab">
      <div className="booking-form-container">
        <h2>➕ Create Walk-in Customer Booking</h2>

        {selectedZone === "all" && (
          <div className="warning-message">
            ⚠️ Please select a specific zone to create bookings
          </div>
        )}

        <form onSubmit={handleCreateBooking} className="offline-booking-form">
          {/* Customer Details */}
          <div className="form-section">
            <h3>👤 Customer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  required
                  placeholder="Enter customer full name"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    handleInputChange("customerPhone", e.target.value)
                  }
                  required
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address (Optional)</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  handleInputChange("customerEmail", e.target.value)
                }
                placeholder="Enter email for booking confirmation"
                className="form-control"
              />
            </div>
          </div>

          {/* Booking Time Details */}
          <div className="form-section">
            <h3>📅 Rental Period</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.startDateTime}
                  onChange={(e) =>
                    handleInputChange("startDateTime", e.target.value)
                  }
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={(e) =>
                    handleInputChange("endDateTime", e.target.value)
                  }
                  required
                  min={formData.startDateTime}
                  className="form-control"
                />
              </div>
            </div>

            {estimatedCost > 0 && (
              <div className="cost-estimate">
                💡 Estimated Cost: ₹{estimatedCost.toLocaleString()}
              </div>
            )}

            <div className="vehicle-search">
              <button
                type="button"
                onClick={searchAvailableVehicles}
                disabled={
                  !formData.startDateTime ||
                  !formData.endDateTime ||
                  selectedZone === "all" ||
                  loading
                }
                className="btn btn-search"
              >
                {loading ? "🔍 Searching..." : "🔍 Find Available Vehicles"}
              </button>
            </div>

            {vehicleSearched && availableVehicles.length === 0 && (
              <div className="no-vehicles-message">
                ❌ No vehicles available for the selected time slot in this zone
              </div>
            )}

            {availableVehicles.length > 0 && (
              <div className="form-group">
                <label>
                  Select Vehicle * ({availableVehicles.length} available)
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) =>
                    handleInputChange("vehicleId", e.target.value)
                  }
                  required
                  className="form-control"
                >
                  <option value="">Choose a vehicle...</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      🚗 {vehicle.name} - {vehicle.vehicleNo} (
                      {vehicle.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Collection */}
          <div className="form-section">
            <h3>💳 Payment Collection</h3>
            <div className="payment-info">
              {estimatedCost > 0 && (
                <div className="estimated-total">
                  Total Amount: ₹{estimatedCost.toLocaleString()}
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>💵 Cash Received</label>
                <input
                  type="number"
                  value={formData.cashAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "cashAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="form-control cash-input"
                />
              </div>
              <div className="form-group">
                <label>📱 Online Payment</label>
                <input
                  type="number"
                  value={formData.onlineAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "onlineAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="form-control online-input"
                />
              </div>
            </div>

            {formData.cashAmount + formData.onlineAmount > 0 &&
              estimatedCost > 0 && (
                <div className="payment-summary">
                  <div className="payment-breakdown">
                    <span>
                      Paid: ₹
                      {(
                        formData.cashAmount + formData.onlineAmount
                      ).toLocaleString()}
                    </span>
                    <span>
                      Remaining: ₹
                      {Math.max(
                        0,
                        estimatedCost -
                          formData.cashAmount -
                          formData.onlineAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                  {formData.cashAmount + formData.onlineAmount >=
                    estimatedCost && (
                    <div className="payment-status complete">✅ Fully Paid</div>
                  )}
                  {formData.cashAmount + formData.onlineAmount <
                    estimatedCost &&
                    formData.cashAmount + formData.onlineAmount > 0 && (
                      <div className="payment-status partial">
                        ⚠️ Partial Payment
                      </div>
                    )}
                </div>
              )}

            <div className="form-group">
              <label>📝 Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows="3"
                placeholder="Any special instructions, damages, or notes..."
                className="form-control"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={
                loading || selectedZone === "all" || !formData.vehicleId
              }
              className="btn btn-primary submit-btn"
            >
              {loading ? "⏳ Creating Booking..." : "✅ Create Offline Booking"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({
                  customerName: "",
                  customerPhone: "",
                  customerEmail: "",
                  vehicleId: "",
                  startDateTime: "",
                  endDateTime: "",
                  cashAmount: 0,
                  onlineAmount: 0,
                  notes: "",
                });
                setAvailableVehicles([]);
                setVehicleSearched(false);
                setEstimatedCost(0);
              }}
              className="btn btn-secondary"
            >
              🔄 Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Cash Flow Tab Component
const CashFlowTab = ({ selectedZone, cashFlowData, onRefresh }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  if (!cashFlowData)
    return <div className="loading">Loading cash flow data...</div>;

  const handleHandoverCash = async () => {
    const receiptNo = prompt("Enter handover receipt number:");
    if (!receiptNo) return;

    try {
      // This would need to be implemented to get pending booking IDs
      alert(
        "Cash handover feature will be implemented with booking ID selection"
      );
    } catch (error) {
      alert("Error marking cash handover");
    }
  };

  return (
    <div className="cash-flow-tab">
      <h2>💰 Cash Flow Management</h2>

      {/* Date Range Selection */}
      <div className="date-range-selector">
        <div className="date-inputs">
          <div className="date-group">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
          <div className="date-group">
            <label>To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
          <button onClick={onRefresh} className="btn btn-primary">
            📊 Update Report
          </button>
        </div>
      </div>

      {/* Cash Flow Summary Grid */}
      <div className="cash-flow-grid">
        <div className="cash-flow-card total">
          <h4>💰 Total Revenue</h4>
          <div className="amount">
            ₹{(cashFlowData.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="trend">This period</div>
        </div>

        <div className="cash-flow-card cash">
          <h4>💵 Cash Collected</h4>
          <div className="amount">
            ₹{(cashFlowData.totalCashCollected || 0).toLocaleString()}
          </div>
          <div className="percentage">
            {cashFlowData.totalRevenue
              ? Math.round(
                  (cashFlowData.totalCashCollected /
                    cashFlowData.totalRevenue) *
                    100
                )
              : 0}
            % of total
          </div>
        </div>

        <div className="cash-flow-card online">
          <h4>📱 Online Payments</h4>
          <div className="amount">
            ₹{(cashFlowData.totalOnlinePayments || 0).toLocaleString()}
          </div>
          <div className="percentage">
            {cashFlowData.totalRevenue
              ? Math.round(
                  (cashFlowData.totalOnlinePayments /
                    cashFlowData.totalRevenue) *
                    100
                )
              : 0}
            % of total
          </div>
        </div>

        <div className="cash-flow-card pending">
          <h4>⏳ Pending Collection</h4>
          <div className="amount">
            ₹{(cashFlowData.pendingCash || 0).toLocaleString()}
          </div>
          <div className="status">To be collected</div>
        </div>

        <div className="cash-flow-card highlight">
          <h4>👋 Cash in Hand</h4>
          <div className="amount">
            ₹{(cashFlowData.cashInHand || 0).toLocaleString()}
          </div>
          <div className="status">Ready for handover</div>
        </div>

        <div className="cash-flow-card handed">
          <h4>🏪 Already Handed Over</h4>
          <div className="amount">
            ₹{(cashFlowData.cashHandedOver || 0).toLocaleString()}
          </div>
          <div className="status">Completed</div>
        </div>
      </div>

      {/* Payment Breakdown Chart */}
      <div className="payment-breakdown">
        <h3>Payment Method Distribution</h3>
        <div className="breakdown-chart">
          <div className="chart-container">
            <div className="chart-bar">
              <div className="bar-label">Cash Payments</div>
              <div className="bar-track">
                <div
                  className="bar-fill cash"
                  style={{
                    width: `${
                      cashFlowData.totalRevenue
                        ? (cashFlowData.totalCashCollected /
                            cashFlowData.totalRevenue) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="bar-value">
                {cashFlowData.totalRevenue
                  ? Math.round(
                      (cashFlowData.totalCashCollected /
                        cashFlowData.totalRevenue) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>

            <div className="chart-bar">
              <div className="bar-label">Online Payments</div>
              <div className="bar-track">
                <div
                  className="bar-fill online"
                  style={{
                    width: `${
                      cashFlowData.totalRevenue
                        ? (cashFlowData.totalOnlinePayments /
                            cashFlowData.totalRevenue) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="bar-value">
                {cashFlowData.totalRevenue
                  ? Math.round(
                      (cashFlowData.totalOnlinePayments /
                        cashFlowData.totalRevenue) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="cash-actions">
        <button
          className="btn btn-primary"
          disabled={!cashFlowData.cashInHand || cashFlowData.cashInHand <= 0}
          onClick={handleHandoverCash}
        >
          📤 Mark Cash Handover (₹
          {(cashFlowData.cashInHand || 0).toLocaleString()})
        </button>
        <button className="btn btn-secondary">📊 Download Report</button>
        <button className="btn btn-secondary">📅 Daily Summary</button>
        <button className="btn btn-secondary" onClick={onRefresh}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default SellerOfflineBooking;
