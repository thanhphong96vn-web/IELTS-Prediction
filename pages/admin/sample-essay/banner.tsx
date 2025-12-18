import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { SampleEssayBannerConfig } from "../../../api/admin/sample-essay/banner";
import AdminLayout from "../_layout";

const { Panel } = Collapse;
const { TextArea } = Input;

function SampleEssayBannerPage() {
  const [config, setConfig] = useState<SampleEssayBannerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/sample-essay/banner");
      if (!res.ok) throw new Error("Không thể tải config");
      const data = await res.json();
      setConfig(data);
      // Convert description array to string for TextArea
      const formData = {
        ...data,
        writing: {
          ...data.writing,
          description: data.writing.description.join("\n"),
        },
        speaking: {
          ...data.speaking,
          description: data.speaking.description.join("\n"),
        },
      };
      form.setFieldsValue(formData);
    } catch {
      message.error("Lỗi khi tải config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Convert description string back to array
      const configData: SampleEssayBannerConfig = {
        writing: {
          ...values.writing,
          description:
            typeof values.writing.description === "string"
              ? values.writing.description
                  .split("\n")
                  .map((line: string) => line.trim())
                  .filter((line: string) => line.length > 0)
              : values.writing.description,
        },
        speaking: {
          ...values.speaking,
          description:
            typeof values.speaking.description === "string"
              ? values.speaking.description
                  .split("\n")
                  .map((line: string) => line.trim())
                  .filter((line: string) => line.length > 0)
              : values.speaking.description,
        },
      };

      const res = await fetch("/api/admin/sample-essay/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Lưu thất bại");

      message.success("Lưu config thành công");
      setConfig(configData);
      // Update form với description dạng string
      form.setFieldsValue({
        writing: {
          ...configData.writing,
          description: configData.writing.description.join("\n"),
        },
        speaking: {
          ...configData.speaking,
          description: configData.speaking.description.join("\n"),
        },
      });
    } catch {
      message.error("Có lỗi khi lưu config");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Đang tải config...</div>
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
              Quản lý Sample Essay Banner
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["writing", "speaking"]}>
            {/* Writing Banner */}
            <Panel header="Writing Banner" key="writing">
              <Form.Item
                name={["writing", "title", "line1"]}
                label="Title Line 1"
                rules={[
                  { required: true, message: "Vui lòng nhập title line 1" },
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
                    message: "Vui lòng nhập highlighted text",
                  },
                ]}
              >
                <Input placeholder="Task 1 Academic" />
                <p className="text-xs text-gray-500 mt-1">
                  Phần text này sẽ được underline với màu vàng
                </p>
              </Form.Item>
              <Form.Item
                name={["writing", "title", "line2", "after"]}
                label="Title Line 2 - Text After Highlighted"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập text sau highlighted",
                  },
                ]}
              >
                <Input placeholder="Sample" />
              </Form.Item>
              <Form.Item
                name={["writing", "description"]}
                label="Description (mỗi dòng một phần tử trong array)"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập description",
                  },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder={`Tổng hợp bài mẫu IELTS Exam Writing Task 1 và hướng dẫn cách làm bài,
từ vựng chi tiết theo chủ đề.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mỗi dòng sẽ là một phần tử trong mảng description
                </p>
              </Form.Item>
              <Form.Item
                name={["writing", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập button text",
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
                    message: "Vui lòng nhập button link",
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
                  { required: true, message: "Vui lòng nhập title line 1" },
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
                    message: "Vui lòng nhập highlighted text",
                  },
                ]}
              >
                <Input placeholder="Task 1 Academic" />
                <p className="text-xs text-gray-500 mt-1">
                  Phần text này sẽ được underline với màu vàng
                </p>
              </Form.Item>
              <Form.Item
                name={["speaking", "title", "line2", "after"]}
                label="Title Line 2 - Text After Highlighted"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập text sau highlighted",
                  },
                ]}
              >
                <Input placeholder="Sample" />
              </Form.Item>
              <Form.Item
                name={["speaking", "description"]}
                label="Description (mỗi dòng một phần tử trong array)"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập description",
                  },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder={`Tổng hợp bài mẫu IELTS Exam Speaking Task 1 và hướng dẫn cách làm bài,
từ vựng chi tiết theo chủ đề.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mỗi dòng sẽ là một phần tử trong mảng description
                </p>
              </Form.Item>
              <Form.Item
                name={["speaking", "button", "text"]}
                label="Button Text"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập button text",
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
                    message: "Vui lòng nhập button link",
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
              Lưu thay đổi
            </Button>
          </Space>
        </Form>
      </Card>
    </AdminLayout>
  );
}

export default SampleEssayBannerPage;

