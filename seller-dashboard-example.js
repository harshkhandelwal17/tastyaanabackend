// Seller Dashboard - Cash Flow and Booking Management
// This file demonstrates the frontend structure for seller booking management

// ===== API Integration Examples =====

// 1. Create Offline Booking
const createOfflineBooking = async (bookingData) => {
  const response = await fetch('/api/seller/create-offline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      vehicleId: bookingData.vehicleId,
      customerDetails: {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.customerPhone
      },
      startDateTime: bookingData.startDateTime,
      endDateTime: bookingData.endDateTime,
      cashAmount: bookingData.cashAmount,
      onlineAmount: bookingData.onlineAmount,
      notes: bookingData.notes,
      zoneId: bookingData.zoneId
    })
  });
  
  return response.json();
};

// 2. Get Available Vehicles
const getAvailableVehicles = async (zoneId, startDateTime, endDateTime) => {
  const params = new URLSearchParams({
    zoneId,
    startDateTime,
    endDateTime
  });
  
  const response = await fetch(`/api/seller/vehicles/available?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return response.json();
};

// 3. Get Cash Flow Summary
const getCashFlowSummary = async (startDate, endDate, zoneId = '') => {
  const params = new URLSearchParams({ startDate, endDate });
  if (zoneId) params.append('zoneId', zoneId);
  
  const response = await fetch(`/api/seller/cash-flow/summary?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return response.json();
};

// ===== React Component Examples =====

// Seller Dashboard Main Component
const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [cashFlowData, setCashFlowData] = useState(null);
  const [selectedZone, setSelectedZone] = useState('all');
  
  useEffect(() => {
    loadCashFlowData();
  }, [selectedZone]);
  
  const loadCashFlowData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      
      const data = await getCashFlowSummary(
        startOfMonth, 
        today, 
        selectedZone === 'all' ? '' : selectedZone
      );
      setCashFlowData(data.summary);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    }
  };

  return (
    <div className="seller-dashboard">
      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'booking' ? 'active' : ''}
          onClick={() => setActiveTab('booking')}
        >
          Create Booking
        </button>
        <button 
          className={activeTab === 'cash-flow' ? 'active' : ''}
          onClick={() => setActiveTab('cash-flow')}
        >
          Cash Flow
        </button>
        <button 
          className={activeTab === 'bookings-list' ? 'active' : ''}
          onClick={() => setActiveTab('bookings-list')}
        >
          My Bookings
        </button>
      </div>

      {/* Zone Selection */}
      <div className="zone-selector">
        <select 
          value={selectedZone} 
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          <option value="all">All Zones</option>
          <option value="DT001">Downtown Zone</option>
          <option value="AP002">Airport Zone</option>
          {/* Add more zones dynamically */}
        </select>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewTab cashFlowData={cashFlowData} />}
        {activeTab === 'booking' && <CreateBookingTab selectedZone={selectedZone} />}
        {activeTab === 'cash-flow' && <CashFlowTab selectedZone={selectedZone} />}
        {activeTab === 'bookings-list' && <BookingsListTab selectedZone={selectedZone} />}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ cashFlowData }) => {
  if (!cashFlowData) return <div>Loading...</div>;

  return (
    <div className="overview-tab">
      <h2>Today's Overview</h2>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Bookings</h3>
          <div className="value">{cashFlowData.totalBookings}</div>
          <div className="breakdown">
            <span>Online: {cashFlowData.onlineBookings}</span>
            <span>Offline: {cashFlowData.offlineBookings}</span>
          </div>
        </div>
        
        <div className="card">
          <h3>Cash in Hand</h3>
          <div className="value">₹{cashFlowData.cashInHand}</div>
          <div className="breakdown">
            <span>Collected: ₹{cashFlowData.totalCashCollected}</span>
            <span>Pending: ₹{cashFlowData.pendingCash}</span>
          </div>
        </div>
        
        <div className="card">
          <h3>Total Revenue</h3>
          <div className="value">₹{cashFlowData.totalRevenue}</div>
          <div className="breakdown">
            <span>Cash: ₹{cashFlowData.totalCashCollected}</span>
            <span>Online: ₹{cashFlowData.totalOnlinePayments}</span>
          </div>
        </div>
        
        <div className="card">
          <h3>Handover Status</h3>
          <div className="value">₹{cashFlowData.cashHandedOver}</div>
          <div className="breakdown">
            <span>To Hand Over: ₹{cashFlowData.cashInHand}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="btn-primary">Create New Booking</button>
        <button className="btn-secondary">Mark Cash Handover</button>
        <button className="btn-secondary">View Full Report</button>
      </div>
    </div>
  );
};

