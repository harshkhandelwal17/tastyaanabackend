import { LayoutGrid, Package, ShoppingCart, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
const BottomNavBar = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const navItems = [
    { name: "Dashboard", path: "/seller/Dashboard", icon: LayoutGrid },
    { name: "Orders", path: "/seller/Orders", icon: Package },
    { name: "Products", path: "/seller/editprice", icon: ShoppingCart },
    { name: "Profile", path: "/seller/Profile", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] lg:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigate(`${item.path}`)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? "text-green-600"
                  : "text-slate-500 hover:text-green-500"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={`text-xs font-semibold mt-1 ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default BottomNavBar;
