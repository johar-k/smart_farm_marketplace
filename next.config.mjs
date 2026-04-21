/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.11', '10.235.49.156', '10.11.6.94','10.249.138.156'],
}

export default nextConfig