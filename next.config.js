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
  
  // Use Vercel's URL for NextAuth in production
  env: {
    NEXTAUTH_URL: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Development options
  ...(process.env.NODE_ENV === 'development' && {
    // Disable telemetry in development
    // telemetry: false,
  }),
}

module.exports = nextConfig
