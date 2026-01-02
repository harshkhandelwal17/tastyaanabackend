import { useState, useEffect } from "react";
import {
  PlusCircle,
  MoreVertical,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetSellerProductsQuery,
  useUpdateProductStatusMutation,
  useDeleteProductMutation,
} from "../../redux/storee/api";
import { useAuth } from "../../hook/useAuth";
import { toast } from "react-hot-toast";

const ITEMS_PER_PAGE = 100;

const SellerProducts = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    token,
    isAuthenticated,
  } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  // const [productsData, setProductsData] = useState([]);
  // Fetch products with RTK Query
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSellerProductsQuery(
    {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: searchTerm,
      status: statusFilter,
      sortBy,
      sortOrder,
    },
    {
      skip: !authUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  // const fetchProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await api.get(`/seller/products`);
  //     console.log(response.data);
  //     setProductsData(response.data.data.products);
  //     // setPagination({
  //     //   ...pagination,
  //     //   total: response.data.total,
  //     // });
  //   } catch (error) {
  //     message.error("Failed to fetch products");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  console.log("products data in ", productsData);
  // Mutations
  const [updateStatus] = useUpdateProductStatusMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
      refetch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      await updateStatus({
        productId,
        status: !currentStatus,
      }).unwrap();
      toast.success("Product status updated successfully");
      refetch();
    } catch (error) {
      console.error("Failed to update product status:", error);
      toast.error(error.data?.message || "Failed to update product status");
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId).unwrap();
        toast.success("Product deleted successfully");
        refetch();
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast.error(error.data?.message || "Failed to delete product");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-green-500" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Error loading products
        </h2>
        <p className="text-slate-600 text-center mb-4">
          {error?.data?.message || "Failed to load products. Please try again."}
        </p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { products = [], totalCount = 0 } = productsData?.data || {};
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  console.log(products);
  return (
    <div className="bg-slate-50 min-h-screen p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              My Products
            </h1>
            <p className="text-slate-600">Manage your product listings</p>
          </div>
          <button
            onClick={() => navigate("/seller/products/new")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
          >
            <PlusCircle size={20} />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
              </div>

              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split(":");
                  setSortBy(sort);
                  setSortOrder(order);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
              >
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="price:asc">Price (Low to High)</option>
                <option value="price:desc">Price (High to Low)</option>
                <option value="stock:asc">Stock (Low to High)</option>
                <option value="stock:desc">Stock (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <img
              src="/empty-products.svg"
              alt="No products found"
              className="h-40 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No products found
            </h3>
            <p className="text-slate-600 mb-4">
              {searchTerm
                ? "No products match your search criteria."
                : "You have not added any products yet."}
            </p>
            <button
              onClick={() => navigate("/seller/products/new")}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle size={18} />
              Add Your First Product
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="relative">
                    <img
                      src={
                        product.images?.[0]?.url ||
                        "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    {!product.isActive && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Inactive
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">
                        {product.name}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </div>

                    <p className="text-slate-600 font-semibold text-lg mb-2">
                      ₹{product.price?.toLocaleString("en-IN")}
                      <span className="text-sm font-normal text-slate-500">
                        / {product.unit || "unit"}
                      </span>
                    </p>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span
                        className={`font-medium ${
                          product.stock > 10
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </span>
                      <span className="text-slate-500">
                        {product.sold || 0} sold
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 border-t">
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium text-slate-600">
                        Active:
                      </span>
                      <button
                        onClick={() =>
                          handleStatusToggle(product._id, product.isActive)
                        }
                        disabled={isLoading}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          product.isActive ? "bg-green-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`${
                            product.isActive ? "translate-x-6" : "translate-x-1"
                          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/seller/products/edit/${product._id}`)
                        }
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        disabled={isDeleting}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                  </span>{" "}
                  of <span className="font-medium">{totalCount}</span> products
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === pageNum
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
