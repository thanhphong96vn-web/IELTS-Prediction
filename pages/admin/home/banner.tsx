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
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Set form values mỗi khi config thay đổi
    if (config) {
      console.log("Config loaded, setting form values:", config);
      
      // Đảm bảo featureCards có avatars là array (không phải undefined/null)
      // Filter out invalid URLs (fakepath, empty strings)
      const normalizedConfig = {
        ...config,
        featureCards: (config.featureCards || []).map((card: any) => ({
          ...card,
          avatars: Array.isArray(card.avatars) 
            ? card.avatars.filter((url: string) => {
                if (!url || !url.trim()) return false;
                if (url.includes('fakepath') || url.includes('C:\\') || url.includes('C:/')) return false;
                return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
              })
            : [],
        })),
      };
      
      console.log("Normalized config:", normalizedConfig);
      
      // Set form values với normalized config
      // Không reset form để giữ Form.List state
      form.setFieldsValue(normalizedConfig);
      setIsFormInitialized(true);
    }
  }, [config, form]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/home/hero-banner");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      console.log("Fetched config from API:", data);
      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      message.error("Error loading config");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("Saving form values:", values);
      setSaving(true);

      const res = await fetch("/api/admin/home/hero-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Save failed");
      }

      const result = await res.json();
      console.log("Save response:", result);
      
      message.success("Config saved successfully");
      
      // Reload config sau khi save để đảm bảo đồng bộ
      await fetchConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      message.error(error instanceof Error ? error.message : "Error saving config");
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
        <Form 
          form={form} 
          layout="vertical" 
          preserve={false}
          validateTrigger="onBlur"
        >
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
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 1" }]}
              >
                <Input placeholder="Education Is The Best" />
              </Form.Item>
              <Form.Item
                name={["headline", "line2"]}
                label="Line 2"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 2" }]}
              >
                <Input placeholder="Key" />
              </Form.Item>
              <Form.Item
                name={["headline", "line3"]}
                label="Line 3"
                preserve={true}
                validateTrigger="onBlur"
                rules={[{ required: true, message: "Please enter line 3" }]}
              >
                <Input placeholder="Success" />
              </Form.Item>
              <Form.Item
                name={["headline", "line4"]}
                label="Line 4"
                preserve={true}
                validateTrigger="onBlur"
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
            </Panel>

            {/* Banner Image Section */}
            <Panel header="Banner Image" key="banner">
              <Form.Item
                name="backgroundImage"
                label="Background Image"
                rules={[
                  { required: true, message: "Please upload background image" },
                ]}
              >
                <ImageUpload />
              </Form.Item>
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
              <Form.List 
                name="featureCards"
                initialValue={config?.featureCards || []}
              >
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
                        <Form.List 
                          name={[field.name, "avatars"]}
                          initialValue={config?.featureCards?.[index]?.avatars || []}
                        >
                          {(
                            avatarFields,
                            { add: addAvatar, remove: removeAvatar }
                          ) => {
                            // Debug: Log avatar fields
                            console.log(`Card ${index + 1} avatar fields:`, avatarFields);
                            return (
                              <>
                                {avatarFields.map((avatarField) => {
                                  console.log(`Rendering avatar field:`, avatarField);
                                  return (
                                    <Form.Item
                                      key={avatarField.key}
                                      name={avatarField.name}
                                      label={`Avatar ${avatarField.name + 1}`}
                                      preserve={true}
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
                                  );
                                })}
                                <Button
                                  type="dashed"
                                  onClick={() => {
                                    console.log(`Adding avatar to card ${index + 1}`);
                                    addAvatar();
                                  }}
                                  className="w-full"
                                >
                                  + Add Avatar
                                </Button>
                              </>
                            );
                          }}
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
