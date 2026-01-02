import { LayoutDashboard, ShoppingBag, Truck, DollarSign, Users, Settings, Phone, Package, HeartHandshake, Menu, X, SubscriptIcon } from 'lucide-react';

const Header = ({ onToggle }) => {
  return (
    <header className="">
      <button onClick={onToggle} className="md:hidden text-gray-800 focus:outline-none">
        <Menu className="h-6 w-6" />
      </button>
      {/* <h2 className="text-2xl font-semibold text-gray-800">Admin Panel</h2>
      <div className="flex items-center">
        <span className="text-gray-600 mr-2">Admin User</span>
        <div className="h-8 w-8 rounded-full bg-slate-400"></div>
      </div> */}
    </header>
  );
};

export default Header