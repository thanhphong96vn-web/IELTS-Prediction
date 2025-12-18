import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { PracticeLibraryBannerConfig } from "../../../api/admin/ielts-practice-library/banner";
import AdminLayout from "../_layout";
import Link from "next/link";

const { Panel } = Collapse;
const { TextArea } = Input;

function PracticeLibraryBannerPage() {
  const [config, setConfig] = useState<PracticeLibraryBannerConfig | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/ielts-practice-library/banner");
      if (!res.ok) throw new Error("Không thể tải config");
      const data = await res.json();
      setConfig(data);
      // Convert description array to string for TextArea
      const formData = {
        ...data,
        listening: {
          ...data.listening,
          description: data.listening.description.join("\n"),
        },
        reading: {
          ...data.reading,
          description: data.reading.description.join("\n"),
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
      const configData: PracticeLibraryBannerConfig = {
        listening: {
          ...values.listening,
          description:
            typeof values.listening.description === "string"
              ? values.listening.description
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0)
              : values.listening.description,
        },
        reading: {
          ...values.reading,
          description:
            typeof values.reading.description === "string"
              ? values.reading.description
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0)
              : values.reading.description,
        },
      };

      const res = await fetch("/api/admin/ielts-practice-library/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Lưu thất bại");

      message.success("Lưu config thành công");
      setConfig(configData);
      // Update form với description dạng string
      form.setFieldsValue({
        listening: {
          ...configData.listening,
          description: configData.listening.description.join("\n"),
        },
        reading: {
          ...configData.reading,
          description: configData.reading.description.join("\n"),
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
              Quản lý Practice Library Banner
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["listening", "reading"]}>
            {/* Listening Banner */}
            <Panel header="Listening Banner" key="listening">
              <Form.Item
                name={["listening", "title"]}
                label="Title"
                rules={[
                  { required: true, message: "Vui lòng nhập title" },
                ]}
              >
                <Input placeholder="IELTS Listening Practice Tests" />
              </Form.Item>
              <Form.Item
                name={["listening", "description"]}
                label="Description (mỗi dòng một phần tử trong array)"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập description",
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder={`IELTS Listening Practice Tests Online miễn phí tại DOL Academy với đề
thi, audio, transcript, answer key, giải thích chi tiết từ vựng đi kèm và
trải nghiệm làm bài thi thử như trên máy.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mỗi dòng sẽ là một phần tử trong mảng description
                </p>
              </Form.Item>
              <Form.Item
                name={["listening", "button", "text"]}
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
                name={["listening", "button", "link"]}
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

            {/* Reading Banner */}
            <Panel header="Reading Banner" key="reading">
              <Form.Item
                name={["reading", "title"]}
                label="Title"
                rules={[
                  { required: true, message: "Vui lòng nhập title" },
                ]}
              >
                <Input placeholder="IELTS Reading Practice Tests" />
              </Form.Item>
              <Form.Item
                name={["reading", "description"]}
                label="Description (mỗi dòng một phần tử trong array)"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập description",
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder={`IELTS Reading Practice Tests Online miễn phí tại DOL Academy với đề
thi, transcript, answer key, giải thích chi tiết từ vựng đi kèm và
trải nghiệm làm bài thi thử như trên máy.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mỗi dòng sẽ là một phần tử trong mảng description
                </p>
              </Form.Item>
              <Form.Item
                name={["reading", "button", "text"]}
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
                name={["reading", "button", "link"]}
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

export default PracticeLibraryBannerPage;

