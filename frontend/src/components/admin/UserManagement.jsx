import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, Eye, Ban, Check, Key, Bell, Mail, Phone, MapPin, CreditCard,
  Calendar, ChevronLeft, Edit, Trash2, Plus, Download, MoreHorizontal, UserCheck, UserX,
  Store, Bike, Wallet, Save, X, Building, ShieldCheck
} from 'lucide-react';

// ===== MOCK DATA (aligned with the new schema) =====
const initialUsers = [
  {
    _id: "63f8d3c7b3d3f4a2d8a3b8e1",
    name: "Rajesh Kumar",
    email: "rajesh.buyer@example.com",
    phone: "+91 9876543210",
    role: "buyer",
    isActive: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: "2024-01-15T10:00:00.000Z",
    lastLogin: "2024-09-08T18:30:00.000Z",
    addresses: [
      { type: "home", name: "Main Residence", street: "123 MG Road", city: "Indore", state: "MP", pincode: "452001", isDefault: true },
      { type: "work", name: "Office", street: "456 Corporate Park", city: "Indore", state: "MP", pincode: "452010", isDefault: false }
    ],
    wallet: { balance: 1250, transactions: [] },
    loyaltyPoints: 350,
    orderCount: 24, // Aggregated field for display
  },
  {
    _id: "63f8d3c7b3d3f4a2d8a3b8e2",
    name: "Priya Sharma",
    email: "priya.seller@example.com",
    phone: "+91 9876543211",
    role: "seller",
    isActive: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: "2024-02-20T11:00:00.000Z",
    lastLogin: "2024-09-09T09:00:00.000Z",
    sellerProfile: {
      storeName: "Priya's Fresh Produce",
      storeDescription: "Organic vegetables and fruits.",
      storeAddress: "789 Vijay Nagar, Indore, MP 452010",
      storeStatus: 'open',
      ratings: { average: 4.8, count: 120 },
      isVerified: true,
    },
    addresses: [],
    wallet: { balance: 5800, transactions: [] },
    loyaltyPoints: 0,
    orderCount: 152,
  },
  {
    _id: "63f8d3c7b3d3f4a2d8a3b8e3",
    name: "Amit Patel",
    email: "amit.driver@example.com",
    phone: "+91 9876543212",
    role: "delivery",
    isActive: false,
    isBlocked: true,
    isEmailVerified: false,
    isPhoneVerified: true,
    createdAt: "2024-03-10T12:00:00.000Z",
    lastLogin: "2024-08-15T14:00:00.000Z",
    driverProfile: {
      isOnline: false,
      vehicle: { type: 'bike', number: 'MP09 AB 1234' },
      deliveries: 45,
    },
    addresses: [],
    wallet: { balance: 350, transactions: [] },
    loyaltyPoints: 0,
    orderCount: 45,
  },
    {
    _id: "63f8d3c7b3d3f4a2d8a3b8e4",
    name: "Sneha Jain",
    email: "sneha.admin@example.com",
    phone: "+91 9876543213",
    role: "admin",
    isActive: true,
    isBlocked: false,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: "2023-12-05T09:00:00.000Z",
    lastLogin: "2024-09-09T11:00:00.000Z",
    addresses: [],
    wallet: { balance: 0, transactions: [] },
    loyaltyPoints: 0,
    orderCount: 0,
  },
];

// ===== Helper Components =====

const StatusBadge = ({ isActive, isBlocked }) => {
  if (isBlocked) {
    return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>;
  }
  if (isActive) {
    return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
  }
  return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Inactive</span>;
};

const RoleBadge = ({ role }) => {
    const roleColors = {
        buyer: 'bg-blue-100 text-blue-800',
        seller: 'bg-purple-100 text-purple-800',
        delivery: 'bg-teal-100 text-teal-800',
        admin: 'bg-gray-200 text-gray-800',
        'super-admin': 'bg-pink-200 text-pink-900',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
};

const EditableField = ({ label, value, onChange, isEditing, type = 'text', name, options = [] }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      {isEditing ? (
        type === 'select' ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          />
        )
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value || 'N/A'}</p>
      )}
    </div>
  );
};

// ===== Main Components =====

