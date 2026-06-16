"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, Droplets, ArrowLeft, Car } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-purple/5 blur-[100px] pointer-events-none" />

      <div className="relative text-center max-w-md">
        {/* Animated car */}
        <motion.div
          animate={{ x: [-8, 8, -8], rotate: [-1, 1, -1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
          <Car className="w-10 h-10 text-white/30" />
        </motion.div>

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <div className="text-[96px] font-black text-white/5 leading-none select-none mb-2">404</div>
          <h1 className="text-2xl font-black text-white mb-3">
            Page not found
          </h1>
          <p className="text-sm text-white/40 leading-relaxed mb-8">
            Looks like this page drove off somewhere. Let&apos;s get you back on the road.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-2xl font-semibold text-sm hover:bg-brand-blue/90 active:scale-95 transition-all shadow-lg shadow-brand-blue/25">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white/70 rounded-2xl font-semibold text-sm hover:bg-white/10 hover:text-white active:scale-95 transition-all">
            <Droplets className="w-4 h-4" />
            My Dashboard
          </Link>
        </motion.div>

        {/* VISIT branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex items-center justify-center gap-2 text-white/20">
          <Droplets className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-widest uppercase">VISIT Car Wash</span>
        </motion.div>
      </div>
    </div>
  );
}
