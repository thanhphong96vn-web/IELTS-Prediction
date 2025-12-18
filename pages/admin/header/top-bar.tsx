import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Collapse, message } from "antd";
import AdminLayout from "../_layout";
import type { TopBarConfig } from "../../../api/admin/header/top-bar";

const { Panel } = Collapse;

export default function TopBarAdminPage() {
  const [form] = Form.useForm<TopBarConfig>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/header/top-bar");
      if (res.ok) {
        const data = await res.json();
        form.setFieldsValue(data);
      }
    } catch (error) {
      message.error("Không tải được config");
    }
  };

  const handleSubmit = async (values: TopBarConfig) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/header/top-bar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success("Lưu thành công");
      } else {
        const data = await res.json();
        message.error(data.message || "Lưu thất bại");
      }
    } catch (error) {
      message.error("Lưu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Card title="Quản lý Top Bar">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            facebookFollowers: "500k Followers",
            phoneNumber: "",
            promotionalBanner: {
              buttonText: "Hot",
              emoji: "👋",
              text: "Intro price. Get {siteName} for Big Sale -95% off.",
            },
            socialLinks: {
              enabled: true,
              customLinks: [],
            },
          }}
        >
          <Collapse defaultActiveKey={["1", "2", "3"]}>
            <Panel header="Facebook Followers" key="1">
              <Form.Item
                name="facebookFollowers"
                label="Text hiển thị"
                rules={[{ required: true, message: "Vui lòng nhập text" }]}
              >
                <Input placeholder="500k Followers" />
              </Form.Item>
            </Panel>

            <Panel header="Phone Number" key="2">
              <Form.Item
                name="phoneNumber"
                label="Số điện thoại"
                extra="Để trống để dùng số điện thoại từ General Settings"
              >
                <Input placeholder="+84 123 456 789" />
              </Form.Item>
            </Panel>

            <Panel header="Promotional Banner" key="3">
              <Form.Item
                name={["promotionalBanner", "buttonText"]}
                label="Text Button"
                rules={[
                  { required: true, message: "Vui lòng nhập text button" },
                ]}
              >
                <Input placeholder="Hot" />
              </Form.Item>

              <Form.Item
                name={["promotionalBanner", "emoji"]}
                label="Emoji"
                rules={[{ required: true, message: "Vui lòng nhập emoji" }]}
              >
                <Input placeholder="👋" />
              </Form.Item>

              <Form.Item
                name={["promotionalBanner", "text"]}
                label="Text"
                rules={[{ required: true, message: "Vui lòng nhập text" }]}
                extra="Sử dụng {siteName} để hiển thị tên site động"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Intro price. Get {siteName} for Big Sale -95% off."
                />
              </Form.Item>
            </Panel>
          </Collapse>

          <Form.Item
            style={{
              marginTop: 24,
              justifyContent: "flex-end",
              display: "flex",
            }}
          >
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AdminLayout>
  );
}
