import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import SellerLayout from '../../components/seller/SellerLayout';
import ResponsiveTable, { StatusBadge } from '../../components/seller/ResponsiveTable';

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProducts([
        {
          id: 'PROD-001',
          name: 'Chicken Biryani',
          category: 'Main Course',
          price: 250,
          originalPrice: 280,
          stock: 50,
          lowStockThreshold: 10,
          status: 'active',
          rating: 4.5,
          reviews: 120,
          image: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=100',
          description: 'Aromatic basmati rice cooked with tender chicken and spices',
          createdAt: '2024-01-10T10:00:00Z',
          sales: 340,
          revenue: 85000
        },
        {
          id: 'PROD-002',
          name: 'Vegetable Thali',
          category: 'Thali',
          price: 180,
          originalPrice: 200,
          stock: 3,
          lowStockThreshold: 5,
          status: 'active',
          rating: 4.2,
          reviews: 85,
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100',
          description: 'Complete vegetarian meal with variety of dishes',
          createdAt: '2024-01-12T14:30:00Z',
          sales: 230,
          revenue: 41400
        },
        {
          id: 'PROD-003',
          name: 'Masala Dosa',
          category: 'South Indian',
          price: 120,
          originalPrice: 120,
          stock: 0,
          lowStockThreshold: 10,
          status: 'out_of_stock',
          rating: 4.7,
          reviews: 200,
          image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=100',
          description: 'Crispy crepe with spiced potato filling',
          createdAt: '2024-01-08T09:15:00Z',
          sales: 450,
          revenue: 54000
        },
        {
          id: 'PROD-004',
          name: 'Paneer Butter Masala',
          category: 'North Indian',
          price: 220,
          originalPrice: 240,
          stock: 25,
          lowStockThreshold: 8,
          status: 'active',
          rating: 4.4,
          reviews: 95,
          image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=100',
          description: 'Rich and creamy paneer curry',
          createdAt: '2024-01-11T16:45:00Z',
          sales: 180,
          revenue: 39600
        },
        {
          id: 'PROD-005',
          name: 'Gulab Jamun',
          category: 'Dessert',
          price: 80,
          originalPrice: 90,
          stock: 2,
          lowStockThreshold: 15,
          status: 'active',
          rating: 4.6,
          reviews: 150,
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100',
          description: 'Soft spongy dumplings in sugar syrup',
          createdAt: '2024-01-09T11:20:00Z',
          sales: 320,
          revenue: 25600
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status, stock, lowStockThreshold) => {
    if (status === 'out_of_stock' || stock === 0) {
      return 'bg-red-100 text-red-800';
    } else if (stock <= lowStockThreshold) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === 'active') {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status, stock, lowStockThreshold) => {
    if (status === 'out_of_stock' || stock === 0) {
      return 'Out of Stock';
    } else if (stock <= lowStockThreshold) {
      return 'Low Stock';
    } else if (status === 'active') {
      return 'Active';
    } else {
      return 'Inactive';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddProduct = () => {
    console.log('Add new product');
    // Navigate to add product page
  };

  const handleEditProduct = (product) => {
    console.log('Edit product:', product);
    // Navigate to edit product page
  };

  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      setProducts(products.filter(p => p.id !== product.id));
    }
  };

  const handleViewProduct = (product) => {
    console.log('View product:', product);
    // Navigate to product details page
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      sortable: true,
      cell: (value, item) => (
        <div className="flex items-center">
          <div className="h-12 w-12 flex-shrink-0">
            <img 
              className="h-12 w-12 rounded-lg object-cover" 
              src={item.image} 
              alt={value}
              onError={(e) => {
                e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                `)}`;
              }}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.category}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      sortable: true,
      cell: (value, item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{formatCurrency(value)}</div>
          {item.originalPrice > value && (
            <div className="text-xs text-gray-500 line-through">{formatCurrency(item.originalPrice)}</div>
          )}
        </div>
      )
    },
    {
      header: 'Stock',
      accessor: 'stock',
      sortable: true,
      cell: (value, item) => (
        <div className="flex items-center">
          <span className="text-sm text-gray-900">{value}</span>
          {value <= item.lowStockThreshold && value > 0 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
          )}
          {value === 0 && (
            <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value, item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value, item.stock, item.lowStockThreshold)}`}>
          {getStatusText(value, item.stock, item.lowStockThreshold)}
        </span>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      sortable: true,
      cell: (value, item) => (
        <div className="flex items-center">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="ml-1 text-sm text-gray-900">{value}</span>
          <span className="ml-1 text-xs text-gray-500">({item.reviews})</span>
        </div>
      )
    },
    {
      header: 'Sales',
      accessor: 'sales',
      sortable: true,
      cell: (value, item) => (
        <div>
          <div className="text-sm text-gray-900">{value} sold</div>
          <div className="text-xs text-gray-500">{formatCurrency(item.revenue)}</div>
        </div>
      )
    },
    {
      header: 'Date Added',
      accessor: 'createdAt',
      sortable: true,
      cell: (value) => (
        <div className="text-sm text-gray-900">{formatDate(value)}</div>
      )
    }
  ];

  const actions = [
    {
      label: 'View',
      icon: Eye,
      onClick: handleViewProduct,
      className: 'text-blue-600 hover:text-blue-900'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEditProduct,
      className: 'text-indigo-600 hover:text-indigo-900'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDeleteProduct,
      className: 'text-red-600 hover:text-red-900'
    }
  ];

  const productStats = {
    total: products.length,
    active: products.filter(p => p.status === 'active' && p.stock > 0).length,
    lowStock: products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    totalSales: products.reduce((sum, p) => sum + p.sales, 0)
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your product catalog and inventory
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{productStats.total}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{productStats.active}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{productStats.lowStock}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">{productStats.outOfStock}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                  <dd className="text-lg font-medium text-gray-900">{productStats.totalSales}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(productStats.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(productStats.lowStock > 0 || productStats.outOfStock > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Inventory Alert:</strong> 
                  {productStats.outOfStock > 0 && ` ${productStats.outOfStock} products are out of stock.`}
                  {productStats.lowStock > 0 && ` ${productStats.lowStock} products have low stock.`}
                  {' '}Please update your inventory.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <ResponsiveTable
          columns={columns}
          data={products}
          loading={loading}
          onRowClick={handleViewProduct}
          actions={actions}
          searchable={true}
          filterable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </div>
    </SellerLayout>
  );
};

export default SellerProductsPage;