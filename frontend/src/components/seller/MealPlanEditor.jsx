import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Tabs,
  Select,
  Upload,
  message,
  Grid,
  Space,
  Card,
  Row,
  Col,
  Divider,
  Tag,
  Switch
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  SaveOutlined,
  CloseOutlined
} from "@ant-design/icons";

const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { TextArea } = Input;
const { Option } = Select;

const MealPlanEditor = ({ mealPlan, visible, onCancel, onSave, screens }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("basic");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mealPlan) {
      form.setFieldsValue({
        title: mealPlan.title,
        description: mealPlan.description,
        tier: mealPlan.tier,
        status: mealPlan.status,
        pricing: {
          oneDay: mealPlan.pricing?.oneDay,
          tenDays: mealPlan.pricing?.tenDays,
          thirtyDays: mealPlan.pricing?.thirtyDays,
        },
        planDetails: {
          days: mealPlan.planDetails?.days || 30,
          totalThalis: mealPlan.planDetails?.totalThalis || 56,
          pricePerThali: mealPlan.planDetails?.pricePerThali || 65,
        },
        tags: mealPlan.tags || [],
        features: mealPlan.features || [],
        dietaryOptions: mealPlan.dietaryOptions || ['vegetarian'],
        deliveryTiming: mealPlan.deliveryTiming || {
          morning: { enabled: true, time: "08:00" },
          evening: { enabled: true, time: "19:00" }
        }
      });
      setImageUrl(mealPlan.image || "");
    } else {
      // Reset form for new meal plan
      form.resetFields();
      setImageUrl("");
      form.setFieldsValue({
        status: 'active',
        tier: 'basic',
        pricing: {
          oneDay: 65,
          tenDays: 600,
          thirtyDays: 3900,
        },
        planDetails: {
          days: 30,
          totalThalis: 56,
          pricePerThali: 65,
        },
        dietaryOptions: ['vegetarian'],
        deliveryTiming: {
          morning: { enabled: true, time: "08:00" },
          evening: { enabled: true, time: "19:00" }
        }
      });
    }
  }, [mealPlan, form]);

  const handleImageUpload = (info) => {
    if (info.file.status === 'done') {
      setImageUrl(info.file.response.url);
      message.success(`${info.file.name} uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed.`);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const mealPlanData = {
        ...values,
        image: imageUrl,
        createdAt: mealPlan ? mealPlan.createdAt : new Date(),
        updatedAt: new Date()
      };

      await onSave(mealPlanData);
    } catch (error) {
      console.error('Form validation error:', error);
      message.error("Please fill all required fields correctly");
    } finally {
      setLoading(false);
    }
  };

  const getModalWidth = () => {
    if (screens.xs) return "95%";
    if (screens.sm) return "90%";
    if (screens.md) return "800px";
    return "900px";
  };

  const uploadProps = {
    name: 'image',
    action: `${import.meta.env.VITE_BACKEND_URL}/upload/image`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange: handleImageUpload,
    showUploadList: false,
  };

  const calculateSavings = (oneDay, tenDays, thirtyDays) => {
    const tenDaySavings = (oneDay * 10) - tenDays;
    const thirtyDaySavings = (oneDay * 30) - thirtyDays;
    return { tenDaySavings, thirtyDaySavings };
  };

  const pricingValues = Form.useWatch(['pricing'], form);
  const savings = pricingValues ? calculateSavings(
    pricingValues.oneDay || 0,
    pricingValues.tenDays || 0,
    pricingValues.thirtyDays || 0
  ) : { tenDaySavings: 0, thirtyDaySavings: 0 };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <SaveOutlined className="mr-2" />
          {mealPlan ? "Edit Meal Plan" : "Create New Meal Plan"}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={getModalWidth()}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Basic Information Tab */}
          <TabPane tab="Basic Info" key="basic">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="title"
                  label="Meal Plan Title"
                  rules={[
                    { required: true, message: 'Please enter meal plan title' },
                    { min: 3, message: 'Title must be at least 3 characters' }
                  ]}
                >
                  <Input placeholder="e.g., Premium Vegetarian Meal Plan" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="tier"
                  label="Tier"
                  rules={[{ required: true, message: 'Please select tier' }]}
                >
                  <Select placeholder="Select tier">
                    <Option value="low">Low</Option>
                    <Option value="basic">Basic</Option>
                    <Option value="premium">Premium</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: 'Please enter description' },
                { min: 10, message: 'Description must be at least 10 characters' }
              ]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe your meal plan, what's included, benefits, etc."
              />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Meal Plan Image">
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>
                      {imageUrl ? "Change Image" : "Upload Image"}
                    </Button>
                  </Upload>
                  {imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={imageUrl} 
                        alt="Meal Plan" 
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>
          </TabPane>

          {/* Pricing Tab */}
          <TabPane tab="Pricing" key="pricing">
            <Card title="Pricing Structure" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['pricing', 'oneDay']}
                    label="1 Day Price (₹)"
                    rules={[
                      { required: true, message: 'Please enter 1 day price' },
                      { type: 'number', min: 1, message: 'Price must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="65"
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['pricing', 'tenDays']}
                    label="10 Days Price (₹)"
                    rules={[
                      { required: true, message: 'Please enter 10 days price' },
                      { type: 'number', min: 1, message: 'Price must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="600"
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['pricing', 'thirtyDays']}
                    label="30 Days Price (₹)"
                    rules={[
                      { required: true, message: 'Please enter 30 days price' },
                      { type: 'number', min: 1, message: 'Price must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="3900"
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Savings Display */}
              <Divider />
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small" className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      Save ₹{savings.tenDaySavings}
                    </div>
                    <div className="text-sm text-gray-500">on 10 Days Plan</div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      Save ₹{savings.thirtyDaySavings}
                    </div>
                    <div className="text-sm text-gray-500">on 30 Days Plan</div>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card title="Plan Details" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['planDetails', 'days']}
                    label="Plan Duration (Days)"
                    rules={[
                      { required: true, message: 'Please enter plan duration' },
                      { type: 'number', min: 1, message: 'Duration must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="30"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['planDetails', 'totalThalis']}
                    label="Total Thalis"
                    rules={[
                      { required: true, message: 'Please enter total thalis' },
                      { type: 'number', min: 1, message: 'Total thalis must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="56"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['planDetails', 'pricePerThali']}
                    label="Price per Thali (₹)"
                    rules={[
                      { required: true, message: 'Please enter price per thali' },
                      { type: 'number', min: 1, message: 'Price must be positive' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      placeholder="65"
                      formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* Features & Options Tab */}
          <TabPane tab="Features & Options" key="features">
            <Form.Item
              name="dietaryOptions"
              label="Dietary Options"
              rules={[{ required: true, message: 'Please select dietary options' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select dietary options"
                style={{ width: '100%' }}
              >
                <Option value="vegetarian">Vegetarian</Option>
                <Option value="non-vegetarian">Non-Vegetarian</Option>
                <Option value="vegan">Vegan</Option>
                <Option value="jain">Jain</Option>
                <Option value="gluten-free">Gluten Free</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="tags"
              label="Tags"
            >
              <Select
                mode="tags"
                placeholder="Add tags (press Enter to add)"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="features"
              label="Features"
            >
              <Select
                mode="tags"
                placeholder="Add features (press Enter to add)"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Card title="Delivery Timing" className="mb-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['deliveryTiming', 'morning', 'enabled']}
                    label="Morning Delivery"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={['deliveryTiming', 'morning', 'time']}
                    label="Morning Time"
                  >
                    <Input type="time" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['deliveryTiming', 'evening', 'enabled']}
                    label="Evening Delivery"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={['deliveryTiming', 'evening', 'time']}
                    label="Evening Time"
                  >
                    <Input type="time" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>

        {/* Action Buttons */}
        <Divider />
        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading}
            icon={<SaveOutlined />}
          >
            {mealPlan ? "Update Meal Plan" : "Create Meal Plan"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default MealPlanEditor;




