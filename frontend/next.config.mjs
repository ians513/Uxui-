/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
    formats: ['image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
}

export default nextConfig
