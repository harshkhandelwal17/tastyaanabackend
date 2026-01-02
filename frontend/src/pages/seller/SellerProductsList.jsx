import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  InputNumber,
  Spin,
  Space,
  Typography,
  message,
  Grid,
} from "antd";
import { EditOutlined, PlusOutlined, TagOutlined } from "@ant-design/icons";
import axios from "axios";
import ProductEditor from "../../components/seller/ProductEditor";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const SellerProductsList = () => {
  const screens = useBreakpoint();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isBulkEditModalVisible, setIsBulkEditModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const observer = useRef();
  const lastProductRef = useRef();
  const loadingRef = useRef(false);

  const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchProducts = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;

      if (isLoadMore) {
        setLoadingMore(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await api.get(
        `/seller/products?page=${pageNum}&limit=100`
      );
      const newProducts = response.data.data.products || [];

      setProducts((prev) => {
        if (pageNum === 1) return newProducts;
        // Filter out duplicates by checking product IDs
        const existingIds = new Set(prev.map((p) => p._id));
        const uniqueNewProducts = newProducts.filter(
          (p) => !existingIds.has(p._id)
        );
        return [...prev, ...uniqueNewProducts];
      });

      setHasMore(newProducts.length === 10); // If we got a full page, there might be more
      setPage((prevPage) => (isLoadMore ? prevPage + 1 : 2));
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setIsInitialLoad(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialLoad) {
      fetchProducts(1);
    }
  }, [fetchProducts, isInitialLoad]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts(page, true);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    const currentRef = lastProductRef.current;
    if (currentRef) {
      currentObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        currentObserver.unobserve(currentRef);
      }
      currentObserver.disconnect();
    };
  }, [loading, loadingMore, hasMore, page, fetchProducts]);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsEditorVisible(true);
  };

  const handleBulkEdit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one product to edit');
      return;
    }
    setIsBulkEditModalVisible(true);
  };

  const handleBulkSave = async () => {
    try {
      const values = await form.validateFields();
      const updates = {};
      
      if (values.price !== undefined) updates.price = values.price;
      if (values.discount !== undefined) updates.discount = values.discount;
      if (values.stock !== undefined) updates.stock = values.stock;

      // Call API to update products
      await api.patch('/seller/products/bulk-update', {
        productIds: selectedRowKeys,
        updates: updates
      });

      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          selectedRowKeys.includes(product._id) 
            ? { ...product, ...updates } 
            : product
        )
      );

      message.success('Products updated successfully');
      setIsBulkEditModalVisible(false);
      setSelectedRowKeys([]);
      form.resetFields();
    } catch (error) {
      console.error('Error updating products:', error);
      message.error('Failed to update products');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  const handleSave = async (updatedProduct) => {
    try {
      await api.patch(`seller/${editingProduct._id}`, updatedProduct);
      message.success("Product updated successfully");
      setIsEditorVisible(false);
      fetchProducts(1);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update product"
      );
    }
  };

  const getResponsiveColumns = () => {
    if (screens.xs) {
      return [
        {
          title: "Product",
          dataIndex: "title",
          render: (text, record, index) => (
            <div
              ref={index === products.length - 1 ? lastProductRef : undefined}
            >
              <div className="flex items-center">
                {record.images?.[0]?.url && (
                  <img
                    src={record.images[0].url}
                    alt={record.images[0].alt}
                    className="w-8 h-8 object-cover mr-2"
                  />
                )}
                <span className="text-sm">{text}</span>
              </div>
              <div className="mt-1">
                <Text delete={record.discount > 0} className="text-xs">
                  ₹{record.price.toFixed(2)}
                </Text>
                {record.discount > 0 && (
                  <Text strong className="text-green-600 text-xs ml-1">
                    ₹{(record.price * (1 - record.discount / 100)).toFixed(2)}
                  </Text>
                )}
              </div>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                className="mt-1"
              />
            </div>
          ),
        },
      ];
    }

    return [
      {
        title: "Product",
        dataIndex: "title",
        render: (text, record, index) => {
          const isLastElement = index === products.length - 1;
          return (
            <div
              ref={isLastElement ? lastProductRef : undefined}
              className="flex items-center"
              key={record._id}
            >
              {record.images?.[0]?.url && (
                <img
                  src={record.images[0].url}
                  alt={record.images[0].alt}
                  className="w-10 h-10 object-cover mr-3"
                />
              )}
              <span>{text}</span>
            </div>
          );
        },
      },
      {
        title: "Price",
        render: (_, record) => (
          <Space direction="vertical">
            <Text delete={record.discount > 0}>₹{record.price.toFixed(2)}</Text>
            {record.discount > 0 && (
              <Text strong className="text-green-600">
                ₹{(record.price * (1 - record.discount / 100)).toFixed(2)}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: screens.md ? "Weight Options" : "Options",
        render: (_, record) => (
          <div>
            {record.weightOptions?.map((opt, i) => (
              <div key={i} className="mb-1">
                <Tag color="blue">{opt.weight}</Tag>
                {screens.sm && (
                  <>
                    <Tag color="purple">₹{opt.price.toFixed(2)}</Tag>
                    <Tag color={opt.stock > 0 ? "green" : "red"}>
                      {opt.stock} in stock
                    </Tag>
                  </>
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Action",
        render: (_, record) => (
          <Button
            size={screens.xs ? "small" : "middle"}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        ),
      },
    ];
  }

  return (
    <div className="p-2 md:p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold">My Products</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            type="default"
            onClick={handleBulkEdit}
            disabled={selectedRowKeys.length === 0}
            icon={<TagOutlined />}
            size={screens.xs ? 'small' : 'middle'}
            className="flex-1 md:flex-initial"
          >
            {screens.xs ? 'Bulk Edit' : 'Bulk Edit Prices'}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setEditingProduct(null);
              setIsEditorVisible(true);
            }}
            icon={<PlusOutlined />}
            size={screens.xs ? 'small' : 'middle'}
            className="flex-1 md:flex-initial"
          >
            {screens.xs ? 'Add' : 'Add Product'}
          </Button>
        </div>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={getResponsiveColumns()}
        dataSource={products}
        rowKey="_id"
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
      />

      {loadingMore && (
        <div className="text-center my-4">
          <Spin tip="Loading more products..." size={screens.xs ? "small" : "default"} />
        </div>
      )}

      {!loading && !loadingMore && !hasMore && (
        <div className="text-center my-2 md:my-4 text-gray-500 text-sm md:text-base">
          No more products to load
        </div>
      )}

      <ProductEditor
        product={editingProduct}
        visible={isEditorVisible}
        onCancel={() => setIsEditorVisible(false)}
        onSave={handleSave}
        screens={screens}
      />

      <Modal
        title="Bulk Edit Products"
        visible={isBulkEditModalVisible}
        onOk={handleBulkSave}
        onCancel={() => {
          setIsBulkEditModalVisible(false);
          form.resetFields();
        }}
        okText="Save Changes"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="price" label="Original Price">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="Leave empty to keep current"
              prefix="₹"
            />
          </Form.Item>
          <Form.Item name="discount" label="Discount (%)">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={0}
              placeholder="Leave empty to keep current"
              suffix="%"
            />
          </Form.Item>
          <Form.Item name="stock" label="Stock">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
              placeholder="Leave empty to keep current"
            />
          </Form.Item>
          <div className="text-sm text-gray-500">
            Selected: {selectedRowKeys.length} product{selectedRowKeys.length !== 1 ? 's' : ''}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SellerProductsList;
