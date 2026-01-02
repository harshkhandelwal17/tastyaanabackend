import React, { useState } from 'react';

// Inline SVG Icons
const TicketIcon = ({ size = 20, className = 'text-blue-500' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM10 12V10H14V12H10ZM10 14V16H14V14H10Z" />
    </svg>
);
const PlusIcon = ({ size = 20, className = 'text-white' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
    </svg>
);
const SearchIcon = ({ size = 20, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.5L20.5 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
    </svg>
);
const ChatIcon = ({ size = 20, className = 'text-gray-600' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2H20C21.1 2 22 2.9 22 4V16C22 17.1 21.1 18 20 18H8L4 22V18H4C2.9 18 2 17.1 2 16V4C2 2.9 2.9 2 4 2ZM4 16H20V4H4V16Z" />
    </svg>
);
const EmailIcon = ({ size = 20, className = 'text-gray-600' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" />
    </svg>
);

// Mock Data
const mockTickets = [
    { id: 'TKT-001', title: 'Payment processing issue', category: 'Payment', status: 'In-progress', user: 'Arjun Sharma', priority: 'High', date: '2025-09-10' },
    { id: 'TKT-002', title: 'Incorrect item delivered from vendor', category: 'Vendor Issue', status: 'Open', user: 'Priya Singh', priority: 'High', date: '2025-09-09' },
    { id: 'TKT-003', title: 'Question about delivery fees', category: 'General Inquiry', status: 'Resolved', user: 'Rahul Kumar', priority: 'Low', date: '2025-09-08' },
    { id: 'TKT-004', title: 'Vendor onboarding form is broken', category: 'Technical Issue', status: 'In-progress', user: 'Fresh Bites Co.', priority: 'Medium', date: '2025-09-08' },
    { id: 'TKT-005', title: 'Unable to login', category: 'Technical Issue', status: 'Resolved', user: 'Sneha Gupta', priority: 'Medium', date: '2025-09-07' },
];

// Component
const Support = () => {
    const [tickets, setTickets] = useState(mockTickets);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);

    // Filtered tickets
    const filteredTickets = tickets.filter(ticket =>
        (filterStatus === 'All' || ticket.status === filterStatus) &&
        (ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
         ticket.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Handle status change for a ticket
    const handleStatusChange = (ticketId, newStatus) => {
        setTickets(prevTickets =>
            prevTickets.map(ticket =>
                ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
            )
        );
    };

    // Handle form submission for a new ticket
    const handleNewTicketSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const newTicket = {
            id: `TKT-${Math.floor(Math.random() * 1000)}`,
            title: form.title.value,
            category: form.category.value,
            status: 'Open',
            user: form.user.value,
            priority: form.priority.value,
            date: new Date().toISOString().slice(0, 10)
        };
        setTickets(prevTickets => [newTicket, ...prevTickets]);
        setShowNewTicketForm(false);
        form.reset();
    };

    // Get color for status badge
    const getStatusColor = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-red-100 text-red-800';
            case 'In-progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'Resolved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <TicketIcon size={32} className="text-blue-600" />
                    Support & Complaints
                </h1>
                
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <div className="relative w-full sm:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="In-progress">In-progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            <button
                                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 transition-colors"
                            >
                                <PlusIcon />
                                New Ticket
                            </button>
                        </div>
                    </div>
                    
                    {/* New Ticket Form */}
                    {showNewTicketForm && (
                        <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 transition-all duration-300 ease-in-out">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Ticket</h3>
                            <form onSubmit={handleNewTicketSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label htmlFor="user" className="block text-sm font-medium text-gray-700">User/Vendor Name</label>
                                    <input type="text" id="user" name="user" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Ticket Title</label>
                                    <input type="text" id="title" name="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                    <select id="category" name="category" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                        <option value="Payment">Payment</option>
                                        <option value="Vendor Issue">Vendor Issue</option>
                                        <option value="Technical Issue">Technical Issue</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select id="priority" name="priority" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="col-span-full">
                                    <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 transition-colors">Submit Ticket</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto mt-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Ticket ID', 'Title', 'User/Vendor', 'Category', 'Status', 'Date'].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.user}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                className="rounded-md border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In-progress">In-progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No tickets found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                        <div className="flex-shrink-0 bg-blue-500 p-3 rounded-full">
                            <ChatIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Live Chat Support</h3>
                            <p className="text-sm text-gray-600 mt-1">Connect with a support agent in real-time for immediate assistance.</p>
                            <button className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 transition-colors">Start Chat</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
                        <div className="flex-shrink-0 bg-blue-500 p-3 rounded-full">
                            <EmailIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Email Support</h3>
                            <p className="text-sm text-gray-600 mt-1">Send us an email and we'll get back to you within 24 hours.</p>
                            <button className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 transition-colors">Send Email</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
