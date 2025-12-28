import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Form,
  Card,
  Space,
  Collapse,
  message,
  Divider,
} from "antd";
import type { SampleEssayBannerConfig } from "../../../api/admin/sample-essay/banner";
import AdminLayout from "../_layout";

const { Panel } = Collapse;

function SampleEssayBannerPage() {
  const [config, setConfig] = useState<SampleEssayBannerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật form khi config thay đổi
  useEffect(() => {
    if (config) {
      console.log("Setting form values with config:", config);
      // Set lại giá trị với cấu trúc đầy đủ, không reset để tránh mất giá trị
      form.setFieldsValue({
        writing: {
          title: {
            line1: config.writing.title.line1,
            line2: {
              highlighted: config.writing.title.line2.highlighted,
              after: config.writing.title.line2.after,
            },
          },
          description: {
            line1: config.writing.description.line1,
            line2: config.writing.description.line2,
          },
          backgroundColor: config.writing.backgroundColor,
          button: {
            text: config.writing.button.text,
            link: config.writing.button.link,
          },
        },
        speaking: {
          title: {
            line1: config.speaking.title.line1,
            line2: {
              highlighted: config.speaking.title.line2.highlighted,
              after: config.speaking.title.line2.after,
            },
          },
          description: {
            line1: config.speaking.description.line1,
            line2: config.speaking.description.line2,
          },
          backgroundColor: config.speaking.backgroundColor,
          button: {
            text: config.speaking.button.text,
            link: config.speaking.button.link,
          },
        },
      });
      // Kiểm tra xem giá trị đã được set chưa
      const currentValues = form.getFieldsValue();
      console.log("Form values after setFieldsValue:", currentValues);
      console.log(
        "Writing title line2 highlighted:",
        currentValues?.writing?.title?.line2?.highlighted
      );
    }
  }, [config, form]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/sample-essay/banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      console.log("Fetched config data:", data);
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const configData: SampleEssayBannerConfig = {
        writing: values.writing,
        speaking: values.speaking,
      };

      const res = await fetch("/api/admin/sample-essay/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
      await fetchConfig();
    } catch {
      message.error("Error saving config");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading config...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card
        title={
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold m-0">
              Manage Sample Essay Banner
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Collapse defaultActiveKey={["writing", "speaking"]}>
            {/* Writing Banner */}
            <Panel header="Writing Banner" key="writing">
              <Form.Item
                name={["writing", "title", "line1"]}
                label="Title Line 1"
                rules={[
                  { required: true, message: "Please enter title line 1" },
                ]}
              >
                <Input placeholder="DOL IELTS Writing" />
              </Form.Item>
              <Form.Item
                name={["writing", "title", "line2", "highlighted"]}
                label="Title Line 2 - Highlighted Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter highlighted text",
                  },
                ]}
              >
                <Input placeholder="Task 1 Academic" />
                <p className="text-xs text-gray-500 mt-1">
                  This text will be underlined with yellow color
                </p>
              </Form.Item>
              <Form.Item
                name={["writing", "title", "line2", "after"]}
                label="Title Line 2 - Text After Highlighted"
                rules={[
                  {
                    required: true,
                    message: "Please enter text after highlighted",
                  },
                ]}
              >
                <Input placeholder="Sample" />
              </Form.Item>
              <Divider orientation="left">Description</Divider>
              <Form.Item
                name={["writing", "description", "line1"]}
                label="Line 1"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 1",
                  },
                ]}
              >
                <Input placeholder="Tổng hợp bài mẫu IELTS Exam Writing Task 1 và hướng dẫn cách làm bài," />
              </Form.Item>
              <Form.Item
                name={["writing", "description", "line2"]}
                label="Line 2"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 2",
                  },
                ]}
              >
                <Input placeholder="từ vựng chi tiết theo chủ đề." />
              </Form.Item>
              <Form.Item
                name={["writing", "backgroundColor"]}
                label="Background Color/Gradient"
                rules={[
                  { required: true, message: "Please enter background color" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%) hoặc #ffffff"
              >
                <Input placeholder="linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)" />
              </Form.Item>
              <Form.Item
                name={["writing", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter button text",
                  },
                ]}
              >
                <Input placeholder="Tìm hiểu khóa học" />
              </Form.Item>
              <Form.Item
                name={["writing", "button", "link"]}
                label="Button Link"
                rules={[
                  {
                    required: true,
                    message: "Please enter button link",
                  },
                ]}
              >
                <Input placeholder="#" />
              </Form.Item>
            </Panel>

            {/* Speaking Banner */}
            <Panel header="Speaking Banner" key="speaking">
              <Form.Item
                name={["speaking", "title", "line1"]}
                label="Title Line 1"
                rules={[
                  { required: true, message: "Please enter title line 1" },
                ]}
              >
                <Input placeholder="DOL IELTS Speaking" />
              </Form.Item>
              <Form.Item
                name={["speaking", "title", "line2", "highlighted"]}
                label="Title Line 2 - Highlighted Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter highlighted text",
                  },
                ]}
              >
                <Input placeholder="Task 1 Academic" />
                <p className="text-xs text-gray-500 mt-1">
                  This text will be underlined with yellow color
                </p>
              </Form.Item>
              <Form.Item
                name={["speaking", "title", "line2", "after"]}
                label="Title Line 2 - Text After Highlighted"
                rules={[
                  {
                    required: true,
                    message: "Please enter text after highlighted",
                  },
                ]}
              >
                <Input placeholder="Sample" />
              </Form.Item>
              <Divider orientation="left">Description</Divider>
              <Form.Item
                name={["speaking", "description", "line1"]}
                label="Line 1"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 1",
                  },
                ]}
              >
                <Input placeholder="Tổng hợp bài mẫu IELTS Exam Speaking Task 1 và hướng dẫn cách làm bài," />
              </Form.Item>
              <Form.Item
                name={["speaking", "description", "line2"]}
                label="Line 2"
                rules={[
                  {
                    required: true,
                    message: "Please enter line 2",
                  },
                ]}
              >
                <Input placeholder="từ vựng chi tiết theo chủ đề." />
              </Form.Item>
              <Form.Item
                name={["speaking", "backgroundColor"]}
                label="Background Color/Gradient"
                rules={[
                  { required: true, message: "Please enter background color" },
                ]}
                extra="Ví dụ: linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%) hoặc #ffffff"
              >
                <Input placeholder="linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)" />
              </Form.Item>
              <Form.Item
                name={["speaking", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Please enter button text",
                  },
                ]}
              >
                <Input placeholder="Tìm hiểu khóa học" />
              </Form.Item>
              <Form.Item
                name={["speaking", "button", "link"]}
                label="Button Link"
                rules={[
                  {
                    required: true,
                    message: "Please enter button link",
                  },
                ]}
              >
                <Input placeholder="#" />
              </Form.Item>
            </Panel>
          </Collapse>

          <Space className="mt-6 w-full justify-end">
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              size="large"
            >
              Save changes
            </Button>
          </Space>
        </Form>
      </Card>
    </AdminLayout>
  );
}

export default SampleEssayBannerPage;