// Create Booking Tab Component
const CreateBookingTab = ({ selectedZone }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleId: '',
    startDateTime: '',
    endDateTime: '',
    cashAmount: 0,
    onlineAmount: 0,
    notes: ''
  });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // When datetime changes, reload available vehicles
    if (field === 'startDateTime' || field === 'endDateTime') {
      if (formData.startDateTime && formData.endDateTime) {
        loadAvailableVehicles();
      }
    }
  };

  const loadAvailableVehicles = async () => {
    if (!formData.startDateTime || !formData.endDateTime || selectedZone === 'all') return;
    
    try {
      const response = await getAvailableVehicles(
        selectedZone, 
        formData.startDateTime, 
        formData.endDateTime
      );
      setAvailableVehicles(response.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await createOfflineBooking({
        ...formData,
        zoneId: selectedZone
      });
      
      if (response.success) {
        alert('Booking created successfully!');
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          vehicleId: '',
          startDateTime: '',
          endDateTime: '',
          cashAmount: 0,
          onlineAmount: 0,
          notes: ''
        });
        setAvailableVehicles([]);
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-booking-tab">
      <h2>Create Offline Booking</h2>
      
      <form onSubmit={handleCreateBooking} className="booking-form">
        {/* Customer Details */}
        <div className="form-section">
          <h3>Customer Details</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              required
            />
          </div>
          <input
            type="email"
            placeholder="Email (Optional)"
            value={formData.customerEmail}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
          />
        </div>

        {/* Booking Details */}
        <div className="form-section">
          <h3>Booking Details</h3>
          <div className="form-row">
            <input
              type="datetime-local"
              placeholder="Start Date & Time"
              value={formData.startDateTime}
              onChange={(e) => handleInputChange('startDateTime', e.target.value)}
              required
            />
            <input
              type="datetime-local"
              placeholder="End Date & Time"
              value={formData.endDateTime}
              onChange={(e) => handleInputChange('endDateTime', e.target.value)}
              required
            />
          </div>
          
          {/* Vehicle Selection */}
          {availableVehicles.length > 0 && (
            <select
              value={formData.vehicleId}
              onChange={(e) => handleInputChange('vehicleId', e.target.value)}
              required
            >
              <option value="">Select Vehicle</option>
              {availableVehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.name} - {vehicle.vehicleNo} ({vehicle.category})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Payment Details */}
        <div className="form-section">
          <h3>Payment Details</h3>
          <div className="form-row">
            <input
              type="number"
              placeholder="Cash Amount Received"
              value={formData.cashAmount}
              onChange={(e) => handleInputChange('cashAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Online Payment Amount"
              value={formData.onlineAmount}
              onChange={(e) => handleInputChange('onlineAmount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
          <textarea
            placeholder="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading || selectedZone === 'all'} className="btn-primary">
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

// Cash Flow Tab Component
const CashFlowTab = ({ selectedZone }) => {
  const [cashFlowData, setCashFlowData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadCashFlowData();
  }, [selectedZone, dateRange]);

  const loadCashFlowData = async () => {
    try {
      const response = await getCashFlowSummary(
        dateRange.startDate,
        dateRange.endDate,
        selectedZone === 'all' ? '' : selectedZone
      );
      setCashFlowData(response.summary);
    } catch (error) {
      console.error('Error loading cash flow:', error);
    }
  };

  const handleHandoverCash = async () => {
    // Implementation for marking cash as handed over
    const receiptNo = prompt('Enter handover receipt number:');
    if (!receiptNo) return;
    
    try {
      // Get list of booking IDs with pending cash
      // Call markCashHandover API
      alert('Cash handover marked successfully!');
      loadCashFlowData();
    } catch (error) {
      alert('Error marking cash handover');
    }
  };

  if (!cashFlowData) return <div>Loading...</div>;

  return (
    <div className="cash-flow-tab">
      <h2>Cash Flow Management</h2>
      
      {/* Date Range Selection */}
      <div className="date-range">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <span>to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>

      {/* Cash Flow Summary */}
      <div className="cash-flow-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <h4>Total Revenue</h4>
            <span className="amount">₹{cashFlowData.totalRevenue}</span>
          </div>
          <div className="summary-item">
            <h4>Cash Collected</h4>
            <span className="amount">₹{cashFlowData.totalCashCollected}</span>
          </div>
          <div className="summary-item">
            <h4>Online Payments</h4>
            <span className="amount">₹{cashFlowData.totalOnlinePayments}</span>
          </div>
          <div className="summary-item">
            <h4>Pending Collection</h4>
            <span className="amount pending">₹{cashFlowData.pendingCash}</span>
          </div>
          <div className="summary-item">
            <h4>Cash in Hand</h4>
            <span className="amount cash">₹{cashFlowData.cashInHand}</span>
          </div>
          <div className="summary-item">
            <h4>Handed Over</h4>
            <span className="amount">₹{cashFlowData.cashHandedOver}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="cash-actions">
        <button 
          className="btn-primary"
          onClick={handleHandoverCash}
          disabled={cashFlowData.cashInHand <= 0}
        >
          Mark Cash Handover (₹{cashFlowData.cashInHand})
        </button>
        <button className="btn-secondary">Download Report</button>
        <button className="btn-secondary">Daily Summary</button>
      </div>

      {/* Payment Breakdown Chart */}
      <div className="payment-breakdown">
        <h3>Payment Method Breakdown</h3>
        <div className="chart-container">
          {/* Add chart component here */}
          <div className="simple-chart">
            <div className="chart-bar">
              <div className="bar cash" style={{
                width: `${(cashFlowData.totalCashCollected / cashFlowData.totalRevenue) * 100}%`
              }}>
                Cash
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar online" style={{
                width: `${(cashFlowData.totalOnlinePayments / cashFlowData.totalRevenue) * 100}%`
              }}>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (to be added to your stylesheet)
const styles = `
.seller-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.dashboard-tabs button {
  padding: 10px 20px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 5px 5px 0 0;
}

.dashboard-tabs button.active {
  background: #007bff;
  color: white;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.card .value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.card .breakdown {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.booking-form {
  max-width: 600px;
}

.form-section {
  margin-bottom: 25px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.form-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-section input,
.form-section select,
.form-section textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.cash-flow-summary {
  margin: 20px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.summary-item {
  text-align: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.summary-item h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.amount {
  font-size: 20px;
  font-weight: bold;
}

.amount.pending {
  color: #dc3545;
}

.amount.cash {
  color: #28a745;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.simple-chart {
  margin-top: 10px;
}

.chart-bar {
  margin: 5px 0;
  height: 30px;
  background: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: white;
  font-weight: bold;
}

.bar.cash {
  background: #28a745;
}

.bar.online {
  background: #007bff;
}
`;

export { SellerDashboard, styles };