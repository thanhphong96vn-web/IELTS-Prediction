import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { ExamLibraryHeroConfig } from "../../../api/admin/ielts-exam-library/hero-banner";
import AdminLayout from "../_layout";

const { Panel } = Collapse;

function ExamLibraryHeroBannerPage() {
  const [config, setConfig] = useState<ExamLibraryHeroConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/ielts-exam-library/hero-banner");
      if (!res.ok) throw new Error("Không thể tải config");
      const data = await res.json();
      setConfig(data);
      form.setFieldsValue(data);
    } catch {
      message.error("Lỗi khi tải config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/admin/ielts-exam-library/hero-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Lưu thất bại");

      message.success("Lưu config thành công");
      setConfig(values);
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
              Quản lý IELTS Exam Library Hero
            </h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse defaultActiveKey={["hero"]}>
            <Panel header="Hero Banner" key="hero">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Vui lòng nhập title" }]}
              >
                <Input placeholder="IELTS Exam Library" />
              </Form.Item>
              <Form.Item
                name={["breadcrumb", "homeLabel"]}
                label="Breadcrumb Home Label"
                rules={[
                  { required: true, message: "Vui lòng nhập breadcrumb home" },
                ]}
              >
                <Input placeholder="Home" />
              </Form.Item>
              <Form.Item
                name={["breadcrumb", "currentLabel"]}
                label="Breadcrumb Current Label"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập breadcrumb current",
                  },
                ]}
              >
                <Input placeholder="IELTS Exam Library" />
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

export default ExamLibraryHeroBannerPage;


