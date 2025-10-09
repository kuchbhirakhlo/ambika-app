"use client";

// Flag to prevent multiple registrations
let registered = false;

// Export the function for use in layout.tsx
export function registerServiceWorker() {
  // Only run in browser and only register once
  if (typeof window === "undefined" || registered) return;
  
  try {
    if ("serviceWorker" in navigator) {
      // Set the flag to prevent multiple registrations
      registered = true;
      
      // Register on window load to ensure page is fully loaded
      if (document.readyState === 'complete') {
        // If already loaded, register immediately
        navigator.serviceWorker.register("/sw.js").catch(err => {
          console.error("Service Worker registration failed:", err);
          // Reset flag in case of error
          registered = false;
        });
      } else {
        // Otherwise wait for window load
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(err => {
            console.error("Service Worker registration failed:", err);
            // Reset flag in case of error
            registered = false;
          });
        });
      }
      
      // Add HTML5 Canvas polyfills if needed
      if (!window.HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(window.HTMLCanvasElement.prototype, 'toBlob', {
          value: function (callback: (blob: Blob | null) => void, type?: string, quality?: any): void {
            const dataURL = this.toDataURL(type, quality);
            const binStr = atob(dataURL.split(',')[1]);
            const len = binStr.length;
            const arr = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
              arr[i] = binStr.charCodeAt(i);
            }
            
            callback(new Blob([arr], { type: type || 'image/png' }));
          }
        });
      }
    }
  } catch (error) {
    console.error("Error setting up service worker:", error);
  }
} 