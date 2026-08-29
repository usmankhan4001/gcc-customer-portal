'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Wrench,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  User,
  Clock,
  Receipt,
  Landmark,
  Kanban,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Logo */}
        <Link href="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="logo-icon-box">
            <Building2 className="w-5 h-5 text-orange" />
          </div>
          <div className="logo-text-box">
            <span className="logo-title display-font">
              GCC<span className="text-orange">STARTUP</span>
            </span>
            <span className="logo-badge">V1.0</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <Link
            href="/tools"
            className={`nav-link ${pathname.startsWith('/tools') ? 'nav-link-active' : ''}`}
          >
            <Wrench className="w-4 h-4 text-orange" />
            <span>Studio</span>
            <span className="nav-tag">Tools</span>
          </Link>

          <Link
            href="/setup"
            className={`nav-link ${pathname === '/setup' ? 'nav-link-active' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-navy" />
            <span>Formation Wizard</span>
          </Link>

          {/* Client Portal Hub Dropdown */}
          <div
            className="nav-dropdown-wrapper"
            onMouseEnter={() => setIsPortalDropdownOpen(true)}
            onMouseLeave={() => setIsPortalDropdownOpen(false)}
          >
            <button
              className={`nav-link dropdown-trigger ${
                pathname.startsWith('/portal') ? 'nav-link-active' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue" />
              <span>Client Portal</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isPortalDropdownOpen && (
              <div className="dropdown-menu card">
                <Link
                  href="/portal/dashboard"
                  className="dropdown-item"
                  onClick={() => setIsPortalDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-navy" />
                  <div>
                    <strong className="block text-sm text-navy">Workspace & Milestones</strong>
                    <span className="text-xs text-tertiary">Live 6-stage tracker</span>
                  </div>
                </Link>

                <Link
                  href="/portal/vault"
                  className="dropdown-item"
                  onClick={() => setIsPortalDropdownOpen(false)}
                >
                  <ShieldCheck className="w-4 h-4 text-blue" />
                  <div>
                    <strong className="block text-sm text-navy">Document & Official KYC Vault</strong>
                    <span className="text-xs text-tertiary">Government portal handshake</span>
                  </div>
                </Link>

                <Link
                  href="/portal/renewals"
                  className="dropdown-item"
                  onClick={() => setIsPortalDropdownOpen(false)}
                >
                  <Clock className="w-4 h-4 text-orange" />
                  <div>
                    <strong className="block text-sm text-navy">License & Nominee Renewals</strong>
                    <span className="text-xs text-tertiary">365-day continuity hub</span>
                  </div>
                </Link>

                <Link
                  href="/portal/tax-compliance"
                  className="dropdown-item"
                  onClick={() => setIsPortalDropdownOpen(false)}
                >
                  <Receipt className="w-4 h-4 text-navy" />
                  <div>
                    <strong className="block text-sm text-navy">Corporate Tax & VAT Manager</strong>
                    <span className="text-xs text-tertiary">9% FTA & write-offs ledger</span>
                  </div>
                </Link>

                <Link
                  href="/portal/banking"
                  className="dropdown-item"
                  onClick={() => setIsPortalDropdownOpen(false)}
                >
                  <Landmark className="w-4 h-4 text-orange" />
                  <div>
                    <strong className="block text-sm text-navy">Multi-Currency Banking Hub</strong>
                    <span className="text-xs text-tertiary">Airwallex, Wio & Wise tracking</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Admin Operations Dropdown */}
          <div
            className="nav-dropdown-wrapper"
            onMouseEnter={() => setIsAdminDropdownOpen(true)}
            onMouseLeave={() => setIsAdminDropdownOpen(false)}
          >
            <button
              className={`nav-link dropdown-trigger ${
                pathname.startsWith('/admin') ? 'nav-link-active' : ''
              }`}
            >
              <Kanban className="w-4 h-4 text-navy" />
              <span>Admin Operations</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isAdminDropdownOpen && (
              <div className="dropdown-menu card">
                <Link
                  href="/admin/kanban"
                  className="dropdown-item"
                  onClick={() => setIsAdminDropdownOpen(false)}
                >
                  <Kanban className="w-4 h-4 text-orange" />
                  <div>
                    <strong className="block text-sm text-navy">Filing Kanban Board</strong>
                    <span className="text-xs text-tertiary">Stage 1–6 progression controls</span>
                  </div>
                </Link>

                <Link
                  href="/admin/filing-queue"
                  className="dropdown-item"
                  onClick={() => setIsAdminDropdownOpen(false)}
                >
                  <ShieldCheck className="w-4 h-4 text-blue" />
                  <div>
                    <strong className="block text-sm text-navy">Official Portal KYC Queue</strong>
                    <span className="text-xs text-tertiary">Review reference submissions</span>
                  </div>
                </Link>

                <Link
                  href="/admin/whatsapp"
                  className="dropdown-item"
                  onClick={() => setIsAdminDropdownOpen(false)}
                >
                  <Building2 className="w-4 h-4 text-success" />
                  <div>
                    <strong className="block text-sm text-navy">Meta WhatsApp Dispatcher</strong>
                    <span className="text-xs text-tertiary">Cloud API template alerts</span>
                  </div>
                </Link>

                <Link
                  href="/admin/clients"
                  className="dropdown-item"
                  onClick={() => setIsAdminDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-navy" />
                  <div>
                    <strong className="block text-sm text-navy">Master Client Registry</strong>
                    <span className="text-xs text-tertiary">Corporate files & accounts</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Action Button */}
        <div className="navbar-actions">
          <Link href="/setup" className="btn btn-primary btn-sm">
            <span>Start Company Setup</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 120;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          padding: 12px 24px;
        }

        .navbar-content {
          max-width: 1320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-icon-box {
          width: 38px;
          height: 38px;
          background: var(--orange-lt);
          border: 1px solid #FCD9C7;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.02em;
        }

        .logo-badge {
          font-size: 0.65rem;
          font-weight: 700;
          background: var(--sand);
          color: var(--navy);
          border: 1px solid var(--sand-dk);
          padding: 2px 7px;
          border-radius: var(--radius-pill);
        }

        .desktop-nav {
          display: none;
          align-items: center;
          gap: 6px;
        }

        @media (min-width: 900px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-pill);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: var(--navy);
          background: var(--sand);
        }

        .nav-link-active {
          color: var(--navy);
          background: var(--sand);
          font-weight: 700;
        }

        .nav-tag {
          font-size: 11px;
          background: var(--blue-lt);
          color: var(--blue);
          padding: 1px 6px;
          border-radius: var(--radius-pill);
          font-weight: 700;
        }

        .nav-dropdown-wrapper {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          width: 320px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 16px 40px rgba(20, 32, 74, 0.15);
          animation: dropIn 0.2s ease-out;
        }

        .dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius);
          text-decoration: none;
          transition: background 0.2s;
        }

        .dropdown-item:hover {
          background: var(--sand);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
