import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */  
  images: {
    domains: ['example.com', 'another-example.com'], // Add your allowed image domains here
  },
    async rewrites() {
    		return [
    			{
    				source: '/api/c15t/:path*',
    				destination: `${process.env.NEXT_PUBLIC_C15T_URL}/:path*`,
    			},
    		];
    	}
};

export default nextConfig;
