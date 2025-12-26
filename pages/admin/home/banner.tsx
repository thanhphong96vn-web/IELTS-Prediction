import { useEffect, useState } from "react";
import { Button, Input, Form, Card, Space, Collapse, message } from "antd";
import type { HeroBannerConfig } from "@/shared/types/admin-config";
import { ImageUpload } from "@/shared/ui/image-upload";
import AdminLayout from "../_layout";

const { Panel } = Collapse;

function HeroBannerPage() {
  const [config, setConfig] = useState<HeroBannerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/hero-banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
      form.setFieldsValue(data);
    } catch {
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/admin/home/hero-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Save failed");

      message.success("Config saved successfully");
      setConfig(values);
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
            <h1 className="text-2xl font-bold m-0">Manage Hero Banner</h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={config}>
          <Collapse
            defaultActiveKey={[
              "trustpilot",
              "headline",
              "description",
              "buttons",
              "banner",
              "featureCards",
            ]}
          >
            {/* Trustpilot Section */}
            <Panel header="Trustpilot Rating" key="trustpilot">
              <Form.Item
                name={["trustpilot", "rating"]}
                label="Rating Text"
                rules={[{ required: true, message: "Please enter rating" }]}
              >
                <Input placeholder="Excellent 4.9 out of 5" />
              </Form.Item>
              <Form.Item
                name={["trustpilot", "image"]}
                label="Trustpilot Image"
                rules={[
                  { required: true, message: "Please upload image" },
                ]}
              >
                <ImageUpload />
              </Form.Item>
            </Panel>

            {/* Headline Section */}
            <Panel header="Headline" key="headline">
              <Form.Item
                name={["headline", "line1"]}
                label="Line 1"
                rules={[{ required: true, message: "Please enter line 1" }]}
              >
                <Input placeholder="Education Is The Best" />
              </Form.Item>
              <Form.Item
                name={["headline", "line2"]}
                label="Line 2"
                rules={[{ required: true, message: "Please enter line 2" }]}
              >
                <Input placeholder="Key" />
              </Form.Item>
              <Form.Item
                name={["headline", "line3"]}
                label="Line 3"
                rules={[{ required: true, message: "Please enter line 3" }]}
              >
                <Input placeholder="Success" />
              </Form.Item>
              <Form.Item
                name={["headline", "line4"]}
                label="Line 4"
                rules={[{ required: true, message: "Please enter line 4" }]}
              >
                <Input placeholder="In Life" />
              </Form.Item>
            </Panel>

            {/* Description Section */}
            <Panel header="Description" key="description">
              <Form.Item
                name={["description", "text"]}
                label="Main Text"
                rules={[
                  { required: true, message: "Please enter main text" },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint."
                />
              </Form.Item>
              <Form.Item
                name={["description", "highlightText"]}
                label="Highlight Text"
                rules={[
                  { required: true, message: "Please enter highlight text" },
                ]}
              >
                <Input placeholder="Velit officia consequat." />
              </Form.Item>
            </Panel>

            {/* Buttons Section */}
            <Panel header="Buttons" key="buttons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card size="small" title="Primary Button">
                  <Form.Item
                    name={["buttons", "primary", "text"]}
                    label="Text"
                    rules={[
                      {
                        required: true,
                        message: "Please enter button text",
                      },
                    ]}
                  >
                    <Input placeholder="Get Started" />
                  </Form.Item>
                  <Form.Item
                    name={["buttons", "primary", "link"]}
                    label="Link"
                    rules={[{ required: true, message: "Please enter link" }]}
                  >
                    <Input placeholder="/account/register" />
                  </Form.Item>
                </Card>
                <Card size="small" title="Secondary Button">
                  <Form.Item
                    name={["buttons", "secondary", "text"]}
                    label="Text"
                    rules={[
                      {
                        required: true,
                        message: "Please enter button text",
                      },
                    ]}
                  >
                    <Input placeholder="Watch Video" />
                  </Form.Item>
                  <Form.Item
                    name={["buttons", "secondary", "link"]}
                    label="Link"
                    rules={[{ required: true, message: "Please enter link" }]}
                  >
                    <Input placeholder="#" />
                  </Form.Item>
                </Card>
              </div>
            </Panel>

            {/* Banner Image Section */}
            <Panel header="Banner Image" key="banner">
              <Form.Item
                name="bannerImage"
                label="Banner Image"
                rules={[
                  { required: true, message: "Please upload image" },
                ]}
              >
                <ImageUpload />
              </Form.Item>
              <Form.Item
                name={["decorativeShape", "image"]}
                label="Decorative Shape Image"
                rules={[
                  { required: true, message: "Please upload image" },
                ]}
              >
                <ImageUpload />
              </Form.Item>
            </Panel>

            {/* Feature Cards Section */}
            <Panel header="Feature Cards" key="featureCards">
              <Form.List name="featureCards">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Card ${index + 1}`}
                        className="mb-4"
                        extra={
                          <Button
                            type="link"
                            danger
                            onClick={() => remove(field.name)}
                          >
                            Delete
                          </Button>
                        }
                      >
                        <Form.Item
                          name={[field.name, "icon"]}
                          label="Icon"
                          rules={[
                            {
                              required: true,
                              message: "Please upload icon",
                            },
                          ]}
                        >
                          <ImageUpload />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "title"]}
                          label="Title (optional)"
                        >
                          <Input placeholder="Your" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "value"]}
                          label="Value (optional)"
                        >
                          <Input placeholder="36k+" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "subtitle"]}
                          label="Subtitle"
                          rules={[
                            {
                              required: true,
                              message: "Please enter subtitle",
                            },
                          ]}
                        >
                          <Input placeholder="Admission Complete" />
                        </Form.Item>
                        <Form.List name={[field.name, "avatars"]}>
                          {(
                            avatarFields,
                            { add: addAvatar, remove: removeAvatar }
                          ) => (
                            <>
                              {avatarFields.map((avatarField) => (
                                <Form.Item
                                  key={avatarField.key}
                                  name={avatarField.name}
                                  label={`Avatar ${avatarField.name + 1}`}
                                >
                                  <div className="space-y-2">
                                    <ImageUpload />
                                    <Button
                                      type="link"
                                      danger
                                      onClick={() =>
                                        removeAvatar(avatarField.name)
                                      }
                                      className="p-0"
                                    >
                                      Delete this Avatar
                                    </Button>
                                  </div>
                                </Form.Item>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => addAvatar()}
                                className="w-full"
                              >
                                + Add Avatar
                              </Button>
                            </>
                          )}
                        </Form.List>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      className="w-full"
                    >
                      + Add Feature Card
                    </Button>
                  </>
                )}
              </Form.List>
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

export default HeroBannerPage;
