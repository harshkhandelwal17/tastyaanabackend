import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Spin,
  Grid,
  Popconfirm,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic
} from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  EyeOutlined,
  SearchOutlined,
  FilterOutlined
} from "@ant-design/icons";
import axios from "axios";
import MealPlanEditor from "../../components/seller/MealPlanEditor";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;
const { Search } = Input;
const { Option } = Select;

const SellerMealPlansList = () => {
  const screens = useBreakpoint();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [tierFilter, setTierFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  
  const observer = useRef();
  const lastMealPlanRef = useRef();
  const loadingRef = useRef(false);

  const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchMealPlans = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;

      if (isLoadMore) {
        setLoadingMore(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        status: statusFilter
      });

      if (searchText) params.append('search', searchText);
      if (tierFilter) params.append('tier', tierFilter);

      const response = await api.get(`/seller/meal-plans?${params}`);
      const newMealPlans = response.data.data.mealPlans || [];

      setMealPlans((prev) => {
        if (pageNum === 1) return newMealPlans;
        // Filter out duplicates by checking meal plan IDs
        const existingIds = new Set(prev.map((p) => p._id));
        const uniqueNewMealPlans = newMealPlans.filter(
          (p) => !existingIds.has(p._id)
        );
        return [...prev, ...uniqueNewMealPlans];
      });

      setHasMore(newMealPlans.length === 10);
      setPage((prevPage) => (isLoadMore ? prevPage + 1 : 2));
      
      // Update stats
      if (pageNum === 1) {
        setStats({
          total: response.data.data.pagination.total,
          active: newMealPlans.filter(p => p.status === 'active').length,
          inactive: newMealPlans.filter(p => p.status === 'inactive').length
        });
      }
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      message.error("Failed to fetch meal plans");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setIsInitialLoad(false);
    }
  }, [searchText, statusFilter, tierFilter]);

  // Initial load
  useEffect(() => {
    if (isInitialLoad) {
      fetchMealPlans(1);
    }
  }, [fetchMealPlans, isInitialLoad]);

  // Refetch when filters change
  useEffect(() => {
    if (!isInitialLoad) {
      fetchMealPlans(1);
    }
  }, [searchText, statusFilter, tierFilter]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMealPlans(page, true);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    const currentRef = lastMealPlanRef.current;
    if (currentRef) {
      currentObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        currentObserver.unobserve(currentRef);
      }
      currentObserver.disconnect();
    };
  }, [loading, loadingMore, hasMore, page, fetchMealPlans]);

  const handleEdit = (mealPlan) => {
    setEditingMealPlan(mealPlan);
    setIsEditorVisible(true);
  };

  const handleCreate = () => {
    setEditingMealPlan(null);
    setIsEditorVisible(true);
  };

  const handleSave = async (mealPlanData) => {
    try {
      if (editingMealPlan) {
        // Update existing meal plan
        await api.put(`/seller/meal-plans/${editingMealPlan._id}`, mealPlanData);
        message.success("Meal plan updated successfully");
      } else {
        // Create new meal plan
        await api.post('/seller/meal-plans', mealPlanData);
        message.success("Meal plan created successfully");
      }
      setIsEditorVisible(false);
      fetchMealPlans(1);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to save meal plan"
      );
    }
  };

  const handleDelete = async (mealPlanId) => {
    try {
      await api.delete(`/seller/meal-plans/${mealPlanId}`);
      message.success("Meal plan deleted successfully");
      fetchMealPlans(1);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to delete meal plan"
      );
    }
  };

  const getResponsiveColumns = () => {
    if (screens.xs) {
      return [
        {
          title: "Meal Plan",
          dataIndex: "title",
          render: (text, record, index) => (
            <div
              ref={index === mealPlans.length - 1 ? lastMealPlanRef : undefined}
            >
              <div className="flex items-center">
                {record.image && (
                  <img
                    src={record.image}
                    alt={record.title}
                    className="w-8 h-8 object-cover mr-2 rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{text}</div>
                  <div className="text-xs text-gray-500">{record.tier}</div>
                </div>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>1 Day:</span>
                  <span className="font-medium">₹{record.pricing.oneDay}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>10 Days:</span>
                  <span className="font-medium text-green-600">₹{record.pricing.tenDays}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>30 Days:</span>
                  <span className="font-medium text-green-600">₹{record.pricing.thirtyDays}</span>
                </div>
              </div>
              <div className="mt-2 flex space-x-1">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
                <Popconfirm
                  title="Are you sure you want to delete this meal plan?"
                  onConfirm={() => handleDelete(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </div>
            </div>
          ),
        },
      ];
    }

    return [
      {
        title: "Meal Plan",
        dataIndex: "title",
        render: (text, record, index) => {
          const isLastElement = index === mealPlans.length - 1;
          return (
            <div
              ref={isLastElement ? lastMealPlanRef : undefined}
              className="flex items-center"
              key={record._id}
            >
              {record.image && (
                <img
                  src={record.image}
                  alt={record.title}
                  className="w-12 h-12 object-cover mr-3 rounded"
                />
              )}
              <div>
                <div className="font-medium">{text}</div>
                <div className="text-sm text-gray-500">{record.description?.substring(0, 50)}...</div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Tier",
        dataIndex: "tier",
        render: (tier) => (
          <Tag color={
            tier === 'premium' ? 'gold' : 
            tier === 'basic' ? 'blue' : 'green'
          }>
            {tier.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Pricing",
        render: (_, record) => (
          <Space direction="vertical" size="small">
            <div className="text-sm">
              <Text>1 Day: ₹{record.pricing.oneDay}</Text>
            </div>
            <div className="text-sm">
              <Text type="success">10 Days: ₹{record.pricing.tenDays}</Text>
            </div>
            <div className="text-sm">
              <Text type="success">30 Days: ₹{record.pricing.thirtyDays}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status) => (
          <Tag color={status === 'active' ? 'green' : 'red'}>
            {status.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Actions",
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Popconfirm
              title="Are you sure you want to delete this meal plan?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];
  };

  return (
    <div className="p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div>
          <Title level={2} className="!mb-2">My Meal Plans</Title>
          <Text type="secondary">Manage your meal plan offerings</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size={screens.xs ? "middle" : "large"}
        >
          Create Meal Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Meal Plans"
              value={stats.total}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Plans"
              value={stats.active}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Inactive Plans"
              value={stats.inactive}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Search
          placeholder="Search meal plans..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: screens.xs ? '100%' : 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: screens.xs ? '100%' : 150 }}
        >
          <Option value="">All Status</Option>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
        <Select
          placeholder="Filter by tier"
          value={tierFilter}
          onChange={setTierFilter}
          style={{ width: screens.xs ? '100%' : 150 }}
        >
          <Option value="">All Tiers</Option>
          <Option value="low">Low</Option>
          <Option value="basic">Basic</Option>
          <Option value="premium">Premium</Option>
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={getResponsiveColumns()}
        dataSource={mealPlans}
        rowKey="_id"
        loading={loading}
        pagination={false}
        scroll={screens.xs ? { x: 300 } : undefined}
        size={screens.xs ? "small" : "middle"}
      />

      {/* Load More */}
      {loadingMore && (
        <div className="flex justify-center my-4">
          <Spin tip="Loading more meal plans..." />
        </div>
      )}

      {!loading && !loadingMore && !hasMore && mealPlans.length > 0 && (
        <div className="text-center my-4 text-gray-500">
          No more meal plans to load
        </div>
      )}

      {!loading && mealPlans.length === 0 && (
        <div className="text-center my-8">
          <div className="text-gray-500 mb-4">No meal plans found</div>
          <Button type="primary" onClick={handleCreate}>
            Create Your First Meal Plan
          </Button>
        </div>
      )}

      {/* Meal Plan Editor Modal */}
      <MealPlanEditor
        mealPlan={editingMealPlan}
        visible={isEditorVisible}
        onCancel={() => setIsEditorVisible(false)}
        onSave={handleSave}
        screens={screens}
      />
    </div>
  );
};

export default SellerMealPlansList;




