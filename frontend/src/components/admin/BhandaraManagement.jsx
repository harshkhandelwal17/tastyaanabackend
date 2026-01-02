import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Clock, Users, Eye, Check, X, Search, Filter, Calendar, 
  Phone, Mail, AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  ChevronLeft, ChevronRight, Download, Utensils, User, MessageCircle,
  Trash, RotateCcw
} from 'lucide-react';
import {FaCheckCircle} from "react-icons/fa"
import { toast } from 'react-hot-toast';

const BhandaraManagement = () => {
  const [bhandaras, setBhandaras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBhandara, setSelectedBhandara] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });

  // Fetch Bhandaras
  const fetchBhandaras = async (status = selectedTab, page = 1) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pagination.limit;
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras?status=${status}&limit=${pagination.limit}&skip=${skip}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setBhandaras(result.data);
        setStats(result.stats);
        setPagination(prev => ({
          ...prev,
          total: result.total,
          hasMore: result.hasMore,
          current: page
        }));
      } else {
        toast.error(result.message || 'Failed to fetch Bhandaras');
      }
    } catch (error) {
      console.error('Error fetching Bhandaras:', error);
      toast.error('Failed to fetch Bhandaras');
    } finally {
      setLoading(false);
    }
  };

  // Approve Bhandara
  const approveBhandara = async (id, adminNote = '') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNote })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Bhandara approved successfully');
        fetchBhandaras();
        setShowModal(false);
      } else {
        toast.error(result.message || 'Failed to approve Bhandara');
      }
    } catch (error) {
      console.error('Error approving Bhandara:', error);
      toast.error('Failed to approve Bhandara');
    }
  };

  // Reject Bhandara
  const rejectBhandara = async (id, reason, adminNote = '') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, adminNote })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Bhandara rejected successfully');
        fetchBhandaras();
        setShowModal(false);
      } else {
        toast.error(result.message || 'Failed to reject Bhandara');
      }
    } catch (error) {
      console.error('Error rejecting Bhandara:', error);
      toast.error('Failed to reject Bhandara');
    }
  };

  // Delete Bhandara (soft delete)
  const deleteBhandara = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Bhandara? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bhandara deleted successfully');
        fetchBhandaras();
      } else {
        toast.error(result.message || 'Failed to delete Bhandara');
      }
    } catch (error) {
      console.error('Error deleting Bhandara:', error);
      toast.error('Failed to delete Bhandara');
    }
  };

  // Revert Bhandara status to pending
  const revertToPending = async (id) => {
    if (!window.confirm('Are you sure you want to revert this Bhandara to pending status?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras/${id}/revert`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bhandara reverted to pending status');
        fetchBhandaras();
      } else {
        toast.error(result.message || 'Failed to revert Bhandara status');
      }
    } catch (error) {
      console.error('Error reverting Bhandara status:', error);
      toast.error('Failed to revert Bhandara status');
    }
  };

  // Toggle verification status
  const toggleVerification = async (id, currentStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/bhandaras/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: !currentStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Bhandara ${!currentStatus ? 'verified' : 'unverified'} successfully`);
        fetchBhandaras();
      } else {
        toast.error(result.message || 'Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  useEffect(() => {
    fetchBhandaras();
  }, [selectedTab]);

  // Filter Bhandaras based on search
  const filteredBhandaras = useMemo(() => {
    if (!searchTerm) return bhandaras;
    
    return bhandaras.filter(bhandara =>
      bhandara.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhandara.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhandara.location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bhandaras, searchTerm]);

  // Format date - showing exact UTC database values with 12-hour format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Get the exact UTC values as stored in database
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const utcHours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    // Convert to 12-hour format
    const hours12 = utcHours === 0 ? 12 : utcHours > 12 ? utcHours - 12 : utcHours;
    const ampm = utcHours >= 12 ? 'PM' : 'AM';
    const hoursFormatted = String(hours12).padStart(2, '0');
    
    // Return exact database UTC time in 12-hour format
    return `${day}/${month}/${year}, ${hoursFormatted}:${minutes} ${ampm}`;
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    
    const { bg, text, icon: Icon } = config[status] || config.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Action Buttons Component
  const ActionButtons = ({ bhandara }) => {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setSelectedBhandara(bhandara);
            setShowModal(true);
          }}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {bhandara.status === 'pending' && (
          <>
            <button
              onClick={() => approveBhandara(bhandara._id)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const reason = prompt('Please provide a reason for rejection:');
                if (reason) {
                  rejectBhandara(bhandara._id, reason);
                }
              }}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        
        {bhandara.status === 'approved' && (
          <button
            onClick={() => toggleVerification(bhandara._id, bhandara.isVerified)}
            className={`p-1 rounded transition-colors ${
              bhandara.isVerified 
                ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            title={bhandara.isVerified ? 'Remove Verification' : 'Mark as Verified'}
          >
            <CheckCircle className={`w-4 h-4 ${bhandara.isVerified ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Revert to pending button for approved/rejected Bhandaras */}
        {(bhandara.status === 'approved' || bhandara.status === 'rejected') && (
          <button
            onClick={() => revertToPending(bhandara._id)}
            className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors"
            title="Revert to Pending"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Delete button for all Bhandaras */}
        <button
          onClick={() => deleteBhandara(bhandara._id)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          title="Delete Bhandara"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bhandara Management</h1>
        <p className="text-gray-600">Manage community Bhandara events and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {['pending', 'approved', 'rejected', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedTab(status)}
                  className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                    selectedTab === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && stats[status] > 0 && (
                    <span className="ml-1 md:ml-2 bg-gray-200 text-gray-600 px-1.5 md:px-2 py-0.5 rounded-full text-xs">
                      {stats[status]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, organizer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {/* Table for Desktop, Cards for Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBhandaras.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No Bhandaras found for "{selectedTab}" status
                  </td>
                </tr>
              ) : (
                filteredBhandaras.map((bhandara) => (
                  <tr key={bhandara._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {bhandara.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="line-clamp-1">{bhandara.location.address}</span>
                          </div>
                          {bhandara.foodItems && bhandara.foodItems.length > 0 && (
                            <div className="text-sm text-gray-500 mt-1 flex items-center">
                              <Utensils className="w-3 h-3 mr-1" />
                              <span className="line-clamp-1">{bhandara.foodItems.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{bhandara.organizerName}</div>
                      {bhandara.contact && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {bhandara.contact}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Submitted: {formatDate(bhandara.createdAt)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-green-500" />
                          Start: {formatDate(bhandara.dateTimeStart)}
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1 text-red-500" />
                          End: {formatDate(bhandara.dateTimeEnd)}
                        </div>
                      </div>
                    </td>

                    {/* Trust Score Column */}
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (bhandara.trustScore || 0) >= 60 ? 'bg-green-100 text-green-800' :
                          (bhandara.trustScore || 0) >= 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bhandara.trustScore || 0}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          👍 {bhandara.totalLikes || 0} | 👎 {bhandara.totalDislikes || 0}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <StatusBadge status={bhandara.status} />
                        {bhandara.isVerified && (
                          <div className="inline-flex items-center bg-blue-600 rounded-full px-2 py-1">
                            <CheckCircle className="w-3 h-3 text-white mr-1" />
                            <span className="text-xs text-white font-bold tracking-wide">VERIFIED</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <ActionButtons bhandara={bhandara} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading...</span>
              </div>
            </div>
          ) : filteredBhandaras.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No Bhandaras found for "{selectedTab}" status
            </div>
          ) : (
            filteredBhandaras.map((bhandara) => (
              <div key={bhandara._id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                {/* Header with Status and Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {bhandara.title}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <StatusBadge status={bhandara.status} />
                      {bhandara.isVerified && (
                        <div className="inline-flex items-center bg-blue-600 rounded-full px-2 py-1">
                          <CheckCircle className="w-3 h-3 text-white mr-1" />
                          <span className="text-xs text-white font-bold tracking-wide">VERIFIED</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ActionButtons bhandara={bhandara} />
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{bhandara.location.address}</span>
                  </div>
                  
                  {bhandara.foodItems && bhandara.foodItems.length > 0 && (
                    <div className="flex items-start text-sm text-gray-600">
                      <Utensils className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{bhandara.foodItems.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2 text-purple-500" />
                    <span>{bhandara.organizerName}</span>
                  </div>

                  {bhandara.contact && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{bhandara.contact}</span>
                    </div>
                  )}

                  {/* Trust Score */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Trust Score:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        (bhandara.trustScore || 0) >= 60 ? 'text-green-600' :
                        (bhandara.trustScore || 0) >= 20 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {bhandara.trustScore || 0}%
                      </span>
                      <span className="text-xs text-gray-400">
                        👍 {bhandara.totalLikes || 0} | 👎 {bhandara.totalDislikes || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-green-500" />
                    <span>Start: {formatDate(bhandara.dateTimeStart)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-red-500" />
                    <span>End: {formatDate(bhandara.dateTimeEnd)}</span>
                  </div>
                  <div>
                    Submitted: {formatDate(bhandara.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchBhandaras(selectedTab, pagination.current - 1)}
                disabled={pagination.current === 1}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.current}
              </span>
              <button
                onClick={() => fetchBhandaras(selectedTab, pagination.current + 1)}
                disabled={!pagination.hasMore}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBhandara && (
        <BhandaraDetailModal
          bhandara={selectedBhandara}
          onClose={() => setShowModal(false)}
          onApprove={approveBhandara}
          onReject={rejectBhandara}
        />
      )}
    </div>
  );
};

// Detail Modal Component
const BhandaraDetailModal = ({ bhandara, onClose, onApprove, onReject }) => {
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onApprove(bhandara._id, adminNote);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onReject(bhandara._id, rejectionReason, adminNote);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Bhandara Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Event Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-gray-900">{bhandara.title}</p>
              </div>
              
              {bhandara.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{bhandara.description}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900">{bhandara.location.address}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Time</label>
                  <p className="text-gray-900">{formatDate(bhandara.dateTimeStart)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Time</label>
                  <p className="text-gray-900">{formatDate(bhandara.dateTimeEnd)}</p>
                </div>
              </div>
              
              {bhandara.foodItems && bhandara.foodItems.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Food Items</label>
                  <p className="text-gray-900">{bhandara.foodItems.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Organizer Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Organizer Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{bhandara.organizerName}</p>
                </div>
                {bhandara.contact && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact</label>
                    <p className="text-gray-900">{bhandara.contact}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <p className="text-gray-900">{formatDate(bhandara.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {bhandara.status === 'pending' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Admin Actions</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Note (Optional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add internal notes about this event..."
                  />
                </div>

                {showRejectForm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={3}
                      placeholder="Provide a clear reason for rejection..."
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleApprove}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  
                  {!showRejectForm ? (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleReject}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Info */}
          {bhandara.status !== 'pending' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Status Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                  <FaCheckCircle status={bhandara.status} />
                </div>
                
                {bhandara.rejectionReason && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                    <p className="text-red-600">{bhandara.rejectionReason}</p>
                  </div>
                )}
                
                {bhandara.adminNote && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-700">Admin Note</label>
                    <p className="text-gray-900">{bhandara.adminNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BhandaraManagement;