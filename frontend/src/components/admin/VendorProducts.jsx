import React, { useState } from 'react';
import { Package, CheckCircle, X, AlertCircle, Plus, Edit, Trash2, Save, Search, Filter, MoreVertical } from 'lucide-react';

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [products, setProducts] = useState([
    { id: 1, name: 'Fresh Tomatoes', category: 'Vegetables', price: 40, stock: 120, status: 'active' },
    { id: 2, name: 'Organic Spinach', category: 'Leafy Greens', price: 30, stock: 85, status: 'active' },
    { id: 3, name: 'Red Onions', category: 'Vegetables', price: 25, stock: 5, status: 'low_stock' },
    { id: 4, name: 'Green Capsicum', category: 'Vegetables', price: 60, stock: 0, status: 'out_of_stock' },
    { id: 5, name: 'Fresh Apples', category: 'Fruits', price: 80, stock: 45, status: 'active' },
    { id: 6, name: 'Organic Carrots', category: 'Vegetables', price: 35, stock: 8, status: 'low_stock' },
    { id: 7, name: 'Fresh Bananas', category: 'Fruits', price: 50, stock: 30, status: 'active' },
    { id: 8, name: 'Fresh Mint', category: 'Herbs', price: 20, stock: 15, status: 'active' }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: ''
  });

  const categories = ['Vegetables', 'Fruits', 'Leafy Greens', 'Herbs', 'Grains', 'Dairy', 'Others'];
  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  const getProductStatus = (stock) => {
    if (stock === 0) return 'out_of_stock';
    if (stock <= 10) return 'low_stock';
    return 'active';
  };

  const getStats = () => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const inactive = products.filter(p => p.status === 'out_of_stock').length;
    const lowStock = products.filter(p => p.status === 'low_stock').length;
    return { total, active, inactive, lowStock };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStatus = !filterStatus || product.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || newProduct.stock === '') {
      alert('Please fill in all fields');
      return;
    }

    const stock = parseInt(newProduct.stock);
    const price = parseFloat(newProduct.price);

    if (price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    if (stock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: price,
      stock: stock,
      status: getProductStatus(stock)
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', category: '', price: '', stock: '' });
    setShowAddModal(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString(),
      stock: product.stock.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct.name || !editingProduct.category || !editingProduct.price || editingProduct.stock === '') {
      alert('Please fill in all fields');
      return;
    }

    const stock = parseInt(editingProduct.stock);
    const price = parseFloat(editingProduct.price);

    if (price <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    if (stock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    const updatedProduct = {
      ...editingProduct,
      name: editingProduct.name.trim(),
      price: price,
      stock: stock,
      status: getProductStatus(stock)
    };

    setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setNewProduct({ name: '', category: '', price: '', stock: '' });
    setShowAddModal(false);
  };

  const resetEditForm = () => {
    setEditingProduct(null);
    setShowEditModal(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
       

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              {/* Product Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Package size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">Total Products</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-blue-600 mt-1">All registered items</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">In Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-xs text-green-600 mt-1">Available for sale</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <X size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">Out of Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                  <p className="text-xs text-red-600 mt-1">Need restocking</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">Low Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
                  <p className="text-xs text-amber-600 mt-1">Running low</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                {(searchTerm || filterCategory || filterStatus) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Products List */}
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filterCategory || filterStatus 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start by adding your first product'}
                    </p>
                    {!searchTerm && !filterCategory && !filterStatus && (
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Add Your First Product
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
                            <p className="text-sm text-gray-600">per kg</p>
                          </div>
                          
                          <div className="text-right min-w-20">
                            <p className="font-semibold text-gray-900">{product.stock} kg</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block ${
                              product.status === 'active' ? 'bg-green-100 text-green-700' :
                              product.status === 'low_stock' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {product.status === 'active' ? 'In Stock' :
                               product.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit product"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {filteredProducts.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹ per kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity (kg) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              <button 
                onClick={resetEditForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹ per kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity (kg) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;