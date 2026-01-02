import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaCalendarAlt, FaUtensils, FaUser, FaStore, FaChevronRight } from 'react-icons/fa';

const SubscriptionDetails = ({ 
  subscription, 
  onEdit, 
  onDelete,
  onPause,
  onResume
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!subscription) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-600">Loading subscription details...</span>
    </div>
  );

  const {
    subscriptionId,
    status,
    planType,
    shift,
    thaliCount,
    isActive,
    deliverySettings,
    mealCounts = {},
    user,
    sellerId,
    createdAt,
    lastUpdated
  } = subscription;

  const getStatusBadge = () => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    const statusText = status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown Status';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
      }`}>
        {statusText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Subscription #{subscriptionId}</h3>
          <p className="text-sm text-gray-500">Created: {formatDate(createdAt)}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaEdit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FaTrash className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg text-indigo-600 mr-4">
              <FaUser size={20} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">User</h4>
              <p className="text-base font-medium text-gray-900">{user?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
          
          <div className="flex items-start p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg text-indigo-600 mr-4">
              <FaStore size={20} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Seller</h4>
              <p className="text-base font-medium text-gray-900">{sellerId?.businessName || 'N/A'}</p>
              <p className="text-sm text-gray-500">{sellerId?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'delivery', 'meals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </nav>
        </div>

        <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Details</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      {[
                        { label: 'Status', value: getStatusBadge() },
                        { label: 'Plan Type', value: planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : 'N/A' },
                        { label: 'Shift', value: shift === 'both' ? 'Morning & Evening' : shift || 'N/A' },
                        { label: 'Thali Count', value: thaliCount || 0 },
                      ].map((item, index) => (
                        <div key={index} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-100">
                          <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 flex items-center justify-end">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delivery Information</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      {[
                        { label: 'Start Date', value: formatDate(deliverySettings?.startDate) },
                        { label: 'Next Delivery', value: formatDate(deliverySettings?.nextDeliveryDate) || 'N/A' },
                        { label: 'Last Updated', value: formatDate(lastUpdated) },
                        { 
                          label: 'Active', 
                          value: (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isActive ? 'Yes' : 'No'}
                            </span>
                          ) 
                        },
                      ].map((item, index) => (
                        <div key={index} className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-100">
                          <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 flex items-center justify-end">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <FaCalendarAlt className="mr-2 text-indigo-600" />
                    Delivery Schedule
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {deliverySettings?.deliveryDays?.length > 0 ? (
                    deliverySettings.deliveryDays.map((day, index) => (
                      <div key={index} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 capitalize">{day.day || day}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {deliverySettings.startShift === 'both' ? 'Morning & Evening' : deliverySettings.startShift}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                      No delivery days configured
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'meals' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaUtensils className="mr-2 text-indigo-600" />
                    Meal Statistics
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Meals Delivered', value: mealCounts.mealsDelivered || 0, color: 'bg-green-100 text-green-800' },
                    { label: 'Meals Skipped', value: mealCounts.mealsSkipped || 0, color: 'bg-yellow-100 text-yellow-800' },
                    { label: 'Meals Remaining', value: mealCounts.mealsRemaining || 0, color: 'bg-blue-100 text-blue-800' },
                  ].map((stat, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 rounded-md p-3 ${stat.color.replace('text-', 'bg-opacity-10 ')}`}>
                            <FaUtensils className="h-6 w-6" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                              <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {status === 'paused' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={onResume}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaClock className="mr-2" />
                      Resume Subscription
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
            <p>Subscription ID: {subscriptionId}</p>
          </div>
        </div>
      </div>
    
  );
};

export default SubscriptionDetails;
