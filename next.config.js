/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    domains: ['s.gravatar.com', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
