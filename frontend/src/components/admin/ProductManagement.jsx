import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreVertical, UploadCloud, X } from 'lucide-react';

// --- Reusable UI Components ---

const ToggleSwitch = ({ enabled, onChange }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-teal-500' : 'bg-slate-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
};

// --- Add/Edit Product Modal Component ---

const AddEditProductModal = ({ isOpen, onClose, product, onSave, categories, vendors }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', categoryId: '', vendorId: '', price: '', stock: '', available: true, image: '/placeholder-image.svg'
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                categoryId: product.categoryId,
                vendorId: product.vendorId,
                price: product.price,
                stock: product.stock,
                available: product.available,
                image: product.image
            });
        } else {
            setFormData({
                name: '', description: '', categoryId: categories[0]?.id || '', vendorId: vendors[0]?.id || '', price: '', stock: '', available: true, image: '/placeholder-image.svg'
            });
        }
    }, [product, isOpen, categories, vendors]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.stock) {
            alert('Please fill in all required fields.');
            return;
        }
        onSave({ ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload UI */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Product Image</label>
                    <div className="mt-1 flex items-center gap-4">
                        <img src={formData.image} alt="Product" className="w-20 h-20 rounded-lg object-cover bg-slate-100" />
                        <div className="flex justify-center px-6 py-8 border-2 border-slate-300 border-dashed rounded-lg w-full">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                <label htmlFor="file-upload" className="text-sm font-medium text-sky-600 hover:text-sky-500 cursor-pointer">
                                    <span>Upload an image</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-600">Title</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" required/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-600">Description</label>
                    <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-slate-600">Category</label>
                        <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
                            {categories.filter(c => c.active).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="vendorId" className="block text-sm font-medium text-slate-600">Vendor</label>
                        <select id="vendorId" name="vendorId" value={formData.vendorId} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500">
                            {vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-slate-600">Price</label>
                        <input type="number" id="price" name="price" placeholder="$0.00" value={formData.price} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" required step="0.01"/>
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-slate-600">Stock</label>
                        <input type="number" id="stock" name="stock" placeholder="0" value={formData.stock} onChange={handleChange} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" required/>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Availability</span>
                    <ToggleSwitch enabled={formData.available} onChange={() => setFormData(prev => ({...prev, available: !prev.available}))} />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold transition-colors">Save Product</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main Product Management Page ---

const ProductManagement = () => {
    // --- State Management ---
    const [vendors, setVendors] = useState([
        { id: 1, name: 'TechNova Inc.' },
        { id: 2, name: 'FitGear Co.' },
        { id: 3, name: 'The Daily Grind' },
        { id: 4, name: 'WorkWell Solutions' },
        { id: 5, name: 'EcoThreads' },
    ]);
    const [categories, setCategories] = useState([
        { id: 1, name: 'Electronics', active: true },
        { id: 2, name: 'Apparel', active: true },
        { id: 3, name: 'Groceries', active: false },
        { id: 4, name: 'Furniture', active: true },
    ]);
    const [products, setProducts] = useState([
        { id: 1, name: 'QuantumGlow Smartwatch', categoryId: 1, vendorId: 1, price: 299.99, stock: 150, available: true, image: '/placeholder-image.svg' },
        { id: 2, name: 'AeroFlex Running Shoes', categoryId: 2, vendorId: 2, price: 120.00, stock: 8, available: true, image: '/placeholder-image.svg' },
        { id: 3, name: 'Gourmet Coffee Beans', categoryId: 3, vendorId: 3, price: 22.50, stock: 300, available: false, image: '/placeholder-image.svg' },
        { id: 4, name: 'ErgoComfort Office Chair', categoryId: 4, vendorId: 4, price: 450.00, stock: 0, available: true, image: '/placeholder-image.svg' },
    ]);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // --- Computed State & Helpers ---
    const filteredProducts = useMemo(() =>
        products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );
    const getCategoryNameById = (id) => categories.find(c => c.id === id)?.name || 'N/A';
    const getVendorNameById = (id) => vendors.find(v => v.id === id)?.name || 'N/A';
    const getStockStatus = (stock) => {
        if (stock === 0) return 'Out of Stock';
        if (stock <= 10) return 'Low Stock';
        return 'In Stock';
    };
    const getStatusBadge = (status) => {
        const styles = {
            'In Stock': 'bg-teal-100 text-teal-700',
            'Low Stock': 'bg-amber-100 text-amber-700',
            'Out of Stock': 'bg-rose-100 text-rose-700',
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    // --- Product Handlers ---
    const handleSaveProduct = (productData) => {
        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        } else {
            setProducts([...products, { ...productData, id: Date.now() }]);
        }
    };
    const handleAddNewProduct = () => { setEditingProduct(null); setIsModalOpen(true); };
    const handleEditProduct = (product) => { setEditingProduct(product); setIsModalOpen(true); };
    const handleDeleteProduct = (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    // --- Category Handlers ---
    const handleAddCategory = () => {
        if (newCategoryName.trim() === '') return;
        setCategories([...categories, { id: Date.now(), name: newCategoryName.trim(), active: true }]);
        setNewCategoryName('');
    };
    const handleDeleteCategory = (categoryId) => {
        const isUsed = products.some(p => p.categoryId === categoryId);
        if (isUsed) {
            alert('Cannot delete category. It is currently in use by one or more products.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this category?')) {
            setCategories(categories.filter(c => c.id !== categoryId));
        }
    };
    const handleToggleCategory = (categoryId) => {
        setCategories(categories.map(c => c.id === categoryId ? { ...c, active: !c.active } : c));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Products & Categories</h1>
                    <p className="text-slate-500 mt-1">Manage your inventory and product categories.</p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content: Products List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80">
                        {/* Table Header and Actions */}
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-auto">
                                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" placeholder="Search products..." className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </div>
                            <button onClick={handleAddNewProduct} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors">
                                <Plus className="w-5 h-5" /><span>Add Product</span>
                            </button>
                        </div>
                        {/* Desktop Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4 font-medium">Product Name</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium">Price</th>
                                        <th className="p-4 font-medium">Stock</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                            <td className="p-4 flex items-center gap-3">
                                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-slate-100" />
                                                <div>
                                                    <p className="font-semibold text-slate-800">{product.name}</p>
                                                    <p className="text-sm text-slate-500">{getVendorNameById(product.vendorId)}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600">{getCategoryNameById(product.categoryId)}</td>
                                            <td className="p-4 font-medium text-slate-800">${product.price.toFixed(2)}</td>
                                            <td className="p-4 text-slate-600">{product.stock} units</td>
                                            <td className="p-4">{getStatusBadge(getStockStatus(product.stock))}</td>
                                            <td className="p-4 space-x-1">
                                                <button onClick={() => handleEditProduct(product)} className="p-2 rounded-md hover:bg-slate-200"><Edit className="w-4 h-4 text-slate-600" /></button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-md hover:bg-rose-100"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-200">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                            <div>
                                                <p className="font-semibold text-slate-800">{product.name}</p>
                                                <p className="text-sm text-slate-500">{getCategoryNameById(product.categoryId)}</p>
                                                <p className="text-sm font-bold text-sky-600 mt-1">${product.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button onClick={() => handleEditProduct(product)} className="p-2"><Edit className="w-5 h-5 text-slate-500" /></button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2"><Trash2 className="w-5 h-5 text-rose-500" /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-sm">
                                        {getStatusBadge(getStockStatus(product.stock))}
                                        <p className="text-slate-500">{product.stock} units in stock</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Side Panel: Category Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Manage Categories</h3>
                        <div className="space-y-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold text-slate-700">{cat.name}</p>
                                    <div className="flex items-center gap-3">
                                        <ToggleSwitch enabled={cat.active} onChange={() => handleToggleCategory(cat.id)} />
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-md hover:bg-rose-100"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200">
                             <p className="font-semibold text-slate-700 mb-2">Add New Category</p>
                             <div className="flex gap-2">
                                 <input type="text" placeholder="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                 <button onClick={handleAddCategory} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 text-sm">Add</button>
                             </div>
                        </div>
                    </div>
                </div>
                {/* Product Modal */}
                <AddEditProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} onSave={handleSaveProduct} categories={categories} vendors={vendors} />
            </div>
        </div>
    );
};

export default ProductManagement;