// src/pages/checkout/CheckoutPage.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-hot-toast";

import {
  clearCart,
  fetchCart,
  setCartItems,
} from "../../redux/cartSlice";
import { createOrder, setLatestOrder } from "../../redux/orderSlice";

import { useCharges } from "../../hooks/useCharges";
import { useOrderNotifications } from "../../hooks/useNotificationActions";

import RazorpayPayment from "../../layout/RazorPayComponent";
import CouponInput from "../../components/CouponInput";

import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  CheckCircle,
  Truck,
  Clock,
  Star,
  Shield,
  Tag,
  MapPin,
  Phone,
  AlertCircle,
  CreditCard,
  Loader2,
  Navigation,
  Map,
  X,
  Home,
  User,
  Mail,
  Info,
  Zap,
  AlertTriangle,
} from "lucide-react";

import {
  GoogleMap,
  Marker,
  LoadScript,
  StandaloneSearchBox,
} from "@react-google-maps/api";

/* ---------------------- Google Maps Config ---------------------- */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "450px",
};
const defaultCenter = {
  lat: 22.7196, // Indore
  lng: 75.8577,
};
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

/* ---------------------- Selectors ---------------------- */

const selectAuthState = (state) => state.auth;
const selectOrdersState = (state) => state.orders;
const selectCartSlice = (state) => state.cart;

const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth?.user || null
);

const selectCartItems = createSelector(
  [selectCartSlice],
  (cart) => cart?.items || []
);

const selectUserAddresses = createSelector(
  [selectUser],
  (user) => user?.addresses || []
);

const selectOrdersData = createSelector([selectOrdersState], (orders) => ({
  loading: orders?.loading || false,
  error: orders?.error || null,
  items: orders?.items || [],
  createLoading: orders?.createLoading || false,
  createError: orders?.createError || null,
}));

/* ---------------------- Map Location Selector ---------------------- */

