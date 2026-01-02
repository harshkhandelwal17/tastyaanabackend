import React, { useState } from 'react';
import { FaPhone, FaMapMarkerAlt, FaEdit, FaCheckCircle, FaTimesCircle, FaPlus, FaTrash } from 'react-icons/fa';

// Helper component for editable input fields
const EditableField = ({ value, onSave, type = 'text', label, isEditing, setIsEditing, inputClass, selectOptions = [] }) => {
    const [inputValue, setInputValue] = useState(value);

    // Update internal state if parent value changes
    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(inputValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setInputValue(value); // Revert to original value
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-0.5">{label}</label>
            {isEditing ? (
                <div className="flex items-center space-x-2 mt-1">
                    {selectOptions.length > 0 ? (
                        <select
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                        >
                            {selectOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={type}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                        />
                    )}
                    <button onClick={handleSave} className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-green-100">
                        <FaCheckCircle size={20} />
                    </button>
                    <button onClick={handleCancel} className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100">
                        <FaTimesCircle size={20} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center space-x-2 mt-1 min-h-[38px]"> {/* Added min-h for consistent height */}
                    <span className="text-gray-800">{value}</span>
                    <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded-full hover:bg-indigo-100">
                        <FaEdit size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const DeliveryManagement = () => {
    const [partners, setPartners] = useState([
        { id: 1, name: 'John Doe', phone: '987-654-3210', status: 'Available', assignedOrders: ['#ORD001', '#ORD005'] },
        { id: 2, name: 'Jane Smith', phone: '123-456-7890', status: 'On-Delivery', assignedOrders: ['#ORD002'] },
        { id: 3, name: 'Peter Jones', phone: '456-789-0123', status: 'Available', assignedOrders: [] },
    ]);

    const [orders, setOrders] = useState([
        { id: '#ORD001', status: 'Assigned', partnerId: 1, customer: 'Alice', assignedCategory: 'food' },
        { id: '#ORD002', status: 'Picked Up', partnerId: 2, customer: 'Bob', assignedCategory: 'grocery' },
        { id: '#ORD003', status: 'Ready for Pickup', partnerId: null, customer: 'Charlie', assignedCategory: 'sweets' },
        { id: '#ORD004', status: 'Ready for Pickup', partnerId: null, customer: 'David', assignedCategory: 'vegetable' },
        { id: '#ORD005', status: 'Out for Delivery', partnerId: 1, customer: 'Eve', assignedCategory: 'general' },
    ]);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [newPartner, setNewPartner] = useState({ name: '', phone: '', status: 'Available' });
    const [newOrder, setNewOrder] = useState({ customer: '', assignedCategory: 'food' });

    // State for managing which specific field is being edited for a given item
    const [editingPartnerField, setEditingPartnerField] = useState({ id: null, field: null });
    const [editingOrderField, setEditingOrderField] = useState({ id: null, field: null });

    const partnerStatuses = ['Available', 'On-Delivery', 'Offline'];
    const orderStatuses = ['order_placed', 'payment_confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'delayed', 'on-the-way', 'reached'];
    const orderCategories = ['food', 'vegetable', 'sweets', 'stationary', 'general', 'grocery'];


    const assignPartnerToOrder = () => {
        if (selectedPartner && selectedOrder) {
            // Update the partner's assigned orders
            setPartners(partners.map(p =>
                p.id === selectedPartner.id
                    ? { ...p, assignedOrders: [...p.assignedOrders, selectedOrder.id], status: 'On-Delivery' } // Set partner to On-Delivery
                    : p
            ));

            // Update the order's status and partnerId
            setOrders(orders.map(o =>
                o.id === selectedOrder.id
                    ? { ...o, partnerId: selectedPartner.id, status: 'assigned' } // Use lowercase for consistency with schema
                    : o
            ));

            // Clear selections
            setSelectedOrder(null);
            setSelectedPartner(null);
        }
    };

    const handleAddPartner = (e) => {
        // e.preventDefault();
        const id = partners.length > 0 ? Math.max(...partners.map(p => p.id)) + 1 : 1;
        setPartners([...partners, { id, ...newPartner, assignedOrders: [] }]);
        setNewPartner({ name: '', phone: '', status: 'Available' });
        document.getElementById('add-partner-modal').close();
    };

    
    const handleAddOrder = (e) => {
        e.preventDefault();
        const idNum = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id.replace('#ORD', '')))) + 1 : 1;
        const id = `#ORD${String(idNum).padStart(3, '0')}`;
        setOrders([...orders, { id, ...newOrder, status: 'ready_for_pickup', partnerId: null }]); // Use lowercase for consistency with schema
        setNewOrder({ customer: '', assignedCategory: 'food' });
        document.getElementById('add-order-modal').close();
    };

    const handleDeletePartner = (id) => {
        if (window.confirm("Are you sure you want to delete this partner?")) {
            setPartners(partners.filter(p => p.id !== id));
            // Also unassign orders from this partner
            setOrders(orders.map(o => o.partnerId === id ? { ...o, partnerId: null, status: 'ready_for_pickup' } : o));
        }
    };

    const handleDeleteOrder = (id) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            setOrders(orders.filter(o => o.id !== id));
            // Also remove order from any assigned partner
            setPartners(partners.map(p => ({
                ...p,
                assignedOrders: p.assignedOrders.filter(orderId => orderId !== id)
            })));
        }
    };

    const updatePartner = (id, field, value) => {
        setPartners(prevPartners =>
            prevPartners.map(p => p.id === id ? { ...p, [field]: value } : p)
        );
    };

    const updateOrder = (id, field, value) => {
        setOrders(prevOrders =>
            prevOrders.map(o => o.id === id ? { ...o, [field]: value } : o)
        );
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Available':
                return 'bg-green-100 text-green-800';
            case 'On-Delivery':
                return 'bg-yellow-100 text-yellow-800';
            case 'assigned':
            case 'picked_up':
            case 'out_for_delivery':
            case 'on-the-way':
            case 'reached':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
                return 'bg-purple-100 text-purple-800';
            case 'cancelled':
            case 'delayed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
            <div className="container mx-auto max-w-7xl">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-10 text-center tracking-tight">
                    Delivery Management Dashboard
                </h1>

                {/* Delivery Partner & Assign Order Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Delivery Partner List */}
                    <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 border border-gray-200">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center justify-between pb-2 border-b border-gray-200">
                            Delivery Partner List
                            <button onClick={() => document.getElementById('add-partner-modal').showModal()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md">
                                <FaPlus />
                            </button>
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Orders
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {partners.map((partner) => (
                                        <tr key={partner.id}
                                            className={`${selectedPartner?.id === partner.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'} transition-all duration-150 ease-in-out cursor-pointer`}
                                            onClick={() => setSelectedPartner(partner)}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={partner.name}
                                                    onSave={(val) => updatePartner(partner.id, 'name', val)}
                                                    label="Name"
                                                    isEditing={editingPartnerField.id === partner.id && editingPartnerField.field === 'name'}
                                                    setIsEditing={(isEditing) => setEditingPartnerField(isEditing ? { id: partner.id, field: 'name' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={partner.phone}
                                                    onSave={(val) => updatePartner(partner.id, 'phone', val)}
                                                    label="Phone"
                                                    isEditing={editingPartnerField.id === partner.id && editingPartnerField.field === 'phone'}
                                                    setIsEditing={(isEditing) => setEditingPartnerField(isEditing ? { id: partner.id, field: 'phone' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={partner.status}
                                                    onSave={(val) => updatePartner(partner.id, 'status', val)}
                                                    label="Status"
                                                    isEditing={editingPartnerField.id === partner.id && editingPartnerField.field === 'status'}
                                                    setIsEditing={(isEditing) => setEditingPartnerField(isEditing ? { id: partner.id, field: 'status' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                    selectOptions={partnerStatuses}
                                                />
                                                {/* <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(partner.status)}`}>
                                                    {partner.status}
                                                </span> */}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {partner.assignedOrders.length > 0 ? partner.assignedOrders.join(', ') : 'None'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={(e) => { e.stopPropagation(); handleDeletePartner(partner.id); }} className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100">
                                                    <FaTrash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Assign Delivery Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between border border-gray-200">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Assign Delivery
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Order to Assign</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                                        value={selectedOrder ? selectedOrder.id : ''}
                                        onChange={(e) => setSelectedOrder(orders.find(o => o.id === e.target.value))}
                                    >
                                        <option value="">-- Choose an unassigned order --</option>
                                        {orders.filter(o => o.partnerId === null).map(order => (
                                            <option key={order.id} value={order.id}>
                                                {order.id} - {order.customer} ({order.assignedCategory})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Partner</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                                        value={selectedPartner ? selectedPartner.id : ''}
                                        onChange={(e) => setSelectedPartner(partners.find(p => p.id === parseInt(e.target.value)))}
                                    >
                                        <option value="">-- Choose an available partner --</option>
                                        {partners.filter(p => p.status === 'Available').map(partner => (
                                            <option key={partner.id} value={partner.id}>
                                                {partner.name} ({partner.assignedOrders.length} orders currently)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={assignPartnerToOrder}
                            disabled={!selectedOrder || !selectedPartner}
                            className={`mt-6 w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ease-in-out shadow-md
                                ${!selectedOrder || !selectedPartner ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'}`}
                        >
                            Assign Partner to Order
                        </button>
                    </div>
                </div>

                {/* Tracking & Other Orders Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order List */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center justify-between pb-2 border-b border-gray-200">
                            Order List
                            <button onClick={() => document.getElementById('add-order-modal').showModal()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md">
                                <FaPlus />
                            </button>
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {order.id}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={order.status}
                                                    onSave={(val) => updateOrder(order.id, 'status', val)}
                                                    label="Status"
                                                    isEditing={editingOrderField.id === order.id && editingOrderField.field === 'status'}
                                                    setIsEditing={(isEditing) => setEditingOrderField(isEditing ? { id: order.id, field: 'status' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                    selectOptions={orderStatuses}
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={order.customer}
                                                    onSave={(val) => updateOrder(order.id, 'customer', val)}
                                                    label="Customer"
                                                    isEditing={editingOrderField.id === order.id && editingOrderField.field === 'customer'}
                                                    setIsEditing={(isEditing) => setEditingOrderField(isEditing ? { id: order.id, field: 'customer' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <EditableField
                                                    value={order.assignedCategory}
                                                    onSave={(val) => updateOrder(order.id, 'assignedCategory', val)}
                                                    label="Category"
                                                    isEditing={editingOrderField.id === order.id && editingOrderField.field === 'assignedCategory'}
                                                    setIsEditing={(isEditing) => setEditingOrderField(isEditing ? { id: order.id, field: 'assignedCategory' } : { id: null, field: null })}
                                                    inputClass="text-sm"
                                                    selectOptions={orderCategories}
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100">
                                                    <FaTrash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tracking Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between border border-gray-200">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                            Live Tracking (Future-ready)
                        </h2>
                        <div className="flex-grow flex flex-col justify-center items-center text-center text-gray-500 bg-gray-50 rounded-lg p-4">
                            <FaMapMarkerAlt size={70} className="text-indigo-500 mb-5 animate-pulse" />
                            <p className="text-lg font-semibold text-gray-700 mb-2">Real-time Map Integration</p>
                            <p className="text-md max-w-sm">This section is a placeholder for dynamic map rendering to show live delivery routes and driver locations.</p>
                            <p className="text-sm text-gray-400 mt-2">Example: Google Maps, Leaflet.js, Mapbox</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for adding new entries */}
            {/* Add Partner Modal */}
            {/* Add Partner Modal */}
<dialog id="add-partner-modal" className="modal">
    <div className="modal-box">
        <h3 className="font-bold text-lg">Add New Delivery Partner</h3>
        {/* Remove the onSubmit from the form and use button's onClick */}
        <div className="py-4 space-y-4">
            <input
                type="text"
                placeholder="Name"
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
            />
            <input
                type="tel"
                placeholder="Phone"
                value={newPartner.phone}
                onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
            />
            <div className="modal-action">
                {/* Change type to "button" and use onClick */}
                <button
                    type="button"
                    onClick={() => {
                        handleAddPartner();
                        document.getElementById('add-partner-modal').close();
                    }}
                    className="btn btn-primary"
                >
                    Add Partner
                </button>
                <button type="button" onClick={() => document.getElementById('add-partner-modal').close()} className="btn">
                    Cancel
                </button>
            </div>
        </div>
    </div>
    <form method="dialog" className="modal-backdrop">
        <button>close</button>
    </form>
</dialog>


            {/* Add Order Modal */}
            {/* Add Order Modal */}
<dialog id="add-order-modal" className="modal">
    <div className="modal-box">
        <h3 className="font-bold text-lg">Add New Order</h3>
        {/* Remove the onSubmit from the form and use button's onClick */}
        <div className="py-4 space-y-4">
            <input
                type="text"
                placeholder="Customer Name"
                value={newOrder.customer}
                onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
            />
            <select
                value={newOrder.assignedCategory}
                onChange={(e) => setNewOrder({ ...newOrder, assignedCategory: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
            >
                <option value="food">Food</option>
                <option value="vegetable">Vegetable</option>
                <option value="sweets">Sweets</option>
                <option value="stationary">Stationary</option>
                <option value="general">General</option>
                <option value="grocery">Grocery</option>
            </select>
            <div className="modal-action">
                {/* Change type to "button" and use onClick */}
                <button
                    type="button"
                    onClick={() => {
                        handleAddOrder();
                        document.getElementById('add-order-modal').close();
                    }}
                    className="btn btn-primary"
                >
                    Add Order
                </button>
                <button type="button" onClick={() => document.getElementById('add-order-modal').close()} className="btn">
                    Cancel
                </button>
            </div>
        </div>
    </div>
    <form method="dialog" className="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
        </div>
    );
};

export default DeliveryManagement;