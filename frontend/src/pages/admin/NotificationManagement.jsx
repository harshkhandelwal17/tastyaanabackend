import React, { useState } from 'react';
import NotificationSender from '../../components/admin/NotificationSender';

const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState('send');

  const tabs = [
    { id: 'send', label: '📤 Send Notification', icon: '📤' },
    { id: 'history', label: '📋 Notification History', icon: '📋' },
    { id: 'stats', label: '📊 Statistics', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔔 Notification Management</h1>
          <p className="text-gray-600 mt-2">Send notifications to specific users and manage notification history</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'send' && (
            <div className="p-6">
              <NotificationSender />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Notification History</h3>
                <p className="text-gray-500">View all sent notifications and their delivery status</p>
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Load History
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Notification Statistics</h3>
                <p className="text-gray-500">View notification delivery rates and user engagement</p>
                <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Load Statistics
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
