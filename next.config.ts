import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许所有来源的跨域请求（仅开发环境）
  allowedDevOrigins: [
    "http://192.168.0.103:3000",
    "http://192.168.0.103:3001",
    "http://192.168.0.103",
    "http://localhost:3000",
    "http://0.0.0.0:3000"
  ],
  // 配置跨域请求头
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS, CONNECT, TRACE",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;