const MapLocationSelector = ({ onClose, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchBox, setSearchBox] = useState(null);
  const [addressPreview, setAddressPreview] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const handleMapClick = async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };

    setSelectedLocation(location);
    setIsLoadingAddress(true);
    setAddressPreview("Getting address...");

    try {
      // Try Google Geocoding first
      if (GOOGLE_MAPS_API_KEY) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=en`
        );
        const data = await res.json();

        if (data.status === "OK" && data.results?.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components;

          const getComponent = (types) => {
            const comp = addressComponents.find((c) =>
              types.some((t) => c.types.includes(t))
            );
            return comp ? comp.long_name : "";
          };

          const city = getComponent([
            "locality",
            "administrative_area_level_2",
            "postal_town",
          ]);
          const state = getComponent(["administrative_area_level_1"]);
          const pincode = getComponent(["postal_code"]);

          setAddressPreview(result.formatted_address);

          onLocationSelect?.({
            latitude: lat,
            longitude: lng,
            locationName: result.formatted_address,
            address: result.formatted_address,
            city,
            state,
            pincode,
          });

          setIsLoadingAddress(false);
          return;
        }
      }

      // Fallback: OpenStreetMap / Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
        {
          headers: {
            "User-Agent": "OnlineStore/1.0 (food delivery app)",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || "";
        const state = address.state || "";
        const pincode = address.postcode || "";

        setAddressPreview(data.display_name);

        onLocationSelect?.({
          latitude: lat,
          longitude: lng,
          locationName: data.display_name,
          address: data.display_name,
          city,
          state,
          pincode,
        });
      }
    } catch (err) {
      console.error("Error getting address:", err);
      setAddressPreview("Unable to get address for this location");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const onSearchBoxLoad = useCallback((ref) => setSearchBox(ref), []);

  const onPlacesChanged = () => {
    if (!searchBox) return;
    const places = searchBox.getPlaces();
    if (!places || !places.length) return;

    const place = places[0];
    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setSelectedLocation(location);
    setMapCenter(location);

    handleMapClick({
      latLng: {
        lat: () => location.lat,
        lng: () => location.lng,
      },
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setSelectedLocation(location);
        setMapCenter(location);

        handleMapClick({
          latLng: {
            lat: () => location.lat,
            lng: () => location.lng,
          },
        });
      },
      (err) => {
        console.error("Location error:", err);
        toast.error("Unable to get your location");
      }
    );
  };

  const confirmLocation = () => {
    if (!selectedLocation) {
      toast.error("Please select a location on the map");
      return;
    }
    onClose();
    toast.success("Location selected successfully");
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Google Maps Not Configured
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              API key missing. Please enter address manually.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Select Delivery Location
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search + current location */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-2">
              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                libraries={libraries}
              >
                <StandaloneSearchBox
                  onLoad={onSearchBoxLoad}
                  onPlacesChanged={onPlacesChanged}
                >
                  <input
                    type="text"
                    placeholder="Search for a place in Indore..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </StandaloneSearchBox>
              </LoadScript>
              <button
                onClick={getCurrentLocation}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Use Current Location
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Zoom & click on the map where you want your order delivered.
            </p>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <LoadScript
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={13}
                onClick={handleMapClick}
                options={mapOptions}
              >
                {selectedLocation && (
                  <Marker
                    position={selectedLocation}
                    draggable
                    onDragEnd={handleMapClick}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Selected info */}
          {selectedLocation && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-800">
                    Selected Location
                  </p>
                  <p className="text-emerald-700">
                    Lat: {selectedLocation.lat.toFixed(5)}, Lng:{" "}
                    {selectedLocation.lng.toFixed(5)}
                  </p>
                  {addressPreview && !isLoadingAddress && (
                    <p className="mt-1 text-emerald-700">
                      <span className="font-medium">Address:</span>{" "}
                      {addressPreview}
                    </p>
                  )}
                  {isLoadingAddress && (
                    <p className="mt-1 text-emerald-700">
                      Resolving address...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmLocation}
              disabled={!selectedLocation}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Main Checkout Page ---------------------- */

const DEFAULT_SLOTS = [
  {
    id: "morning",
    label: "Morning (9 AM - 12 PM)",
    startTime: "09:00",
    endTime: "12:00",
    deliveryCharge: 20,
  },
  {
    id: "afternoon",
    label: "Afternoon (12 PM - 4 PM)",
    startTime: "12:00",
    endTime: "16:00",
    deliveryCharge: 20,
  },
  {
    id: "evening",
    label: "Evening (7 PM - 8 PM)",
    startTime: "19:00",
    endTime: "20:00",
    deliveryCharge: 0,
  },
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const cartItems = useSelector(selectCartItems);
  const userAddresses = useSelector(selectUserAddresses);
  const { items: _, loading: cartLoading, error: cartError, isInitialized } =
  useSelector(selectCartSlice);
  const {
    loading: orderLoading,
    error: orderError,
    createLoading,
    createError,
  } = useSelector(selectOrdersData);

  const { sendOrderConfirmation } = useOrderNotifications();

  const {
    charges,
    loading: chargesLoading,
    error: chargesError,
    getApplicableCharges,
    getChargesBreakdown,
  } = useCharges();

  // UI state
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [codLoading, setCodLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(DEFAULT_SLOTS);
  const [selectedSlotDeliveryCharge, setSelectedSlotDeliveryCharge] =
    useState(DEFAULT_SLOTS[0].deliveryCharge);

  // Coupon state (driven by CouponInput)
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMode: "COD",
    selectedAddress: null,
    deliveryInstructions: "",
    selectedSlotId: null,
    preferredDeliveryTime: "",
    latitude: null,
    longitude: null,
    locationName: "",
    useCurrentLocation: false,
  });

  const [formErrors, setFormErrors] = useState({});

  // Simple Indore check
  const checkIfOutsideIndore = useCallback((city, state) => {
    const c = city?.toLowerCase().trim();
    const s = state?.toLowerCase().trim();

    if (!c || !s) return false;
    if (s !== "madhya pradesh") return true;
    if (c !== "indore") return true;

    return false;
  }, []);

  // Global time restriction (12 AM - 6 AM)
  const isOrderingAllowed = useCallback(() => {
    const now = new Date();
    const hr = now.getHours();
    return !(hr >= 0 && hr < 6);
  }, []);

  /* ---------------------- Totals & Charges ---------------------- */

  const baseSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const chargesFetchedRef = useRef(false);
  const lastCartHashRef = useRef("");
  const summaryRef = useRef(null);

  const cartHash = useMemo(
    () =>
      cartItems
        .map((i) => `${i._id || i.id}-${i.quantity}-${i.price}`)
        .join("|"),
    [cartItems]
  );

  useEffect(() => {
    if (cartItems.length === 0) return;
    if (cartHash === lastCartHashRef.current && chargesFetchedRef.current)
      return;

    lastCartHashRef.current = cartHash;
    chargesFetchedRef.current = true;
    getApplicableCharges(cartItems, baseSubtotal);
  }, [cartItems, baseSubtotal, cartHash, getApplicableCharges]);

  const orderTotals = useMemo(() => {
    const subtotalValue = baseSubtotal;

    let discount = appliedCoupon?.discount || 0;

    let breakdown = {
      rainCharges: 0,
      packingCharges: 0,
      taxes: 0,
      deliveryCharges: selectedSlotDeliveryCharge,
      serviceCharges: 0,
      handlingCharges: 0,
      total: selectedSlotDeliveryCharge,
    };

    if (charges && charges.length > 0) {
      const original = getChargesBreakdown(charges);
      const oldDelivery = original.deliveryCharges;

      breakdown = {
        ...original,
        deliveryCharges: selectedSlotDeliveryCharge,
        total:
          original.total - (oldDelivery || 0) + selectedSlotDeliveryCharge,
      };
    } else {
      // fallback default
      const packing = 15;
      const tax = 15;
      const service = 10;
      const handling = 12;
      breakdown = {
        rainCharges: 0,
        packingCharges: packing,
        taxes: tax,
        deliveryCharges: selectedSlotDeliveryCharge,
        serviceCharges: service,
        handlingCharges: handling,
        total: packing + tax + service + handling + selectedSlotDeliveryCharge,
      };
    }

    const totalValue = Math.max(
      0,
      Math.round((subtotalValue + breakdown.total - discount) * 100) / 100
    );

    return {
      subtotal: subtotalValue,
      tax: breakdown.taxes,
      chargesTotal: breakdown.total,
      chargesBreakdown: breakdown,
      total: totalValue,
      discount,
    };
  }, [
    baseSubtotal,
    appliedCoupon,
    charges,
    getChargesBreakdown,
    selectedSlotDeliveryCharge,
  ]);

  const { subtotal, total, discount, chargesBreakdown } = orderTotals;

  const isFormValid = useMemo(() => {
    const emailOk = formData.email && /\S+@\S+\.\S+/.test(formData.email);
    const phoneDigits = formData.phone?.replace(/[^\d]/g, "") || "";
    const phoneOk = phoneDigits.length === 10;
    const addrOk = formData.address && formData.address.trim().length >= 10;
    const cityOk = formData.city;
    const stateOk = formData.state;
    const pinOk = formData.pincode && /^\d{6}$/.test(formData.pincode);
    const slotOk = !!formData.selectedSlotId;

    return (
      emailOk && phoneOk && addrOk && cityOk && stateOk && pinOk && slotOk
    );
  }, [formData]);

  /* ---------------------- Cart Init & User Prefill ---------------------- */

  useEffect(() => {
    const initCart = async () => {
      setIsCartLoading(true);
      try {
        if (!isInitialized && cartItems.length === 0) {
          const saved = localStorage.getItem("checkoutCart");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length) {
                dispatch(setCartItems(parsed));
                setIsCartLoading(false);
                return;
              }
            } catch {
              localStorage.removeItem("checkoutCart");
            }
          }

          if (user) {
            try {
              await dispatch(fetchCart()).unwrap();
            } catch (err) {
              console.error("Error fetching cart:", err);
            }
          }
        }
      } finally {
        setIsCartLoading(false);
      }
    };

    initCart();
  }, [dispatch, user, isInitialized, cartItems.length]);

  // Prefill user email/phone/address
  useEffect(() => {
    if (!user) return;

    const defaultAddress =
      userAddresses.find((a) => a.isDefault) || userAddresses[0];

    setFormData((prev) => ({
      ...prev,
      email: user.email || "",
      phone: user.phone?.toString() || user.mobile || "",
      address: defaultAddress?.line1 || defaultAddress?.address || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      pincode: defaultAddress?.pincode || defaultAddress?.zipcode || "",
      selectedAddress: defaultAddress?._id || null,
    }));
  }, [user, userAddresses]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          message: "Please log in to proceed with checkout",
          returnUrl: "/checkout",
        },
      });
    }
  }, [user, navigate]);

  // Header shadow scroll
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Slot list (we keep only default slots + quick)
  useEffect(() => {
    setAvailableSlots(DEFAULT_SLOTS);
    setSelectedSlotDeliveryCharge(DEFAULT_SLOTS[0].deliveryCharge);
  }, []);

  // Detect mobile viewport for simplified UI & sticky summary bar
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------------------- Form Helpers ---------------------- */

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.email) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    const phoneDigits = formData.phone.replace(/[^\d]/g, "");
    if (!formData.phone) {
      errors.phone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      errors.phone = "Phone number must be 10 digits";
    }

    if (!formData.address || formData.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters";
    }

    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";

    if (!formData.pincode) {
      errors.pincode = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "PIN code must be 6 digits";
    }

    if (
      formData.city &&
      formData.state &&
      checkIfOutsideIndore(formData.city, formData.state)
    ) {
      errors.location = "We currently only deliver in Indore, Madhya Pradesh.";
    }

    if (!formData.selectedSlotId) {
      errors.slotSelection = "Please select a delivery slot";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, checkIfOutsideIndore]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        if (name === "city" || name === "state") delete copy.location;
        return copy;
      });
    },
    [setFormData]
  );

  const handleSlotSelection = useCallback((slot) => {
    setFormData((prev) => ({
      ...prev,
      selectedSlotId: slot.id,
      preferredDeliveryTime: `${slot.startTime}-${slot.endTime}`,
    }));
    setSelectedSlotDeliveryCharge(slot.deliveryCharge || 0);
    toast.success(`Slot selected: ${slot.label}`, { duration: 1500 });
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.slotSelection;
      return copy;
    });
  }, []);

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.locationName,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      useCurrentLocation: false,
    }));

    if (checkIfOutsideIndore(loc.city, loc.state)) {
      setFormErrors((prev) => ({
        ...prev,
        location: `Selected location: ${loc.city}, ${loc.state}. We currently only deliver in Indore, Madhya Pradesh.`,
      }));
    } else {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.location;
        return copy;
      });
    }
  };

  /* ---------------------- Current Location (GPS) ---------------------- */

  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    setFormErrors((prev) => ({ ...prev, location: null }));

    if (!navigator.geolocation) {
      setLocationLoading(false);
      setFormErrors((prev) => ({
        ...prev,
        location: "Geolocation not supported on this device",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en`
          );

          if (!resp.ok) throw new Error("Google Geocoding failed");
          const data = await resp.json();

          if (data.status === "OK" && data.results?.length > 0) {
            const result = data.results[0];
            const components = result.address_components;

            const getComp = (types) => {
              const c = components.find((comp) =>
                types.some((t) => comp.types.includes(t))
              );
              return c ? c.long_name : "";
            };

            const city =
              getComp([
                "locality",
                "administrative_area_level_2",
                "postal_town",
              ]) || "";
            const state = getComp(["administrative_area_level_1"]);
            const pincode = getComp(["postal_code"]);

            const formatted = result.formatted_address;

            if (checkIfOutsideIndore(city, state)) {
              setFormErrors((prev) => ({
                ...prev,
                location: `Detected: ${city}, ${state}. We currently only deliver in Indore, Madhya Pradesh.`,
              }));
              setLocationLoading(false);
              return;
            }

            setFormData((prev) => ({
              ...prev,
              latitude,
              longitude,
              locationName: formatted,
              address: formatted,
              city,
              state,
              pincode,
              useCurrentLocation: true,
            }));

            setFormErrors((prev) => {
              const copy = { ...prev };
              delete copy.location;
              return copy;
            });

            setLocationSuccess(true);
            setTimeout(() => setLocationSuccess(false), 3000);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          setFormErrors((prev) => ({
            ...prev,
            location:
              "Location detected but address could not be resolved. Please verify city and state manually.",
          }));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
        setFormErrors((prev) => ({
          ...prev,
          location:
            "Unable to get your location. Please enter address manually.",
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, [checkIfOutsideIndore]);

  /* ---------------------- COD Submit ---------------------- */

  const handleCODSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (codLoading) return;

      if (!isOrderingAllowed()) {
        toast.error("Orders not allowed between 12:00 AM and 6:00 AM.");
        return;
      }

      if (!validateForm()) {
        const firstField = Object.keys(formErrors)[0];
        if (firstField) {
          const el = document.querySelector(`[name="${firstField}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          }
        }
        return;
      }

      if (!cartItems.length) {
        toast.error("Your cart is empty");
        return;
      }

      setCodLoading(true);
      try {
        const orderPayload = {
          customer: {
            userId: user._id,
            name: user.name || `${user.firstName || ""} ${user.lastName || ""}`,
            email: formData.email,
            phone: formData.phone,
          },
          shippingAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: "India",
            ...(formData.latitude &&
              formData.longitude && {
                coordinates: {
                  lat: parseFloat(formData.latitude),
                  lng: parseFloat(formData.longitude),
                },
              }),
          },
          items: cartItems.map((item) => ({
            productId: item._id || item.id || item.product?._id,
            name:
              item.name || item.product?.name || item.title || "Unknown Item",
            quantity: parseInt(item.quantity || 1, 10),
            price: parseFloat(item.price || 0),
            weight: item.weight || item.selectedWeight || "500g",
            image:
              item.images?.[0]?.url ||
              item.image ||
              item.product?.images?.[0]?.url ||
              item.product?.images?.[0] ||
              null,
            category: item.category || item.product?.category || "sweets",
            seller: item?.product?.seller,
          })),
          payment: {
            method: formData.paymentMode,
            status: "pending",
            amount: total,
          },
          orderSummary: {
            subtotal,
            shipping: chargesBreakdown.deliveryCharges,
            tax: chargesBreakdown.taxes,
            charges: chargesBreakdown.total,
            chargesBreakdown,
            total,
            itemCount: cartItems.reduce(
              (c, item) => c + (item.quantity || 0),
              0
            ),
          },
          couponCode: appliedCoupon?.coupon?.code || null,
          couponId: appliedCoupon?.coupon?.id || null,
          discountAmount: appliedCoupon?.discount || 0,
          deliveryCharges: chargesBreakdown.deliveryCharges,
          packagingCharges: chargesBreakdown.packingCharges,
          serviceCharges: chargesBreakdown.serviceCharges,
          handlingCharges: chargesBreakdown.handlingCharges,
          rainCharges: chargesBreakdown.rainCharges,
          deliveryInstructions: formData.deliveryInstructions || "",
          preferredDeliveryTime: formData.preferredDeliveryTime || "anytime",
          selectedSlotId: formData.selectedSlotId,
          orderSource: "web",
          orderType: "delivery",
          status: "confirmed",
        };

        const resultData = await dispatch(createOrder(orderPayload)).unwrap();
        const order = resultData.order;

        dispatch(setLatestOrder(resultData));

        // send app notification
        sendOrderConfirmation({
          id: order._id || order.orderNumber,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          estimatedDelivery: order.estimatedDelivery,
          items: order.items || cartItems,
          customerName: user?.name || "Customer",
        });

        try {
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/cart/clear`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              withCredentials: true,
            }
          );
        } catch (err) {
          console.error("Cart clear error:", err);
        }

        dispatch(clearCart());
        localStorage.removeItem("checkoutCart");

        navigate("/orders", {
          state: {
            orderId: order._id || order.orderId,
            orderNumber: order.orderNumber,
            total: order.orderSummary?.total || total,
            items: cartItems.length,
            estimatedDelivery: order.estimatedDelivery,
            paymentMethod: formData.paymentMode,
          },
        });
      } catch (err) {
        console.error("Order creation failed:", err);
        toast.error("Order failed. Please try again.");
      } finally {
        setCodLoading(false);
      }
    },
    [
      codLoading,
      isOrderingAllowed,
      validateForm,
      formErrors,
      cartItems,
      user,
      formData,
      total,
      subtotal,
      chargesBreakdown,
      appliedCoupon,
      dispatch,
      navigate,
      sendOrderConfirmation,
    ]
  );

  /* ---------------------- Razorpay Success / Failure ---------------------- */

  const orderDataForRazorpay = useMemo(() => {
    if (!isFormValid || !cartItems.length) return null;

    return {
      totalAmount: total,
      subtotal,
      discount,
      tax: chargesBreakdown.taxes,
      shipping: chargesBreakdown.deliveryCharges,
      charges: chargesBreakdown.total,
      chargesBreakdown,
      couponCode: appliedCoupon?.coupon?.code || null,
      couponId: appliedCoupon?.coupon?.id || null,
      discountAmount: appliedCoupon?.discount || 0,
      items: cartItems.map((item) => ({
        productId: item?.product?._id || item.id || item._id,
        name:
          item?.product?.name ||
          item.name ||
          item.title ||
          item.productName ||
          "Unknown Item",
        quantity: parseInt(item.quantity || 1, 10),
        price: parseFloat(item.price || 0),
        weight: item.weight || item.selectedWeight || "500g",
        image: item?.product?.images?.[0]?.url || item.image || null,
        category: item?.product?.category || "sweets",
        seller: item?.product?.seller,
      })),
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deliverySlot: formData.preferredDeliveryTime || "anytime",
      specialInstructions: formData.deliveryInstructions,
      isAutoOrder: false,
    };
  }, [
    isFormValid,
    cartItems,
    total,
    subtotal,
    discount,
    chargesBreakdown,
    appliedCoupon,
    formData.preferredDeliveryTime,
    formData.deliveryInstructions,
  ]);

  const customerDetailsForRazorpay = useMemo(() => {
    if (!isFormValid || !user) return null;

    return {
      name: user?.name || `${user.firstName || ""} ${user.lastName || ""}`,
      email: formData.email,
      phone: formData.phone,
      shippingAddress: {
        line1: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: "India",
      },
      ...(formData.latitude &&
        formData.longitude && {
          coordinates: {
            lat: parseFloat(formData.latitude),
            lng: parseFloat(formData.longitude),
          },
        }),
    };
  }, [isFormValid, user, formData]);

  const handlePaymentSuccess = useCallback(
    async (order) => {
      if (!isOrderingAllowed()) {
        toast.error("Orders not allowed between 12:00 AM and 6:00 AM.");
        return;
      }

      try {
        // Clear backend cart
        try {
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/cart/clear`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              withCredentials: true,
            }
          );
        } catch (err) {
          console.error("Error clearing cart:", err);
        }

        dispatch(clearCart());
        localStorage.removeItem("checkoutCart");

        navigate("/orders", {
          state: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            total: order.totalAmount,
            items: cartItems.length,
            estimatedDelivery: order.estimatedDelivery,
            paymentMethod: "razorpay",
          },
        });
      } catch (err) {
        console.error("Payment success handling error:", err);
      }
    },
    [dispatch, navigate, cartItems.length, isOrderingAllowed]
  );

  const handlePaymentFailure = useCallback((resp) => {
    if (resp?.error?.description) {
      toast.error(`Payment failed: ${resp.error.description}`);
    } else {
      toast.error("Payment failed. Please try again.");
    }
  }, []);

  /* ---------------------- Guard States ---------------------- */

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isCartLoading || (!isInitialized && cartItems.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!cartItems.length && isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-4">
            Add some tasty items before proceeding to checkout.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const totalItems = cartItems.reduce(
    (count, item) => count + (item.quantity || 0),
    0
  );

  /* ---------------------- UI ---------------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-md"
            : "bg-white shadow-sm"
        }`}
      >
        {/* Top secure strip */}
        <div className="bg-emerald-600 text-white py-1.5 text-center text-xs sm:text-sm">
          <span className="inline-flex items-center justify-center">
            <Shield className="w-3 h-3 mr-1" />
            Secure checkout • SSL encrypted
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900">
                    Secure Checkout
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    {totalItems} item{totalItems > 1 ? "s" : ""} • ₹
                    {total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-28 pb-28 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(orderError || createError || cartError) && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>
                <strong className="font-semibold">Error: </strong>
                {createError || orderError || cartError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account info */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Account Information
                      </h2>
                      <p className="text-xs text-emerald-700">
                        Logged in as {user?.name || user?.firstName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        <Mail className="w-3 h-3 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                          formErrors.email
                            ? "border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                        placeholder="your@email.com"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        <Phone className="w-3 h-3 inline mr-1" />
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                          formErrors.phone
                            ? "border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                        placeholder="10-digit mobile number"
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Location services */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Delivery Location
                      </h2>
                      <p className="text-xs text-blue-700">
                        Use GPS or map for accurate delivery
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading || codLoading}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 text-sm hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <span className="font-medium text-emerald-700">
                            Getting location...
                          </span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-gray-700">
                            Use Current Location
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      disabled={codLoading}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 text-sm hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"
                    >
                      <Map className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">
                        Select on Map
                      </span>
                    </button>
                  </div>

                  {locationSuccess && (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Location detected & filled successfully
                    </div>
                  )}

                  {formData.latitude && formData.longitude && (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {formData.useCurrentLocation
                              ? "Current location"
                              : "Selected on map"}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 rounded-full text-[10px] uppercase font-semibold">
                            {formData.useCurrentLocation ? "GPS" : "Manual"}
                          </span>
                        </div>
                        {formData.locationName && (
                          <p className="mt-1">{formData.locationName}</p>
                        )}
                        <p className="mt-1 text-emerald-700">
                          Co-ordinates:{" "}
                          {parseFloat(formData.latitude).toFixed(4)},{" "}
                          {parseFloat(formData.longitude).toFixed(4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: null,
                            longitude: null,
                            locationName: "",
                            useCurrentLocation: false,
                          }));
                          setFormErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.location;
                            return copy;
                          });
                        }}
                        className="p-1 text-emerald-700 hover:text-emerald-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {formErrors.location && (
                    <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <span>{formErrors.location}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Address */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Delivery Address
                      </h2>
                      <p className="text-xs text-orange-700">
                        Make sure this is where you want your food delivered
                      </p>
                    </div>
                  </div>
                  {userAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="text-xs font-semibold text-orange-700 underline"
                    >
                      Saved ({userAddresses.length})
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Complete Address *
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                        formErrors.address
                          ? "border-red-500"
                          : "border-gray-200 focus:border-emerald-500"
                      }`}
                      placeholder="Flat / House No., Building, Area, Landmark"
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                          formErrors.city
                            ? "border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                        placeholder="Indore"
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        State *
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                          formErrors.state
                            ? "border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                      >
                        <option value="">Select State</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                      </select>
                      {formErrors.state && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className={`w-full p-2.5 text-sm rounded-xl border-2 outline-none focus:ring-4 focus:ring-emerald-500/15 ${
                          formErrors.pincode
                            ? "border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                        placeholder="452001"
                      />
                      {formErrors.pincode && (
                        <p className="mt-1 text-xs text-red-600">
                          {formErrors.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.city &&
                    formData.state &&
                    checkIfOutsideIndore(formData.city, formData.state) &&
                    !formErrors.location && (
                      <div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            Service area notice
                          </p>
                          <p>
                            We currently only deliver in Indore, Madhya
                            Pradesh.
                          </p>
                        </div>
                      </div>
                    )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      rows={2}
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      className="w-full p-2.5 text-sm rounded-xl border-2 border-gray-200 outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500"
                      placeholder="Example: Call on arrival, leave at gate, etc."
                    />
                  </div>

                  {/* Delivery slots */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Delivery Time Slot *
                    </label>

                    {/* Quick Delivery */}
                    <div
                      onClick={() =>
                        handleSlotSelection({
                          id: "quick",
                          label: "Quick Delivery (within 30 min)",
                          startTime: "ASAP",
                          endTime: "Within 30 min",
                          deliveryCharge: 10,
                        })
                      }
                      className={`p-3 rounded-xl border cursor-pointer mb-3 text-sm transition-all ${
                        formData.selectedSlotId === "quick"
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Quick Delivery
                            </p>
                            <p className="text-xs text-gray-600">
                              As soon as possible – usually within 30 minutes
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-800">
                          +₹10
                        </span>
                      </div>
                    </div>

                    {/* Scheduled slots */}
                    <p className="text-xs text-gray-500 mb-1">
                      Or schedule for later:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotSelection(slot)}
                          className={`p-3 rounded-xl border cursor-pointer text-sm transition-all ${
                            formData.selectedSlotId === slot.id
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                              : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {slot.label}
                              </p>
                              <p className="text-xs text-gray-600">
                                {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                            <div>
                              {slot.deliveryCharge > 0 ? (
                                <span className="text-xs font-medium text-gray-800">
                                  +₹{slot.deliveryCharge}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-emerald-700">
                                  Free
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {formData.selectedSlotId && (
                      <p className="mt-1 text-xs text-emerald-700">
                        Selected:{" "}
                        {formData.selectedSlotId === "quick"
                          ? "Quick Delivery"
                          : availableSlots.find(
                              (s) => s.id === formData.selectedSlotId
                            )?.label || ""}
                      </p>
                    )}

                    {formErrors.slotSelection && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.slotSelection}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Payment method */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Payment Method
                      </h2>
                      <p className="text-xs text-purple-700">
                        Choose how you want to pay
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer text-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="COD"
                      checked={formData.paymentMode === "COD"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Cash on Delivery (COD)
                        </p>
                        <p className="text-xs text-gray-600">
                          Pay in cash when your order arrives
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer text-sm hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="online"
                      checked={formData.paymentMode === "online"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Online Payment
                        </p>
                        <p className="text-xs text-gray-600">
                          Pay via UPI, cards, net banking, wallets
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Right: order summary */}
            <aside className="lg:sticky lg:top-28 h-fit">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        Order Summary
                      </h2>
                      <p className="text-xs text-emerald-700">
                        {totalItems} item{totalItems > 1 ? "s" : ""} in your
                        cart
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Items preview */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl"
                      >
                        <img
                          src={
                            Array.isArray(item?.product?.images)
                              ? item.product.images[0]?.url ||
                                item.product.images[0]
                              : item?.product?.images ||
                                item.image ||
                                "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=200&h=200&fit=crop&crop=center"
                          }
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/48x48/f3f4f6/6b7280?text=Item";
                          }}
                          alt={item.name || item.product?.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {item.name || item.product?.name || item.title}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            {item.weight || item.unit} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div>
                    <CouponInput
                      onCouponApplied={(data) => {
                        setAppliedCoupon(data);
                        setCouponError("");
                      }}
                      onCouponRemoved={() => {
                        setAppliedCoupon(null);
                        setCouponError("");
                      }}
                      orderAmount={subtotal}
                      orderItems={cartItems}
                      disabled={codLoading || createLoading}
                    />
                    {couponError && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2 text-sm">
                    {chargesLoading && (
                      <div className="flex items-center justify-center text-xs text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Calculating charges...
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        ₹{subtotal.toLocaleString()}
                      </span>
                    </div>

                    {chargesError && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        Error loading charges. Showing defaults.
                      </div>
                    )}

                    {chargesBreakdown.rainCharges > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          Rain charges
                        </span>
                        <span>
                          ₹{chargesBreakdown.rainCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {chargesBreakdown.packingCharges > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-500" />
                          Packing
                        </span>
                        <span>
                          ₹{chargesBreakdown.packingCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {chargesBreakdown.taxes > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Info className="w-3 h-3 text-purple-500" />
                          Taxes
                        </span>
                        <span>
                          ₹{chargesBreakdown.taxes.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {chargesBreakdown.deliveryCharges > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Truck className="w-3 h-3 text-indigo-500" />
                          Delivery
                        </span>
                        <span>
                          ₹{chargesBreakdown.deliveryCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {chargesBreakdown.serviceCharges > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 text-pink-500" />
                          Service
                        </span>
                        <span>
                          ₹{chargesBreakdown.serviceCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {chargesBreakdown.handlingCharges > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3 text-indigo-500" />
                          Handling
                        </span>
                        <span>
                          ₹{chargesBreakdown.handlingCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {appliedCoupon
                            ? `Discount (${appliedCoupon.coupon.code})`
                            : "Discount"}
                        </span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3 mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        Total to pay
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Place order / Pay button */}
                  <div className="space-y-2">
                    {formData.paymentMode === "online" ? (
                      <>
                        {orderDataForRazorpay &&
                        customerDetailsForRazorpay &&
                        Object.keys(formErrors).length === 0 &&
                        isOrderingAllowed() ? (
                          <RazorpayPayment
                            orderData={orderDataForRazorpay}
                            customerDetails={customerDetailsForRazorpay}
                            onSuccess={handlePaymentSuccess}
                            onFailure={handlePaymentFailure}
                            disabled={!isFormValid || !cartItems.length}
                          />
                        ) : (
                          <button
                            type="button"
                            className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {isOrderingAllowed()
                              ? `Fix ${
                                  Object.keys(formErrors).length || 1
                                } error${
                                  Object.keys(formErrors).length === 1
                                    ? ""
                                    : "s"
                                } to pay online`
                              : "Orders unavailable (12 AM - 6 AM)"}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCODSubmit}
                        disabled={
                          createLoading ||
                          orderLoading ||
                          codLoading ||
                          !isOrderingAllowed()
                        }
                        className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                          Object.keys(formErrors).length === 0 &&
                          isOrderingAllowed()
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-red-500 text-white hover:bg-red-600"
                        } ${
                          createLoading ||
                          orderLoading ||
                          codLoading ||
                          !isOrderingAllowed()
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {createLoading || orderLoading || codLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating order...
                          </>
                        ) : !isOrderingAllowed() ? (
                          <>
                            <Clock className="w-4 h-4" />
                            Orders unavailable (12 AM - 6 AM)
                          </>
                        ) : Object.keys(formErrors).length === 0 ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Place Order – ₹{total.toLocaleString()}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Fix {Object.keys(formErrors).length} error
                            {Object.keys(formErrors).length > 1 ? "s" : ""}{" "}
                            first
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100 text-center">
                    <div>
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Shield className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[11px] text-gray-600">Secure</p>
                    </div>
                    <div>
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Truck className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-gray-600">
                        Fast delivery
                      </p>
                    </div>
                    <div>
                      <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                        <Phone className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-[11px] text-gray-600">
                        Support available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Address modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Select Address
                </h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {userAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        address: addr.line1 || addr.address,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode || addr.zipcode,
                        selectedAddress: addr._id,
                      }));
                      setShowAddressModal(false);
                    }}
                    className={`p-3 rounded-xl border-2 cursor-pointer text-sm ${
                      formData.selectedAddress === addr._id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {addr.line1 || addr.address}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {addr.city}, {addr.state} -{" "}
                          {addr.pincode || addr.zipcode}
                        </p>
                      </div>
                      {addr.isDefault && (
                        <span className="self-start px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {userAddresses.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No saved addresses found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map modal */}
      {showMapModal && (
        <MapLocationSelector
          onClose={() => setShowMapModal(false)}
          onLocationSelect={handleLocationSelect}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
