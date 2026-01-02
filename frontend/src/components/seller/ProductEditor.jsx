import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Tabs,
  Table,
  Tag,
  message,
  Grid,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const ProductEditor = ({ product, visible, onCancel, onSave, screens }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("basic");
  const [weightOptions, setWeightOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        title: product.title,
        stock: product.stock,
      });
      // Initialize weight options with default values if not present
      const initializedWeightOptions = (product.weightOptions || []).map(option => ({
        ...option,
        originalPrice: option.originalPrice || option.price || 0,
        discountedPrice: option.discountedPrice || (option.discount ? 
          (option.price * (1 - (option.discount / 100))).toFixed(2) : 
          option.price || 0)
      }));
      setWeightOptions(initializedWeightOptions);
    }
  }, [product, form]);

  const handleAddWeightOption = () => {
    setWeightOptions([...weightOptions, { 
      weight: "", 
      originalPrice: 0,
      discountedPrice: 0,
      stock: 0 
    }]);
  };

  const handleWeightOptionChange = (optionIndex, field, value) => {
    const updatedOptions = [...weightOptions];
    updatedOptions[optionIndex][field] = value;
    setWeightOptions(updatedOptions);
  };

  const handleRemoveWeightOption = (optionIndex) => {
    setWeightOptions(weightOptions.filter((_, idx) => idx !== optionIndex));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
        // Process weight options to ensure all required fields are present
        const processedWeightOptions = weightOptions
          .filter(opt => opt.weight && opt.originalPrice >= 0)
          .map(opt => ({
            ...opt,
            price: opt.originalPrice, // Keep price for backward compatibility
            discountedPrice: parseFloat(opt.discountedPrice || 0).toFixed(2)
          }));

        const updatedProduct = {
          ...values,
          weightOptions: processedWeightOptions,
        };
        await onSave(updatedProduct);
        toast.success("Product updated successfully");
      } catch (err) {
        if (err.errorFields) {
          message.error("Please fill all required fields correctly");
        } else {
          message.error("Failed to save product. Please try again.");
        }
      } finally {
        setSaving(false);
      }
  };

  const getModalWidth = () => {
    if (screens.xs) return "95%";
    if (screens.sm) return "90%";
    if (screens.md) return "700px";
    return "800px";
  };

  const getTableColumns = () => {
    const baseColumns = [
      {
        title: "Weight",
        dataIndex: "weight",
        render: (text, record, optionIndex) => (
          <Input
            value={text}
            onChange={(e) =>
              handleWeightOptionChange(optionIndex, "weight", e.target.value)
            }
            placeholder="e.g., 1kg"
            size="small"
            className="text-xs"
          />
        ),
      },
      {
        title: "Original Price",
        dataIndex: "originalPrice",
        render: (text, record, optionIndex) => (
          <InputNumber
            value={text}
            onChange={(value) => {
              handleWeightOptionChange(optionIndex, "originalPrice", value);
              // Auto-calculate discounted price if discount exists
              if (record.discount) {
                const discountedPrice = value * (1 - (record.discount / 100));
                handleWeightOptionChange(optionIndex, "discountedPrice", parseFloat(discountedPrice.toFixed(2)));
              }
            }}
            min={0}
            step={0.01}
            size="small"
            className="text-xs"
            style={{ width: "100%" }}
          />
        ),
      },
      {
        title: "Discount %",
        dataIndex: "discount",
        render: (text, record, optionIndex) => (
          <InputNumber
            value={text || 0}
            onChange={(value) => {
              handleWeightOptionChange(optionIndex, "discount", value);
              // Auto-calculate discounted price when discount changes
              if (record.originalPrice) {
                const discount = value || 0;
                const discountedPrice = record.originalPrice * (1 - (discount / 100));
                handleWeightOptionChange(optionIndex, "discountedPrice", parseFloat(discountedPrice.toFixed(2)));
              }
            }}
            min={0}
            max={100}
            step={1}
            size="small"
            className="text-xs"
            style={{ width: "100%" }}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
          />
        ),
      },
      {
        title: "Discounted Price",
        dataIndex: "discountedPrice",
        render: (text, record, optionIndex) => (
          <InputNumber
            value={text}
            onChange={(value) => {
              handleWeightOptionChange(optionIndex, "discountedPrice", value);
              // Calculate discount percentage based on discounted price
              if (record.originalPrice && value) {
                const discount = ((record.originalPrice - value) / record.originalPrice) * 100;
                handleWeightOptionChange(optionIndex, "discount", parseFloat(discount.toFixed(2)));
              }
            }}
            min={0}
            step={0.01}
            size="small"
            className="text-xs"
            style={{ width: "100%" }}
          />
        ),
      },
      {
        title: "Stock",
        dataIndex: "stock",
        render: (text, record, optionIndex) => (
          <InputNumber
            value={text}
            onChange={(value) =>
              handleWeightOptionChange(optionIndex, "stock", value)
            }
            min={0}
            size="small"
            className="text-xs"
            style={{ width: "100%" }}
          />
        ),
      },
      {
        title: "Action",
        render: (text, record, optionIndex) => (
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveWeightOption(optionIndex)}
            className="text-xs"
          />
        ),
      },
    ];

    return screens.xs
      ? baseColumns.filter((col) => col.title !== "Action")
      : baseColumns;
  };

  return (
    <Modal
      title={`Edit: ${product?.title || "Product"}`}
      visible={visible}
      onCancel={onCancel}
      width={getModalWidth()}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          size={screens.xs ? "small" : "middle"}
        >
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSubmit}
          loading={saving}
          disabled={saving}
          size={screens.xs ? "small" : "middle"}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>,
      ]}
      styles={{
        body: { padding: screens.xs ? "12px" : "24px" }
      }}
      className="text-xs md:text-sm"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size={screens.xs ? "small" : "middle"}
      >
        <TabPane tab="Basic" key="basic">
          <Form form={form} layout="vertical" className="text-xs md:text-sm">
            <Form.Item
              name="title"
              label="Product Name"
              rules={[{ required: true }]}
            >
              <Input
                size={screens.xs ? "small" : "middle"}
                className="text-xs md:text-sm"
              />
            </Form.Item>
            {/* Removed base price and discount fields as they're now in weight options */}
            <Form.Item
              name="stock"
              label="Base Stock"
              rules={[{ required: true, type: "number", min: 0 }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                size={screens.xs ? "small" : "middle"}
                className="text-xs md:text-sm"
              />
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Weight Options" key="weight">
          <div className="mb-2 md:mb-4">
            <Button
              type="dashed"
              onClick={handleAddWeightOption}
              icon={<PlusOutlined />}
              size={screens.xs ? "small" : "middle"}
              className="text-xs md:text-sm"
            >
              {screens.xs ? "Add" : "Add Weight Option"}
            </Button>
          </div>

          <Table
            dataSource={weightOptions}
            rowKey={(record, index) => index}
            pagination={false}
            columns={getTableColumns()}
            scroll={screens.xs ? { x: 300 } : undefined}
            size={screens.xs ? "small" : "middle"}
            className="text-xs md:text-sm"
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default ProductEditor;
