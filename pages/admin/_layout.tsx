import { useState } from "react";
import { Layout, Menu } from "antd";
import { useRouter } from "next/router";
import {
  HomeOutlined,
  FileTextOutlined,
  BookOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  {
    key: "home",
    icon: <HomeOutlined />,
    label: "Home",
    children: [
      {
        key: "/admin/home/banner",
        label: "Hero Banner",
      },
      {
        key: "/admin/home/test-platform-intro",
        label: "Test Platform Intro",
      },
      {
        key: "/admin/home/why-choose-us",
        label: "Why Choose Us",
      },
      {
        key: "/admin/home/testimonials",
        label: "Testimonials",
      },
    ],
  },
  {
    key: "exam-library",
    icon: <FileTextOutlined />,
    label: "IELTS Exam Library",
    children: [
      {
        key: "/admin/ielts-exam-library/hero-banner",
        label: "Hero Banner",
      },
    ],
  },
  {
    key: "practice-library",
    icon: <BookOutlined />,
    label: "IELTS Practice Library",
    children: [
      {
        key: "/admin/ielts-practice-library/banner",
        label: "Banner",
      },
    ],
  },
  {
    key: "sample-essay",
    icon: <EditOutlined />,
    label: "Sample Essay",
    children: [
      {
        key: "/admin/sample-essay/banner",
        label: "Banner",
      },
    ],
  },
  {
    key: "header",
    icon: <EditOutlined />,
    label: "Header",
    children: [
      {
        key: "/admin/header/top-bar",
        label: "Top Bar",
      },
    ],
  },
  {
    key: "footer",
    icon: <EditOutlined />,
    label: "Footer",
    children: [
      {
        key: "/admin/footer/cta-banner",
        label: "CTA Banner",
      },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key && typeof e.key === "string" && e.key.startsWith("/")) {
      router.push(e.key);
    }
  };

  // Find current key based on pathname
  const getSelectedKeys = () => {
    const path = router.asPath;
    for (const item of menuItems) {
      if (item && "children" in item && item.children) {
        for (const child of item.children) {
          if (child?.key === path) {
            return [path as string];
          }
        }
      }
    }
    return [];
  };

  const getOpenKeys = () => {
    const path = router.asPath;
    for (const item of menuItems) {
      if (item && "children" in item && item.children) {
        for (const child of item.children) {
          if (child?.key === path) {
            return [item.key as string];
          }
        }
      }
    }
    return ["home"]; // Default open Home section
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        theme="light"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: 18,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {!collapsed ? "Admin Panel" : "AP"}
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#fff",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
