import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Users, Eye, CheckCircle, XCircle, 
  AlertCircle, Trash2, Edit, RefreshCw, Plus, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MyBhandarasPage = () => {
  const [bhandaras, setBhandaras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const navigate = useNavigate();

  // Status configurations
  const statusConfig = {
    pending: { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      icon: AlertCircle,
      label: 'Pending Review'
    },
    approved: { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      icon: CheckCircle,
      label: 'Approved'
    },
    rejected: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      icon: XCircle,
      label: 'Rejected'
    }
  };

  // Fetch user's Bhandaras
  const fetchMyBhandaras = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/bhandaras/my-bhandaras`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setBhandaras(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch your Bhandaras');
      }
    } catch (error) {
      console.error('Error fetching Bhandaras:', error);
      toast.error('Failed to fetch your Bhandaras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBhandaras();
  }, []);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  // Filter Bhandaras by status
  const filteredBhandaras = selectedStatus === 'all' 
    ? bhandaras 
    : bhandaras.filter(bhandara => bhandara.status === selectedStatus);

  // Get status counts
  const statusCounts = {
    all: bhandaras.length,
    pending: bhandaras.filter(b => b.status === 'pending').length,
    approved: bhandaras.filter(b => b.status === 'approved').length,
    rejected: bhandaras.filter(b => b.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading your Bhandaras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Bhandaras</h1>
            <p className="text-gray-600 mt-1">Track and manage your submitted Bhandara events</p>
          </div>
          <button
            onClick={() => navigate('/bhandara/submit')}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit New Bhandara
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all', label: 'Total', count: statusCounts.all, color: 'blue' },
          { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'yellow' },
          { key: 'approved', label: 'Approved', count: statusCounts.approved, color: 'green' },
          { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'red' }
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            className={`p-4 rounded-lg border transition-all ${
              selectedStatus === key
                ? `border-${color}-500 bg-${color}-50`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </button>
        ))}
      </div>

      {/* Bhandaras List */}
      {filteredBhandaras.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' 
              ? "No Bhandaras submitted yet" 
              : `No ${selectedStatus} Bhandaras found`
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedStatus === 'all'
              ? "Start by submitting your first Bhandara event"
              : `You don't have any ${selectedStatus} Bhandaras at the moment`
            }
          </p>
          {selectedStatus === 'all' && (
            <button
              onClick={() => navigate('/bhandara/submit')}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Submit Your First Bhandara
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBhandaras.map((bhandara) => {
            const StatusIcon = statusConfig[bhandara.status]?.icon || AlertCircle;
            
            return (
              <div key={bhandara._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {bhandara.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {bhandara.description}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[bhandara.status]?.bg} ${statusConfig[bhandara.status]?.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[bhandara.status]?.label}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bhandara.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDateTime(bhandara.dateTimeStart)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>By {bhandara.organizerName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Ends: {formatDateTime(bhandara.dateTimeEnd)}</span>
                      </div>
                    </div>

                    {/* Food Items */}
                    {bhandara.foodItems && bhandara.foodItems.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {bhandara.foodItems.slice(0, 3).map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              {item}
                            </span>
                          ))}
                          {bhandara.foodItems.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{bhandara.foodItems.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Verification Badge */}
                    {bhandara.status === 'approved' && bhandara.isVerified && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Verified</span>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {bhandara.status === 'rejected' && bhandara.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium text-red-800">Rejection Reason: </span>
                          <span className="text-red-700">{bhandara.rejectionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Trust Score for approved Bhandaras */}
                    {bhandara.status === 'approved' && (
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span>Trust Score: {bhandara.trustScore || 0}</span>
                        <span>Likes: {bhandara.totalLikes || 0}</span>
                        <span>Dislikes: {bhandara.totalDislikes || 0}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span>Submitted: {formatDateTime(bhandara.createdAt)}</span>
                    {bhandara.approvedAt && (
                      <span>Approved: {formatDateTime(bhandara.approvedAt)}</span>
                    )}
                    {bhandara.rejectedAt && (
                      <span>Rejected: {formatDateTime(bhandara.rejectedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBhandarasPage;