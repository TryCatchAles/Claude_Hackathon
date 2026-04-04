import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Mark googleapis as a server-only package so Next.js does not attempt to
  // bundle it for the edge runtime or the browser bundle.
  serverExternalPackages: ['googleapis'],
}

export default nextConfig
