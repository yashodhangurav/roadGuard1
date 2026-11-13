import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Menu, X, Plus, LogOut, ArrowRight } from 'lucide-react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useAuth } from '../context/AuthContext';
import { EASE_SWIFT, buttonMotion } from '../styles/motion';

interface NavbarProps {
  onOpenDemo?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onOpenReportModal?: () => void;
}

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Detection', href: '/detection' },
  { label: 'Mapping', href: '/mapping' },
  { label: 'Analysis', href: '/analysis' },
  { label: 'Reports', href: '/reports' },
  { label: 'AI Assistant', href: '/ai-assistant' },
  { label: 'About', href: '/about' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  onOpenAuth,
  onOpenReportModal,
}) => {
  const { isScrolled } = useScrollPosition();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (onOpenAuth) {
      onOpenAuth('signup');
    } else {
      navigate('/signup');
    }
  };

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
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm group-hover:border-line-3 transition-colors">
            <Shield className="w-4 h-4 text-amber" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-text">
            ROADGUARD <span className="text-amber font-bold">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links hidden lg:flex items-center gap-6">
          {PUBLIC_NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors relative py-1 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-text-2 hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-amber rounded-full"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Nav CTAs */}
        <div className="nav-cta flex items-center gap-2.5">
          {/* Live Demo Trigger */}
          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="nav-watch hidden xl:inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-white transition px-2.5 py-1.5 rounded-full hover:bg-white/5"
              aria-label="View Live Demo"
            >
              <Play className="w-3 h-3 fill-current text-amber" />
              <span>Live Demo</span>
            </button>
          )}

          {/* Citizen Auth Options (Desktop) */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/40 bg-amber/10 hover:bg-amber/20 text-white text-xs font-semibold transition cursor-pointer"
                title="Open Citizen Dashboard"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dashboard ({user?.name.split(' ')[0]})</span>
              </Link>

              {onOpenReportModal && (
                <button
                  onClick={onOpenReportModal}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber hover:bg-[#c66848] text-white text-xs font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(217,119,87,0.3)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => (onOpenAuth ? onOpenAuth('login') : navigate('/login'))}
                className="text-xs font-semibold text-text-2 hover:text-white px-3 py-1.5 rounded-full transition hover:bg-white/5 cursor-pointer"
              >
                Log In
              </button>
            </div>
          )}

          {/* Prominent "Get Started" Primary CTA */}
          <motion.button
            onClick={handleGetStarted}
            className="btn btn-light btn-sm shadow-btn-light"
            {...buttonMotion}
          >
            <span>{isAuthenticated ? 'My Dashboard' : 'Get Started'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>

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

      {/* Mobile Navigation Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_SWIFT }}
            className="lg:hidden border-b border-line bg-surface/98 backdrop-blur-2xl px-6 py-5 space-y-4 shadow-2xl overflow-hidden"
          >
            {/* Citizen Status / Actions on Mobile */}
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
                    if (onOpenAuth) onOpenAuth('login');
                    else navigate('/login');
                  }}
                  className="py-2 px-3 rounded-xl border border-line-2 bg-surface text-xs font-semibold text-text text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth('signup');
                    else navigate('/signup');
                  }}
                  className="py-2 px-3 rounded-xl bg-amber text-xs font-semibold text-white text-center shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex flex-col space-y-2 pt-2">
              {PUBLIC_NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-base font-medium py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                      isActive
                        ? 'text-amber bg-white/[0.04] font-semibold'
                        : 'text-text-2 hover:text-white'
                    }`
                  }
                >
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-3 border-t border-line flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleGetStarted();
                }}
                className="btn btn-light w-full justify-center shadow-btn-light"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenReportModal && isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReportModal();
                  }}
                  className="btn btn-ghost w-full justify-center"
                >
                  <Plus className="w-3.5 h-3.5 text-amber" />
                  <span>Report Road Issue</span>
                </button>
              )}

              {/* Subtle Administrator Portal Link */}
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-3 rounded-lg border border-line bg-white/[0.02] hover:bg-white/[0.06] text-xs font-mono text-text-3 hover:text-white flex items-center justify-center gap-2 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber" />
                <span>Municipal Administrator Access</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
