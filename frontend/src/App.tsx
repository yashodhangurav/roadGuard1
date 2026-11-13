import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductPreview } from './components/ProductPreview';
import { DetectionSection } from './components/DetectionSection';
import { MappingSection } from './components/MappingSection';
import { AnalysisSection } from './components/AnalysisSection';
import { ResolutionSection } from './components/ResolutionSection';
import { BentoDetails } from './components/BentoDetails';
import { PrivacySection } from './components/PrivacySection';
import { FAQ } from './components/FAQ';
import { BottomCTA } from './components/BottomCTA';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text antialiased selection:bg-amber selection:text-white flex flex-col">
      {/* Fixed Sticky Header */}
      <Navbar onOpenDemo={() => setIsDemoOpen(true)} />

      {/* Main Page Sections in Strict Ordinal Reference Sequence */}
      <main className="flex-1">
        <Hero onOpenDemo={() => setIsDemoOpen(true)} />
        <ProductPreview />
        <DetectionSection />
        <MappingSection />
        <AnalysisSection />
        <ResolutionSection />
        <BentoDetails />
        <PrivacySection />
        <FAQ />
        <BottomCTA onOpenDemo={() => setIsDemoOpen(true)} />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Interactive Video Demo Modal matching Aloud's <dialog id="film"> */}
      {isDemoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsDemoOpen(false)}
        >
          {/* Modal Frame */}
          <div
            className="relative w-full max-w-4xl aspect-video rounded-card border border-line-2 bg-[#090a0d] shadow-2xl overflow-hidden flex flex-col items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-line-2 flex items-center justify-center text-text transition-colors"
              aria-label="Close Demo Video"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Demo Visual Preview */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#121318] via-[#090a0d] to-[#040406]">
              {/* Decorative Camera HUD */}
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-text-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>REC · LIVE DASHCAM TELEMETRY</span>
              </div>
              <div className="absolute top-4 right-16 text-xs font-mono text-text-3 hidden sm:inline-block">
                CH-1 · 60 FPS · 3840×2160
              </div>

              {/* Center Play Indicator */}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
