import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Eye, Menu, X, User, Plus, LogOut } from 'lucide-react';
import { NAV_LINKS } from '../data/roadguardData';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useAuth } from '../context/AuthContext';
import { EASE_SWIFT, buttonMotion } from '../styles/motion';

interface NavbarProps {
  onOpenDemo?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onOpenPortal?: () => void;
  onOpenReportModal?: () => void;
}

const DESKTOP_NAV_LINKS = [
  { label: 'Detection', href: '#detection' },
  { label: 'Mapping', href: '#mapping' },
  { label: 'Analysis', href: '#analysis' },
  { label: 'FAQ', href: '#faq' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  onOpenAuth,
  onOpenPortal,
  onOpenReportModal,
}) => {
  const { isScrolled } = useScrollPosition();
  const { user, isAuthenticated, logout } = useAuth();
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
        <motion.a
          href="#"
          className="flex items-center gap-2.5 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.18, ease: EASE_SWIFT }}
        >
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm group-hover:border-line-3 transition-colors">
            <Shield className="w-4 h-4 text-amber" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-text">
            ROADGUARD <span className="text-amber font-bold">AI</span>
          </span>
        </motion.a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links hidden lg:flex">
          {DESKTOP_NAV_LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              className="text-sm text-text-2 hover:text-text transition-colors relative"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        {/* Nav CTAs & Mobile Toggle */}
        <div className="nav-cta flex items-center gap-2">
          {/* Scroll-Revealed "View Live Demo" Button (.nav-watch) */}
          <button
            onClick={onOpenDemo}
            className="nav-watch hidden xl:inline-flex"
            aria-label="View Live Demo"
          >
            <Play className="w-3 h-3 fill-current text-text-2" />
            <span>View Live Demo</span>
          </button>

          {/* Citizen Auth Options (Desktop) */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPortal}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/40 bg-amber/10 hover:bg-amber/20 text-white text-xs font-semibold transition cursor-pointer"
                title="Open Citizen Road Incident Portal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Portal ({user?.name.split(' ')[0]})</span>
              </button>

              <button
                onClick={onOpenReportModal}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber hover:bg-[#c66848] text-white text-xs font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(217,119,87,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-1.5 rounded-full transition hover:bg-white/5 cursor-pointer"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth?.('signup')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line-2 bg-surface hover:bg-surface-2 text-text text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <User className="w-3 h-3 text-amber" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Primary CTA */}
          <motion.a
            href="#detection"
            className="btn btn-light btn-sm shadow-btn-light"
            {...buttonMotion}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explore Detection</span>
            <span className="sm:hidden">Explore</span>
          </motion.a>

          {/* Mobile Hamburger Button */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full border border-line-2 bg-surface text-text hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_SWIFT }}
            className="lg:hidden border-b border-line bg-surface/98 backdrop-blur-2xl px-6 py-5 space-y-4 shadow-2xl overflow-hidden"
          >
            {/* Citizen Status Banner on Mobile */}
            {isAuthenticated ? (
              <div className="p-3 rounded-xl bg-amber/10 border border-amber/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{user?.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Citizen Reporter
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('login');
                  }}
                  className="py-2 px-3 rounded-xl border border-line-2 bg-surface text-xs font-semibold text-text text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth?.('signup');
                  }}
                  className="py-2 px-3 rounded-xl bg-amber text-xs font-semibold text-white text-center shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            <nav className="flex flex-col space-y-2.5 pt-2">
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
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPortal?.();
                    }}
                    className="btn btn-light w-full justify-center shadow-btn-light"
                  >
                    <span>Open Citizen Portal</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenReportModal?.();
                    }}
                    className="btn btn-ghost w-full justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber" />
                    <span>Report Road Issue</span>
                  </button>
                </>
              ) : (
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
