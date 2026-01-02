import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Clock, ChevronRight, ArrowLeft, ShoppingCart, Heart } from "lucide-react";
import { useOptimizedCart } from "../../../hooks/useOptimizedCart";
import { useOptimizedWishlist } from "../../../hooks/useOptimizedWishlist";
import axios from "axios";
import { toast } from "react-hot-toast";

// VendorDetailPage
// Purpose: separate full page for a single vendor (restaurant/kitchen). Mobile-first, clear hierarchy:
// 1) Hero with image, name, rating, veg tag, area
// 2) Tabs: Menu (Daily thali) | Plans
// 3) Big, clear item cards for menu with large image, description, price + Add button
// 4) Plan cards for subscription plans (big image, price/day, duration, CTA)
// 5) Sticky bottom bar on mobile showing cart & checkout CTA

const VendorDetailPage = ({ backendUrl }) => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems, totalQuantity } = useOptimizedCart();
  const { wishlistItems, toggleWishlist, getHeartIconProps } = useOptimizedWishlist();

  const [vendor, setVendor] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' | 'plans'
  const BACKEND = backendUrl || (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api");

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    try {
      // 1) try vendor endpoint
      const vResp = await axios.get(`${BACKEND}/vendors/${vendorId}`);
      const v = vResp.data?.vendor || vResp.data || null;
      setVendor(v);

      // 2) fetch menu (products) filtered by vendor
      const pResp = await axios.get(`${BACKEND}/products`, { params: { limit: 200, vendor: vendorId } });
      const products = pResp.data?.products || pResp.data?.data?.products || [];
      // heuristics: filter thali-like items
      const menu = products.filter(p => {
        const t = (p.title || p.name || "").toLowerCase();
        return t.includes('thali') || t.includes('tiffin') || t.includes('meal') || p.tags?.some(tag => /thali|tiffin|meal|combo/.test(String(tag).toLowerCase()));
      });
      setMenuItems(menu);

      // 3) fetch plans endpoint (if exists)
      try {
        const planResp = await axios.get(`${BACKEND}/meal-plan`, { params: { vendorId: vendorId, status: 'active', limit: 50 } });
        const data = planResp.data?.data?.mealPlans || planResp.data?.mealPlans || planResp.data || [];
        setPlans(Array.isArray(data) ? data : []);
      } catch (e) { setPlans([]); }
    } catch (err) {
      console.error('Vendor fetch error', err);
      toast.error('Failed to load vendor');
    } finally {
      setLoading(false);
    }
  }, [vendorId, BACKEND]);

  useEffect(() => { fetchVendorData(); }, [fetchVendorData]);

  const handleAdd = async (item) => {
    try {
      const weight = item.weightOptions?.[0]?.weight || '1 plate';
      await addToCart(item._id, weight, 1);
      toast.success('Added to cart');
    } catch (e) { toast.error('Failed to add'); }
  };

  const isInWishlist = (id) => wishlistItems?.some(w => w._id === id || w.id === id) || false;

  if (loading) return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
      </div>
    </div>
  );

  if (!vendor) return (
    <div className="p-4 max-w-3xl mx-auto text-center">
      <p className="text-slate-600">Vendor not found.</p>
      <button onClick={() => navigate(-1)} className="mt-3 px-4 py-2 rounded-full bg-emerald-500 text-white">Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Hero */}
      <div className="relative">
        <img src={vendor.thumbnail || vendor.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200'} alt={vendor.name} className="w-full h-48 object-cover" />
        <button onClick={() => navigate(-1)} className="absolute left-3 top-3 bg-black/40 text-white p-2 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={() => toggleWishlist(vendor)} className="bg-white/90 p-2 rounded-full"><Heart className="w-4 h-4" /></button>
        </div>
        <div className="absolute left-4 bottom-4 bg-black/60 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2"><h2 className="font-semibold text-lg">{vendor.name}</h2><div className="flex items-center gap-1 bg-emerald-600 px-2 py-0.5 rounded text-sm"><Star className="w-3 h-3" />{(vendor.rating || 4.2).toFixed(1)}</div></div>
          <p className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />{vendor.area || vendor.address || 'Location not provided'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl p-2 flex gap-2">
          <button onClick={() => setActiveTab('menu')} className={`flex-1 py-2 rounded-xl font-semibold ${activeTab === 'menu' ? 'bg-emerald-500 text-white' : 'text-slate-700'}`}>Menu</button>
          <button onClick={() => setActiveTab('plans')} className={`flex-1 py-2 rounded-xl font-semibold ${activeTab === 'plans' ? 'bg-emerald-500 text-white' : 'text-slate-700'}`}>Plans</button>
        </div>

        {/* Menu list */}
        {activeTab === 'menu' ? (
          menuItems.length ? (
            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item._id} className="bg-white rounded-2xl p-3 flex gap-3 items-start">
                  <img src={item.images?.[0]?.url || item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'} className="w-28 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm">{item.title || item.name}</h3>
                      <div className="text-sm font-semibold">₹{item.weightOptions?.[0]?.price || item.price}</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description || item.shortDescription || ''}</p>

                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => handleAdd(item)} className="px-3 py-1 rounded-full bg-emerald-500 text-white font-semibold">Add</button>
                      <button onClick={() => navigate(`/products/${item._id}`)} className="px-3 py-1 rounded-full border">Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-600">No menu items found for this vendor.</div>
          )
        ) : (
          // Plans
          plans.length ? (
            <div className="space-y-3">
              {plans.map(plan => (
                <div key={plan._id || plan.id} className="bg-white rounded-2xl p-3">
                  <div className="flex items-start gap-3">
                    <img src={plan.imageUrls?.[0] || plan.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'} className="w-28 h-20 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{plan.title}</h3>
                        <div className="text-sm font-semibold">₹{plan.pricing?.oneDay ?? (plan.pricing?.[1]?.price / plan.pricing?.[1]?.totalthali) ?? '—'}/day</div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{plan.description || plan.shortDescription || ''}</p>
                      <div className="mt-3 flex items-center gap-2"><button onClick={() => navigate(`/thali-detail/${plan._id || plan.id}`)} className="px-3 py-2 rounded-full bg-emerald-500 text-white">View plan</button></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-600">No plans available</div>
          )
        )}
      </div>

      {/* Sticky bottom cart bar for mobile */}
      <div className="fixed left-0 right-0 bottom-0 z-50 p-3 bg-white border-t border-slate-100 shadow-sm md:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"> <ShoppingCart className="w-5 h-5 text-emerald-700" /> </div>
            <div>
              <div className="text-sm font-semibold">{totalQuantity || 0} items</div>
              <div className="text-xs text-slate-500">View cart & checkout</div>
            </div>
          </div>
          <button onClick={() => navigate('/cart')} className="px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold">Go to cart</button>
        </div>
      </div>

      {/* Desktop right-side sticky checkout (md and up) */}
      <div className="hidden md:block fixed right-6 bottom-6">
        <button onClick={() => navigate('/cart')} className="px-4 py-3 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> View cart ({totalQuantity || 0})</button>
      </div>

      <style>{`.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    </div>
  );
};

export default VendorDetailPage;
