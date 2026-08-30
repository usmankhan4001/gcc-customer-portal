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
            <div className="flex items-center gap-2.5">
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
                <div className="flex flex-col">
                  {priceLabel && <span className="sticky-footer-price-label">{priceLabel}</span>}
                  <span className="sticky-footer-price-value">{priceValue}</span>
                  {priceSub && <span className="sticky-footer-price-sub">{priceSub}</span>}
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
    </div>
  );
}
