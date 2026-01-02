import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Switch,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";

const { TextArea } = Input;
const { Option } = Select;

const SellerProductsPagee = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 100 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [storeStatus, setStoreStatus] = useState("open");

  const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });

  // Request interceptor to add auth token
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStoreStatus();
  }, [pagination.current]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/seller/products`
      );
      console.log(response.data);
      setProducts(response.data.data.products);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/category");
      console.log(response.data);
      setCategories(response.data.categories);
    } catch (error) {
      message.error("Failed to fetch categories");
    }
  };

  const fetchStoreStatus = async () => {
    try {
      const response = await api.get("/seller/profile");
      setStoreStatus(response.data.sellerProfile.storeStatus);
    } catch (error) {
      message.error("Failed to fetch store status");
    }
  };

  const handleToggleStoreStatus = async () => {
    const newStatus = storeStatus === "open" ? "closed" : "open";
    try {
      await api.patch("/seller/toggle-shutdown", {
        isShutdown: newStatus === "closed",
        reason: newStatus === "closed" ? "Manual shutdown" : "Store reopened",
      });
      setStoreStatus(newStatus);
      message.success(
        `Store ${newStatus === "open" ? "opened" : "closed"} successfully`
      );
    } catch (error) {
      message.error("Failed to update store status");
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    form.setFieldsValue({
      ...product,
      category: product.category._id,
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await api.patch(`/seller/${currentProduct._id}/price`, values);
      message.success("Product updated successfully");
      setIsModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update product"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product");
    }
  };

  const handleBulkPriceUpdate = async (categoryId) => {
    Modal.confirm({
      title: "Update Prices for Category",
      content: (
        <div>
          <p>All products in this category will have their prices updated.</p>
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Enter new price"
          />
        </div>
      ),
      onOk: async (value) => {
        try {
          const productsToUpdate = products
            .filter((p) => p.category._id === categoryId)
            .map((p) => ({ id: p._id, price: value }));

          await api.patch("/products/update-category-prices", {
            updates: productsToUpdate,
          });
          message.success("Prices updated successfully");
          fetchProducts();
        } catch (error) {
          message.error("Failed to update prices");
        }
      },
    });
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "title",
      render: (text, record) => (
        <div className="flex items-center">
          {record.images?.[0]?.url && (
            <img
              src={record.images[0].url}
              alt={record.images[0].alt}
              className="w-10 h-10 object-cover mr-3"
            />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (price) => `₹${price}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      render: (stock, record) => (
        <Tag color={stock <= record.lowStockThreshold ? "red" : "green"}>
          {stock}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <div className="flex space-x-4">
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Add Product
          </Button>
          <div className="flex items-center">
            <span className="mr-2">Store Status:</span>
            <Switch
              checked={storeStatus === "open"}
              onChange={handleToggleStoreStatus}
              checkedChildren="Open"
              unCheckedChildren="Closed"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        {categories.map((category) => (
          <Button
            key={category._id}
            onClick={() => handleBulkPriceUpdate(category._id)}
            className="mr-2 mb-2"
          >
            Update {category.name} Prices
          </Button>
        ))}
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => setPagination(pagination)}
      />

      <Modal
        title={currentProduct ? "Edit Product" : "Add Product"}
        visible={isModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Product Name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="shortDescription" label="Short Description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select category" }]}
          >
            <Select>
              {categories.map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="discountPrice" label="Discount Price">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true, message: "Please enter stock" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="lowStockThreshold" label="Low Stock Threshold">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SellerProductsPagee;
