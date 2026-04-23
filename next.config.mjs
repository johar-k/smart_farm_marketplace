/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '10.0.0.0/8',
    '192.168.0.0/16',
    '172.16.0.0/12',
    '10.153.2.156',
    '10.249.138.156',
    '10.235.49.156',
    '192.168.1.11',
    '10.234.26.156',
  ],
}

export default nextConfig