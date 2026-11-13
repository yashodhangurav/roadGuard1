import React, { useRef } from 'react';
import { Cpu, Box, Award, Share2, Search, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { headerMotionVariants, staggerContainer, staggerItem } from '../styles/motion';

interface TileItem {
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  desc: string;
}

export const BentoDetails: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Pointer tracking for dynamic radial gradient spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const tiles = gridRef.current.querySelectorAll<HTMLDivElement>('.bento-tile');
    tiles.forEach((tile) => {
      const rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tile.style.setProperty('--mx', `${x}px`);
      tile.style.setProperty('--my', `${y}px`);
    });
  };

  const tiles: TileItem[] = [
    {
      icon: Cpu,
      title: 'Edge-native inference',
      desc: 'Runs locally on Jetson Orin, Ambarella, or standard smartphone NPUs. Full corridor survey processing requires zero cellular bandwidth on the move.',
    },
    {
      icon: Box,
      title: '3D crater volumetric modeling',
      desc: 'Calibrated stereo vision and monocular depth neural estimation calculate pothole void volume in cubic meters to forecast exact asphalt patch tonnage.',
    },
    {
      icon: Award,
      title: 'Certified civil standards',
      desc: 'Automated PCI calculation adheres strictly to ASTM D6433 defect density and deduct-value formulas for municipal audit compliance.',
    },
    {
      icon: Share2,
      title: 'Open GIS interoperability',
      desc: 'Export self-contained GeoJSON, Esri Shapefiles, or CSV bundles. Connects natively to ArcGIS, QGIS, Cartegraph, and Cityworks databases.',
    },
    {
      icon: Search,
      title: (
        <span>
          <kbd>⌘</kbd><kbd>K</kbd> finds any street or defect
        </span>
      ),
      desc: 'Query street names, highway mileposts, defect IDs, or survey dates across your entire regional road asset inventory in milliseconds.',
    },
    {
      icon: Database,
      title: 'Tunnel & dead-zone resilient',
      desc: 'Video frames, telemetry, and GNSS coordinates buffer directly to local NVMe storage; synchronizes automatically upon depot Wi-Fi return.',
    },
  ];

  return (
    <section id="details" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Section Header */}
        <motion.div
          variants={headerMotionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="max-w-[780px] mb-12 md:mb-16 text-left"
        >
          <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
            And the infrastructure, built to standard
          </h2>
          <p className="mt-4 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
            Every capability engineered for transportation agencies, municipal public works, and civil road contractors who need auditable ground truth.
          </p>
        </motion.div>

        {/* 6-Tile Bento Matrix with 1px Divider Lines and Radial Spotlight */}
        <motion.div
          ref={gridRef}
          onMouseMove={handleMouseMove}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-line bg-line overflow-hidden rounded-card"
        >
          {tiles.map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={idx}
                variants={staggerItem}
                className="bento-tile relative p-8 md:p-9 bg-surface border-r border-b border-line text-left transition-colors hover:bg-surface-2/70 overflow-hidden group"
              >
                {/* Pointer Spotlight Overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.06), transparent 65%)',
                  }}
                />

                {/* Tile Icon */}
                <div className="relative z-10 w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-6 group-hover:scale-105 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-amber" />
                </div>

                {/* Tile Title */}
                <h3 className="relative z-10 text-base md:text-lg font-semibold text-text mb-2.5 tracking-tight flex items-center gap-1.5">
                  {tile.title}
                </h3>

                {/* Tile Description */}
                <p className="relative z-10 text-sm text-text-2 leading-relaxed">
                  {tile.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

