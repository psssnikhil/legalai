/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better debugging
  reactStrictMode: true,
  
  // Fast Refresh is enabled by default in development
  // This ensures UI updates automatically on file changes
  
  // Enable detailed logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  images: {
    domains: ['localhost'],
  },
  
  // Development options
  ...(process.env.NODE_ENV === 'development' && {
    // Disable telemetry in development
    telemetry: false,
  }),
}

module.exports = nextConfig
