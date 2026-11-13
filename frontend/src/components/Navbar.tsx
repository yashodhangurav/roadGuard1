import React, { useState } from 'react';
import { Shield, Play, Eye, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../data/roadguardData';
import { useScrollPosition } from '../hooks/useScrollPosition';

interface NavbarProps {
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const { isScrolled } = useScrollPosition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      id="nav"
      className={`nav ${isScrolled ? 'is-scrolled is-past' : ''}`}
    >
      {/* 5-Layer Progressive Multi-Stage Backdrop Blur matching Aloud */}
      <div className="nav-blur" aria-hidden="true">
        <i
          className="backdrop-blur-[1px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)' }}
        />
        <i
          className="backdrop-blur-[2.5px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 90%)' }}
        />
        <i
          className="backdrop-blur-[5px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 48%, transparent 78%)' }}
        />
        <i
          className="backdrop-blur-[10px]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 36%, transparent 64%)' }}
        />
        <i
          className="backdrop-blur-[18px] saturate-[1.4]"
          style={{ maskImage: 'linear-gradient(180deg, #000 0%, #000 24%, transparent 50%)' }}
        />
      </div>

      <div className="nav-inner">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm group-hover:border-line-3 transition-colors">
            <Shield className="w-4 h-4 text-amber" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-text">
            ROADGUARD <span className="text-amber font-bold">AI</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links hidden md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-2 hover:text-text transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Nav CTAs & Mobile Toggle */}
        <div className="nav-cta flex items-center gap-2">
          {/* Scroll-Revealed "View Live Demo" Button (.nav-watch) */}
          <button
            onClick={onOpenDemo}
            className="nav-watch hidden sm:inline-flex"
            aria-label="View Live Demo"
          >
            <Play className="w-3 h-3 fill-current text-text-2" />
            <span>View Live Demo</span>
          </button>

          {/* Primary CTA */}
          <a
            href="#detection"
            className="btn btn-light btn-sm shadow-btn-light"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explore Detection</span>
            <span className="sm:hidden">Explore</span>
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full border border-line-2 bg-surface text-text hover:bg-surface-2 transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-line bg-surface/95 backdrop-blur-2xl px-6 py-5 space-y-4 shadow-2xl animate-fade-in">
          <nav className="flex flex-col space-y-2.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base text-text-2 hover:text-text font-medium py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-line flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo?.();
              }}
              className="btn btn-ghost w-full justify-center"
            >
              <Play className="w-3.5 h-3.5 fill-current text-text-2" />
              <span>View Live Demo</span>
            </button>
            <a
              href="#detection"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-light w-full justify-center shadow-btn-light"
            >
              <Eye className="w-4 h-4" />
              <span>Explore Detection</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
