/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle WalletConnect worker files
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: {
        loader: 'null-loader'
      }
    });

    return config;
  },
}

export default nextConfig
