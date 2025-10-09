"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";


export default function Home() {

  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle the install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt
    setDeferredPrompt(null);
    
    // Hide the install button
    setShowInstall(false);
    
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };

  return (
    <div className="max-w-5xl mx-auto mt-4 text-center px-4">
      {/* Logo */}
      <div
        className="mx-auto w-[180px] h-[180px] relative flex items-center justify-center rounded-full overflow-hidden shadow-lg mb-5"
      >
        <Image
          src="/logo.png"
          alt="Ambika Empire Logo"
          width={180}
          height={180}
          className="object-cover"
          priority
        />
      </div>

      <h1 className="text-4xl font-bold mb-2 text-[#34495e]">
        Welcome to Ambika Empire
      </h1>

      {showInstall && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-w-lg mx-auto">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Get the Ambika Empire App!</strong><br></br> Install our progressive web app for a better experience, faster loading, and offline access.
          </p>
          <button
            type="button"
            onClick={handleInstallClick}
            className=" bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Install App
          </button>
        </div>
      )}

      <div className="mt-12 flex gap-6 justify-center">
        <Link
          href="/login"
          className="bg-[#34495e] text-white py-3 px-8 rounded-lg text-lg font-bold hover:bg-[#2c3e50] transition-colors"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="border border-[#34495e] text-[#34495e] py-3 px-8 rounded-lg text-lg font-bold hover:bg-[#34495e]/10 transition-colors"
        >
          Dashboard
        </Link>
      </div>

      <div className="mt-16 text-sm text-gray-500">
        © {new Date().getFullYear()} Ambika Empire Vendor Management. All rights reserved.
      </div>
    </div>
  );
}
