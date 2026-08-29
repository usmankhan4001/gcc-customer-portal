'use client';

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface StickyFooterProps {
  primaryLabel?: string;
  primaryAction?: () => void;
  primaryIcon?: React.ReactNode;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  secondaryIcon?: React.ReactNode;
  priceLabel?: string;
  priceValue?: string;
  priceSub?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function StickyFooter({
  primaryLabel = 'Continue',
  primaryAction,
  primaryIcon = <ArrowRight size={16} />,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  secondaryAction,
  secondaryIcon = <ArrowLeft size={16} />,
  priceLabel,
  priceValue,
  priceSub,
  children,
  className = '',
}: StickyFooterProps) {
  return (
    <div className={`sticky-footer-wrap ${className}`}>
      <div className="sticky-footer-inner">
        {children ? (
          children
        ) : (
          <>
            {/* Left Slot: Secondary Button OR Price Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {secondaryAction && secondaryLabel && (
                <button
                  type="button"
                  onClick={secondaryAction}
                  className="btn btn-secondary btn-sm"
                  style={{ height: 42, padding: '0 14px' }}
                >
                  {secondaryIcon}
                  <span>{secondaryLabel}</span>
                </button>
              )}

              {priceValue && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {priceLabel && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {priceLabel}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--orange)',
                      lineHeight: 1.1,
                    }}
                  >
                    {priceValue}
                  </span>
                  {priceSub && (
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {priceSub}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right Slot: Primary CTA */}
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction}
                disabled={primaryDisabled || primaryLoading}
                className="btn btn-primary"
                style={{
                  height: 44,
                  padding: '0 22px',
                  fontSize: 14,
                  fontWeight: 800,
                  opacity: primaryDisabled ? 0.6 : 1,
                  cursor: primaryDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span>{primaryLoading ? 'Processing...' : primaryLabel}</span>
                {!primaryLoading && primaryIcon}
              </button>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .sticky-footer-wrap {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 90;
          background: var(--header-bg, rgba(255, 255, 255, 0.95));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
          animation: slideUp 0.2s ease-out;
        }

        .sticky-footer-inner {
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .sticky-footer-inner {
            max-width: 760px;
          }
        }

        @media (min-width: 1024px) {
          .sticky-footer-inner {
            max-width: 1040px;
          }
        }
      `}</style>
    </div>
  );
}
