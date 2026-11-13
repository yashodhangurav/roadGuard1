import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { AuthModal } from '../auth/AuthModal';
import { ReportIssueModal } from '../citizen/ReportIssueModal';
import { modalBackdrop, modalFrame } from '../../styles/motion';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Keyboard accessibility: Escape closes open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDemoOpen) setIsDemoOpen(false);
        if (isAuthOpen) setIsAuthOpen(false);
        if (isReportModalOpen) setIsReportModalOpen(false);
      }
    };
    const handleOpenDemoEvent = () => setIsDemoOpen(true);
    const handleOpenReportEvent = () => setIsReportModalOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-demo-video', handleOpenDemoEvent);
    window.addEventListener('open-citizen-report', handleOpenReportEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-demo-video', handleOpenDemoEvent);
      window.removeEventListener('open-citizen-report', handleOpenReportEvent);
    };
  }, [isDemoOpen, isAuthOpen, isReportModalOpen]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-bg text-text antialiased selection:bg-amber selection:text-white flex flex-col relative">
        {/* Ambient Unsplash Pothole Background with Soft Light Overlay */}
        <div
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
          aria-hidden="true"
        >
          <img
            src="https://images.unsplash.com/photo-1560782202-154b39d57ef2?auto=format&fit=crop&w=2400&q=85"
            alt="Pothole Road Texture"
            className="w-full h-full object-cover object-center opacity-55 filter brightness-125 contrast-115"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/samples/road-pothole-1.jpg';
            }}
          />
          {/* Subtle Light Gradient Overlays for Readability & Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080b]/75 via-[#07080b]/60 to-[#07080b]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber/15 via-transparent to-[#07080b]/75" />
        </div>

        {/* Global Navigation Bar */}
        <Navbar
          onOpenDemo={() => setIsDemoOpen(true)}
          onOpenAuth={handleOpenAuth}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* Main Route Content */}
        <main className="flex-1 relative z-10 pt-20">
          {children}
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Auth Modal (Citizen Login & Sign Up) */}
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            setIsAuthOpen(false);
          }}
        />

        {/* Global Report Road Issue Modal */}
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSuccessRedirect={() => {
            setIsReportModalOpen(false);
          }}
        />

        {/* Interactive Video Demo Modal matching Aloud's <dialog id="film"> */}
        <AnimatePresence>
          {isDemoOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
              onClick={() => setIsDemoOpen(false)}
            >
              <motion.div
                variants={modalFrame}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-4xl aspect-video rounded-card border border-line-2 bg-[#090a0d] shadow-2xl overflow-hidden flex flex-col items-center justify-center select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsDemoOpen(false)}
                  className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-line-2 flex items-center justify-center text-text transition-colors"
                  aria-label="Close Demo Video"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#121318] via-[#090a0d] to-[#040406]">
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-text-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>REC · LIVE DASHCAM TELEMETRY</span>
                  </div>
                  <div className="absolute top-4 right-16 text-xs font-mono text-text-3 hidden sm:inline-block">
                    CH-1 · 60 FPS · 3840×2160
                  </div>

                  <div className="w-16 h-16 rounded-full bg-amber/15 border border-amber/40 flex items-center justify-center text-amber shadow-[0_0_30px_rgba(217,119,87,0.3)] mb-4 animate-pulse">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>

                  <h3 className="text-xl md:text-2xl font-semibold text-text tracking-tight mb-2">
                    RoadGuard AI Live Survey Demonstration (1:20)
                  </h3>
                  <p className="text-sm text-text-2 max-w-lg text-center leading-relaxed mb-4">
                    Full-corridor demonstration showcasing 60 FPS on-edge defect classification, millimeter depth disparity estimation, and automated municipal work-order dispatch.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-text-3">
                    <span className="px-2.5 py-1 rounded bg-white/[0.05] border border-line">0:00–0:15 Camera Calibration</span>
                    <span className="px-2.5 py-1 rounded bg-white/[0.05] border border-line">0:15–0:45 Pothole Detection</span>
                    <span className="px-2.5 py-1 rounded bg-white/[0.05] border border-line">0:45–1:20 Work-Order Dispatch</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
