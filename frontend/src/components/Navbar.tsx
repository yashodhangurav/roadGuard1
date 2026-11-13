import React from 'react';
import { Shield, Play, Eye } from 'lucide-react';
import { NAV_LINKS } from '../data/roadguardData';
import { useScrollPosition } from '../hooks/useScrollPosition';

interface NavbarProps {
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const { isScrolled } = useScrollPosition();

  return (
    <header
      id="nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled ? 'is-scrolled' : ''
      }`}
    >
      {/* 5-Layer Progressive Backdrop Blur matching Aloud */}
      <div
        className={`absolute inset-0 -bottom-10 pointer-events-none transition-opacity duration-400 ${
          isScrolled ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/60 to-transparent" />
        <i
          className="absolute inset-0 backdrop-blur-[1px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)' }}
        />
        <i
          className="absolute inset-0 backdrop-blur-[2.5px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 90%)' }}
        />
        <i
          className="absolute inset-0 backdrop-blur-[5px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 48%, transparent 78%)' }}
        />
        <i
          className="absolute inset-0 backdrop-blur-[10px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 36%, transparent 64%)' }}
        />
        <i
          className="absolute inset-0 backdrop-blur-[18px] saturate-[1.4]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 24%, transparent 50%)' }}
        />
      </div>

      <div className="relative flex items-center justify-between h-16 max-w-content mx-auto px-6">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm group-hover:border-line-3 transition-colors">
            <Shield className="w-4 h-4 text-amber" />
          </div>
          <span className="font-semibold text-base tracking-tight text-text">
            RoadGuard <span className="text-amber">AI</span>
          </span>
        </a>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-sm text-text-2 hover:text-text hover:bg-white/[0.05] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          {/* Scroll-Revealed Live Demo Button */}
          <button
            onClick={onOpenDemo}
            className={`hidden sm:inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-surface border border-line-2 hover:border-line-3 text-text text-sm font-medium transition-all duration-300 ${
              isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <Play className="w-3 h-3 fill-current text-text-2" />
            <span>Live Demo</span>
          </button>

          {/* Primary CTA */}
          <a
            href="#detection"
            className="btn btn-light btn-sm shadow-btn-light"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Explore Detection</span>
          </a>
        </div>
      </div>
    </header>
  );
};

