import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Node.js modules used by the automation system
  serverExternalPackages: [
    'better-sqlite3',
    'sharp',
    'rss-parser',
    'cheerio',
    'node-cron',
  ],
};

export default nextConfig;
