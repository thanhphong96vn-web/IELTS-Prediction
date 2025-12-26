import { useState } from "react";
import { Layout, Menu } from "antd";
import { useRouter } from "next/router";
import {
  HomeOutlined,
  FileTextOutlined,
  BookOutlined,
  CreditCardOutlined,
  FileSearchOutlined,
  MenuOutlined,
  GlobalOutlined,
  DollarOutlined,
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
    key: "subscription",
    icon: <CreditCardOutlined />,
    label: "Subscription",
    children: [
      {
        key: "/admin/subscription/course-packages",
        label: "Course Packages",
      },
      {
        key: "/admin/subscription/faq",
        label: "FAQ",
      },
    ],
  },
  {
    key: "sample-essay",
    icon: <FileSearchOutlined />,
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
    icon: <MenuOutlined />,
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
    icon: <GlobalOutlined />,
    label: "Footer",
    children: [
      {
        key: "/admin/footer/cta-banner",
        label: "CTA Banner",
      },
    ],
  },
  {
    key: "legal",
    icon: <FileTextOutlined />,
    label: "Legal Pages",
    children: [
      {
        key: "/admin/terms-of-use",
        label: "Terms of Service",
      },
      {
        key: "/admin/privacy-policy",
        label: "Privacy Policy",
      },
    ],
  },
  {
    key: "affiliate",
    icon: <DollarOutlined />,
    label: "Affiliate",
    children: [
      {
        key: "/admin/affiliate/users",
        label: "Quản lý Affiliate",
      },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

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
        width={260}
        theme="light"
        style={{
          overflow: "hidden",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 64,
            margin: "0 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
            fontWeight: "bold",
            fontSize: 20,
            color: "#d94a56",
            borderBottom: "2px solid #f0f0f0",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          <span style={{ letterSpacing: "0.5px" }}>Admin Panel</span>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: 16,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              borderRight: 0,
              padding: "8px 0",
            }}
            theme="light"
          />
        </div>
      </Sider>
      <Layout
        style={{
          marginLeft: 260,
        }}
      >
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {children}
        </Content>
      </Layout>

      <style jsx global>{`
        /* Custom styles for Admin Menu */
        .ant-menu-item {
          margin: 4px 8px !important;
          border-radius: 6px !important;
          height: 40px !important;
          line-height: 40px !important;
          transition: all 0.2s !important;
        }

        .ant-menu-item-selected {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
          font-weight: 500 !important;
        }

        .ant-menu-item-selected::after {
          display: none !important;
        }

        .ant-menu-item:hover {
          background-color: #f5f5f5 !important;
          color: #1890ff !important;
        }

        .ant-menu-submenu-title {
          margin: 4px 8px !important;
          border-radius: 6px !important;
          height: 40px !important;
          line-height: 40px !important;
          transition: all 0.2s !important;
        }

        .ant-menu-submenu-title:hover {
          background-color: #f5f5f5 !important;
          color: #1890ff !important;
        }

        .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #1890ff !important;
          font-weight: 500 !important;
        }

        .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #1890ff !important;
        }

        .ant-menu-submenu-arrow {
          color: #666 !important;
          transition: all 0.3s !important;
        }

        .ant-menu-submenu-open > .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #1890ff !important;
        }

        .ant-menu-submenu-inline .ant-menu-submenu-title .ant-menu-submenu-arrow {
          right: 16px !important;
        }

        .ant-menu-inline .ant-menu-item {
          padding-left: 48px !important;
        }

        .ant-menu-inline .ant-menu-item::before {
          display: none !important;
        }

        .ant-menu-item-icon {
          font-size: 16px !important;
          margin-right: 12px !important;
        }

        .ant-menu-submenu-title .ant-menu-item-icon {
          margin-right: 0px !important;
        }

        .ant-layout-sider-trigger {
          background: #fafafa !important;
          border-top: 1px solid #f0f0f0 !important;
        }

        .ant-layout-sider-trigger:hover {
          background: #f0f0f0 !important;
        }

        /* Custom scrollbar for menu container */
        .ant-layout-sider > div:nth-child(2)::-webkit-scrollbar {
          width: 6px;
        }

        .ant-layout-sider > div:nth-child(2)::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .ant-layout-sider > div:nth-child(2)::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .ant-layout-sider > div:nth-child(2)::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Ensure menu items are clickable */
        .ant-menu {
          padding-bottom: 16px !important;
        }
      `}</style>
    </Layout>
  );
}
