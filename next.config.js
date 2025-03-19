/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
      {
        protocol: "http",
        hostname: "*",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/inline'
    });
    
    config.module.rules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('woff2')) {
        rule.exclude = /\.woff2$/;
      }
    });
    
    return config;
  }
};

module.exports = nextConfig;
