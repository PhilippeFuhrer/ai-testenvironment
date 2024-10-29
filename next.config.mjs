/** @type {import('next').NextConfig} */

const nextConfig = {
  serverRuntimeConfig: {
    vpnServerIP: process.env.VPN_SERVER_IP || "0.0.0.0", // Default to '0.0.0.0' if no specific IP is set
  },
};

export default nextConfig;
