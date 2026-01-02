// =================================================================
// 0. BOILERPLATE - LIBRARIES & ICONS
// In a real app, these would be at the top of their respective files.
// =================================================================

// Redux Toolkit Imports
const { configureStore } = RTK;
const { createApi } = RTKQuery;
const { Provider, useSelector, useDispatch } = ReactRedux;

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Lucide Icons
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  User,
  Store,
  ShieldCheck,
  BarChart,
  Bell,
  MessageSquare,
  Star,
  AlertTriangle,
  PackageCheck,
  DollarSign,
  ListOrdered,
  PlusCircle,
  Tag,
  Send,
  FileDown,
  Power,
  PowerOff,
  Lightbulb,
  ChevronRight,
  CalendarClock,
  TrendingUp,
  RadioTower,
  Users as UsersIcon,
  MoreVertical,
  Search,
  LogOut,
  BellRing,
  CheckCircle,
  Clock,
  Truck,
  Loader2,
  X,
} from "lucide-react";

// =================================================================
// File: src/api/firebase.js
// =================================================================

const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =================================================================
// File: src/api/sellerApi.js
// =================================================================

const sellerApi = createApi({
  reducerPath: "sellerApi",
  baseQuery: async ({ fn, args }) => {
    try {
      const result = await fn(args);
      return { data: result };
    } catch (error) {
      return { error: { status: "CUSTOM_ERROR", data: error.message } };
    }
  },
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUser: builder.query({
      queryFn: async ({ userId }) => {
        if (!userId) throw new Error("User ID is required.");
        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "data"
        );
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          return userDoc.data();
        } else {
          const defaultUserData = {
            name: "Ankit Singh",
            email: "ankit.singh@example.com",
            storeName: "Ankit's Fresh Produce",
            avatar: "https://via.placeholder.com/150/4ade80/ffffff?text=A",
          };
          await setDoc(userDocRef, defaultUserData);
          return defaultUserData;
        }
      },
      providesTags: ["User"],
    }),
    updateUser: builder.mutation({
      queryFn: async ({ userId, data }) => {
        if (!userId) throw new Error("User ID is required.");
        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "data"
        );
        await updateDoc(userDocRef, data);
        return { ...data };
      },
      invalidatesTags: ["User"],
    }),
  }),
});

// Export hooks for use in components
const { useGetUserQuery, useUpdateUserMutation } = sellerApi;

// =================================================================
// File: src/store.js
// =================================================================

const store = configureStore({
  reducer: {
    [sellerApi.reducerPath]: sellerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sellerApi.middleware),
});

// =================================================================
// File: src/context/AuthContext.js
// =================================================================

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          if (
            typeof __initial_auth_token !== "undefined" &&
            __initial_auth_token
          ) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// =================================================================
// File: src/pages/Orders.jsx
// =================================================================

// =================================================================
// File: src/pages/Dashboard.jsx
// =================================================================

// =================================================================
// File: src/components/BottomNavBar.jsx
// =================================================================

// =================================================================
// File: src/App.jsx (Main Entry Point)
// =================================================================

const AppContent = () => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState("seller");
  const [activePage, setActivePage] = useState("Dashboard");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  const renderPage = () => {
    if (userRole !== "seller" || !user) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome, Buyer!
            </h1>
            <p className="text-slate-600 mt-2">This is the buyer view.</p>
            <button
              onClick={() => setUserRole("seller")}
              className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700"
            >
              Switch to Seller View
            </button>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case "Dashboard":
        return <DashboardPage />;
      case "Orders":
        return <OrdersPage />;
      case "Products":
        return <ProductsPage />;
      case "Profile":
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      {renderPage()}
      {userRole === "seller" && user && (
        <BottomNavBar activePage={activePage} setActivePage={setActivePage} />
      )}
    </div>
  );
};
