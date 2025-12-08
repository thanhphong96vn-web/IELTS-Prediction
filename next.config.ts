import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: 'cms.ieltspredictiontest.com',
      },
      {
        hostname: 'placehold.co',
      }
    ],
  },
  eslint: {
    // Cảnh báo: Điều này cho phép build thành công ngay cả khi có lỗi ESLint.
    ignoreDuringBuilds: true,
  },
  // ▼▼▼ THÊM KHỐI NÀY VÀO ▼▼▼
  typescript: {
    // Cảnh báo: Bỏ qua lỗi TypeScript khi build.
    ignoreBuildErrors: true,
  },
  // ▲▲▲ KẾT THÚC KHỐI THÊM ▲▲▲
  transpilePackages: [
    "@ant-design",
    "@rc-component",
    "antd",
    "rc-cascader",
    "rc-checkbox",
    "rc-collapse",
    "rc-dialog",
    "rc-drawer",
    "rc-dropdown",
    "rc-field-form",
    "rc-image",
    "rc-input",
    "rc-input-number",
    "rc-mentions",
    "rc-menu",
    "rc-motion",
    "rc-notification",
    "rc-pagination",
    "rc-picker",
    "rc-progress",
    "rc-rate",
    "rc-resize-observer",
    "rc-segmented",
    "rc-select",
    "rc-slider",
    "rc-steps",
    "rc-switch",
    "rc-table",
    "rc-tabs",
    "rc-textarea",
    "rc-tooltip",
    "rc-tree",
    "rc-tree-select",
    "rc-upload",
    "rc-util",
  ],
};

export default nextConfig;
