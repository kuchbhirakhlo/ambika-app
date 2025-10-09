'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './sw-register';

export default function ClientInit() {
  useEffect(() => {
    // Register service worker on client
    registerServiceWorker();
  }, []);

  // This component doesn't render anything
  return null;
} 