import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Truck, DollarSign, Users, Settings, Phone, Package, HeartHandshake, Menu, X, SubscriptIcon } from 'lucide-react';
import VendorManagement from './VendorManagement';
import Dashboard from './Dashboard';
import ProductManagement from './ProductManagement';
import OrdersManagement from './OrderManagement';
import UsersManagement from './UserManagement';
import DeliveryManagement from './DeliveryManagement';
import Payments from './Payments';
import Support from './Support';
import Subscription from './Subscription';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';



// const Sidebar = ({ activeSection, onSectionClick, isSidebarOpen, onToggle }) => {
//   const sections = [
//     { name: 'Dashboard', icon: LayoutDashboard, link: "/dashboard" },
//     { name: 'Products', icon: ShoppingBag,  link: "/products"},
//     { name: 'Orders', icon: Package, link: "/orders" },
//     { name: 'Seller', icon: HeartHandshake, link: "/seller" },
//     { name: 'User', icon: Users, link: "/users" },
//     { name: 'Delivery', icon: Truck, link: "/delivery" },
//     { name: 'Payments', icon: DollarSign, link:"/payments" },
//     { name: 'Settings', icon: Settings, link: "/settings" },
//     { name: 'Customer Support', icon: Phone, link: "/supoort" },
//     { name: 'Subscription', icon: SubscriptIcon, link: "/subscription" },

//   ];

//   return (
//     <>
//       <div
//         className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-4 transition-transform duration-300 transform md:translate-x-0 ${
//           isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         <div className="flex items-center justify-between mb-8">
//           <h1 className="text-xl font-bold rounded-lg text-teal-300">Tastyaana Admin</h1>
//           <button onClick={onToggle} className="md:hidden text-white focus:outline-none">
//             <X className="h-6 w-6" />
//           </button>
//         </div>
//         <nav>
//           <ul>
//             {sections.map((section) => (
//               <li key={section.name} className="mb-2">
//                 <a
//                   onClick={() => {
//                     onSectionClick(section.name);
//                     onToggle();
//                   }}
//                   href={section.link}
//                   className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
//                     activeSection === section.name
//                       ? 'bg-teal-600 text-white'
//                       : 'hover:bg-teal-800'
//                   }`}
//                 >
//                   <section.icon className="h-5 w-5 mr-3" />
//                   {section.name}
//                 </a>
//               </li>
//             ))}
//           </ul>
//         </nav>
//       </div>
//       {/* Overlay to close sidebar on mobile */}
//       {isSidebarOpen && (
//         <div
//           onClick={onToggle}
//           className="fixed inset-0 z-40 bg-black opacity-50 md:hidden"
//         ></div>
//       )}
//     </>
//   );
// };

// const Header = ({ onToggle }) => {
//   return (
//     <header className="bg-white shadow-lg p-4 flex justify-between items-center rounded-lg">
//       <button onClick={onToggle} className="md:hidden text-gray-800 focus:outline-none">
//         <Menu className="h-6 w-6" />
//       </button>
//       <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
//       <div className="flex items-center">
//         <span className="text-gray-600 mr-2">Admin User</span>
//         <div className="h-8 w-8 rounded-full bg-slate-400"></div>
//       </div>
//     </header>
//   );
// };

const MainContent = ({ activeSection }) => {
  let content;

  switch (activeSection) {
    case 'Dashboard':
      content = <Dashboard />;
      break;
    case 'Products':
      // content = <ProductManagement />;
      break;
    case 'Orders':
      content = <OrdersManagement />;
      break;
    case 'Seller':
      content = <VendorManagement />;
      break;
    case 'User':
      content = <UsersManagement />;
      break;
    case 'Delivery':
      content = <DeliveryManagement />;
      break;
    case 'Payments':
      content = <Payments />;
      break;
    case 'Settings':
      content = <Settings />;
      break;
    case 'Customer Support':
      content = <Support />;
      break;
      case 'Subscription':
      content = <Subscription />;
      break;
    default:
      content = <div className="p-6 text-gray-500">Select a section from the sidebar.</div>;
  }

  return (
    <main className="flex-grow p-6 md:p-8 bg-slate-100 rounded-lg shadow-inner">
      <Outlet>
      {content}

      </Outlet>
    </main>
  );
};

const Main = () => {
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-50 text-gray-800">
      <Sidebar
        activeSection={activeSection}
        onSectionClick={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className="flex-grow flex flex-col p-4 md:p-8 md:ml-64 rounded-lg space-y-4 md:space-y-8">
        <Header onToggle={toggleSidebar} />
        <MainContent activeSection={activeSection} />
      </div>
    </div>
  );
};

export default Main;