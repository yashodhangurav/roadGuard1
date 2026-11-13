import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DetectionSection } from './components/DetectionSection';
import { MappingSection } from './components/MappingSection';
import { AnalysisSection } from './components/AnalysisSection';
import { ResolutionSection } from './components/ResolutionSection';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text antialiased selection:bg-amber selection:text-white flex flex-col">
      {/* Fixed Sticky Header */}
      <Navbar onOpenDemo={() => setIsDemoOpen(true)} />

      {/* Main Page Sections */}
      <main className="flex-1">
        <Hero onOpenDemo={() => setIsDemoOpen(true)} />
        <DetectionSection />
        <MappingSection />
        <AnalysisSection />
        <ResolutionSection />
        <FAQ />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Interactive Video Demo Modal matching Aloud's <dialog id="film"> */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          {/* Modal Frame */}
          <div className="relative w-full max-w-4xl aspect-video rounded-card border border-line-2 bg-black shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-line-2 flex items-center justify-center text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Simulated Live Product Video Preview */}
            <div className="flex flex-col items-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center text-amber animate-pulse">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-xl font-semibold text-text">RoadGuard AI Live Survey Demo (1:20)</h3>
              <p className="text-sm text-text-2 max-w-md">
                Demonstrating real-time 60 FPS dashcam road defect detection, spatial clustering on GIS layers, and automated municipal work-order dispatch.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

