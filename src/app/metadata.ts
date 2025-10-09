import { Metadata, Viewport } from 'next';

/**
 * Default metadata configuration for all pages
 */
export const defaultMetadata: Metadata = {
  title: 'Ambika Empire',
  description: 'Inventory and Order Management System for Ambika Empire',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ambika Empire',
  },
};

/**
 * Default viewport configuration for all pages
 * This fixes the warning about themeColor and viewport in metadata
 */
export const defaultViewport: Viewport = {
  themeColor: '#34495e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Generate metadata with custom title
 * @param {string} title - Page title
 * @returns {Metadata} - Metadata object
 */
export function generateMetadata(title?: string): Metadata {
  return {
    ...defaultMetadata,
    title: title ? `${title} | Ambika Empire` : defaultMetadata.title,
  };
}

/**
 * Generate viewport configuration
 * @returns {Viewport} - Viewport object
 */
export function generateViewport(): Viewport {
  return defaultViewport;
} 