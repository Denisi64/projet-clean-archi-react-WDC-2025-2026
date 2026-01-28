import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@proj/domain": path.resolve(__dirname, "../../packages/domain/src"),
      "@proj/application": path.resolve(__dirname, "../../packages/application/src"),
      "@proj/infra": path.resolve(__dirname, "../../packages/infrastructure/infra/src"),
    };

    return config;
  },
};

export default withNextIntl(nextConfig);