const UserDetailView = ({ user, onBack, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(JSON.parse(JSON.stringify(user)));
    const [activeTab, setActiveTab] = useState('profile');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (e, section) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value
            }
        }));
    };
    
    const handleToggleChange = (name) => {
      setEditedUser(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleSave = () => {
        onSave(editedUser);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedUser(JSON.parse(JSON.stringify(user)));
        setIsEditing(false);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: Users },
        { id: 'address', label: 'Address', icon: MapPin },
        ...(user.role === 'seller' ? [{ id: 'seller', label: 'Seller Info', icon: Store }] : []),
        ...(user.role === 'delivery' ? [{ id: 'driver', label: 'Driver Info', icon: Bike }] : []),
        { id: 'wallet', label: 'Wallet', icon: Wallet },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField label="Full Name" name="name" value={editedUser.name} onChange={handleInputChange} isEditing={isEditing} />
                        <EditableField label="Email" name="email" value={editedUser.email} onChange={handleInputChange} isEditing={isEditing} />
                        <EditableField label="Phone" name="phone" value={editedUser.phone} onChange={handleInputChange} isEditing={isEditing} />
                        <EditableField label="Role" name="role" value={editedUser.role} onChange={handleInputChange} isEditing={isEditing} type="select" options={[
                            { value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' }, { value: 'delivery', label: 'Delivery' }, { value: 'admin', label: 'Admin' }
                        ]} />
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Account Status</label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-orange-600 border-gray-300 rounded" checked={editedUser.isActive} onChange={() => handleToggleChange('isActive')} disabled={!isEditing} />
                                    <span className="ml-2 text-sm text-gray-700">Is Active</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-orange-600 border-gray-300 rounded" checked={editedUser.isBlocked} onChange={() => handleToggleChange('isBlocked')} disabled={!isEditing} />
                                    <span className="ml-2 text-sm text-gray-700">Is Blocked</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Verification Status</label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-orange-600 border-gray-300 rounded" checked={editedUser.isEmailVerified} onChange={() => handleToggleChange('isEmailVerified')} disabled={!isEditing} />
                                    <span className="ml-2 text-sm text-gray-700">Email Verified</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-orange-600 border-gray-300 rounded" checked={editedUser.isPhoneVerified} onChange={() => handleToggleChange('isPhoneVerified')} disabled={!isEditing} />
                                    <span className="ml-2 text-sm text-gray-700">Phone Verified</span>
                                </label>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 md:col-span-2">Joined on {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-4">
                        {editedUser.addresses?.map((addr, index) => (
                           <div key={index} className="p-4 border rounded-lg">
                             <div className="flex justify-between items-center">
                               <p className="font-bold capitalize">{addr.type} {addr.isDefault && <span className="text-xs bg-orange-100 text-orange-700 p-1 rounded-md">Default</span>}</p>
                               {isEditing && <button className="text-red-500"><Trash2 size={16}/></button>}
                             </div>
                             <p>{addr.name}</p>
                             <p>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                           </div>
                        ))}
                         {isEditing && <button className="w-full text-center p-2 border-2 border-dashed rounded-lg hover:bg-gray-50">+ Add Address</button>}
                    </div>
                );
            case 'seller':
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditableField label="Store Name" name="storeName" value={editedUser.sellerProfile?.storeName} onChange={(e) => handleNestedChange(e, 'sellerProfile')} isEditing={isEditing} />
                        <EditableField label="Store Address" name="storeAddress" value={editedUser.sellerProfile?.storeAddress} onChange={(e) => handleNestedChange(e, 'sellerProfile')} isEditing={isEditing} />
                        <EditableField label="Store Status" name="storeStatus" value={editedUser.sellerProfile?.storeStatus} onChange={(e) => handleNestedChange(e, 'sellerProfile')} isEditing={isEditing} type="select" options={[
                            { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }
                        ]} />
                        <p className="text-sm text-gray-500">Average Rating: {user.sellerProfile?.ratings?.average} ({user.sellerProfile?.ratings?.count} reviews)</p>
                    </div>
                 );
            case 'driver':
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <p className="text-sm text-gray-500">Status: {user.driverProfile?.isOnline ? "Online" : "Offline"}</p>
                         <p className="text-sm text-gray-500">Total Deliveries: {user.driverProfile?.deliveries}</p>
                         <EditableField label="Vehicle Type" name="type" value={editedUser.driverProfile?.vehicle?.type} onChange={(e) => setEditedUser(p => ({...p, driverProfile: {...p.driverProfile, vehicle: {...p.driverProfile.vehicle, type: e.target.value}}}))} isEditing={isEditing} />
                         <EditableField label="Vehicle Number" name="number" value={editedUser.driverProfile?.vehicle?.number} onChange={(e) => setEditedUser(p => ({...p, driverProfile: {...p.driverProfile, vehicle: {...p.driverProfile.vehicle, number: e.target.value}}}))} isEditing={isEditing} />
                    </div>
                 );
            case 'wallet':
                return (
                    <div>
                         <EditableField label="Wallet Balance" name="balance" value={editedUser.wallet?.balance} onChange={(e) => setEditedUser(p => ({...p, wallet: {...p.wallet, balance: e.target.value}}))} isEditing={isEditing} type="number" />
                         <EditableField label="Loyalty Points" name="loyaltyPoints" value={editedUser.loyaltyPoints} onChange={handleInputChange} isEditing={isEditing} type="number" />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
             <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <StatusBadge isActive={user.isActive} isBlocked={user.isBlocked} />
                        {!isEditing ? (
                             <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                                 <Edit size={16} /> Edit
                             </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                    <Save size={16} /> Save
                                </button>
                                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                 </div>
             </div>
             
             <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-4 px-4 overflow-x-auto" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
                                    <tab.icon size={16}/> {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </div>
             </div>
        </div>
    );
};

const UserTable = ({ users, onSelectUser, onUserAction }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                                          {user.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500 md:hidden">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                    <div className="text-sm text-gray-900">{user.email}</div>
                                    <div className="text-sm text-gray-500">{user.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge isActive={user.isActive} isBlocked={user.isBlocked} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onSelectUser(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View/Edit User"><Eye size={16} /></button>
                                        {user.isBlocked ? (
                                            <button onClick={() => onUserAction(user._id, 'unblock')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Unblock User"><UserCheck size={16} /></button>
                                        ) : (
                                            <button onClick={() => onUserAction(user._id, 'block')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Block User"><UserX size={16} /></button>
                                        )}
                                        <button onClick={() => onUserAction(user._id, 'delete')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Delete User"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserFormModal = ({ isOpen, onClose, onSave }) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'buyer', password: '' });

    if (!isOpen) return null;
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewUser(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = () => {
      onSave(newUser);
      onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Add New User</h2>
                <div className="space-y-4">
                    <input name="name" value={newUser.name} onChange={handleInputChange} placeholder="Full Name" className="w-full p-2 border rounded" />
                    <input name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address" className="w-full p-2 border rounded" />
                    <input name="phone" value={newUser.phone} onChange={handleInputChange} placeholder="Phone Number" className="w-full p-2 border rounded" />
                    <input name="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Password" className="w-full p-2 border rounded" />
                    <select name="role" value={newUser.role} onChange={handleInputChange} className="w-full p-2 border rounded">
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="delivery">Delivery</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="mt-6 flex gap-3">
                    <button onClick={handleSubmit} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">Create User</button>
                    <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ===== Parent Component =====

const UsersManagement = () => {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    
    const filteredUsers = useMemo(() => {
      return users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.phone.includes(searchTerm);
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || 
                              (filterStatus === 'active' && user.isActive && !user.isBlocked) ||
                              (filterStatus === 'inactive' && !user.isActive) ||
                              (filterStatus === 'blocked' && user.isBlocked);
        return matchesSearch && matchesRole && matchesStatus;
      });
    }, [users, searchTerm, filterRole, filterStatus]);
    
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    const handleUserAction = useCallback((userId, action) => {
        if (action === 'delete' && !window.confirm("Are you sure you want to delete this user?")) {
            return;
        }
        setUsers(prev => {
            if (action === 'delete') {
                return prev.filter(user => user._id !== userId);
            }
            return prev.map(user => {
                if (user._id === userId) {
                    switch (action) {
                        case 'block': return { ...user, isBlocked: true };
                        case 'unblock': return { ...user, isBlocked: false, isActive: true };
                        default: return user;
                    }
                }
                return user;
            });
        });
    }, []);
    
    const handleSaveUser = useCallback((updatedUser) => {
        setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
        setSelectedUser(updatedUser); // Keep the detail view open with updated data
        // Here you would typically make an API call:
        // API.updateUser(updatedUser._id, updatedUser);
    }, []);

    const handleCreateUser = useCallback((newUser) => {
        const userToAdd = {
            ...newUser,
            _id: `new_${Date.now()}`, // temp ID
            createdAt: new Date().toISOString(),
            isActive: true,
            isBlocked: false,
            isEmailVerified: false,
            isPhoneVerified: false,
            addresses: [],
            wallet: { balance: 0 },
            // Add default profiles if needed
        };
        setUsers(prev => [userToAdd, ...prev]);
        // API.createUser(newUser);
    }, []);

    if (selectedUser) {
        return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} onSave={handleSaveUser} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
             {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg"><Users className="w-6 h-6 text-orange-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                            <p className="text-gray-600">Manage customer accounts and profiles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">
                            <Download size={16} /> <span className="hidden sm:inline">Export</span>
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                            <Plus size={16} /> <span className="hidden sm:inline">Add User</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" placeholder="Search by name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="all">All Roles</option>
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="delivery">Delivery</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
                
                <UserTable users={currentUsers} onSelectUser={setSelectedUser} onUserAction={handleUserAction} />

                 {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-4 mt-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                         <div className="text-sm text-gray-700">
                             Showing <b>{((currentPage - 1) * usersPerPage) + 1}</b> to <b>{Math.min(currentPage * usersPerPage, filteredUsers.length)}</b> of <b>{filteredUsers.length}</b> users
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                             <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                         </div>
                    </div>
                )}
            </div>
            
            <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateUser} />
        </div>
    );
};

export default UsersManagement;