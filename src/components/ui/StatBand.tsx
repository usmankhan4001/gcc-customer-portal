'use client';

import React from 'react';

export interface StatItem {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}

export interface StatBandProps {
  stats: StatItem[];
  variant?: 'sand' | 'surface' | 'navy';
}

export default function StatBand({ stats, variant = 'surface' }: StatBandProps) {
  const getCardClass = () => {
    switch (variant) {
      case 'sand':
        return 'card-sand';
      case 'navy':
        return 'card-navy';
      default:
        return '';
    }
  };

  return (
    <div className={`stat-band-wrapper card ${getCardClass()}`}>
      {stats.map((stat, idx) => (
        <React.Fragment key={idx}>
          <div className="stat-node">
            <span
              className={`stat-val display-font ${
                stat.highlight
                  ? 'text-orange'
                  : variant === 'navy'
                  ? 'text-white'
                  : 'text-navy'
              }`}
            >
              {stat.value}
            </span>
            <span className={`stat-lbl ${variant === 'navy' ? 'text-white-muted' : 'text-tertiary'}`}>
              {stat.label}
            </span>
            {stat.subValue && <span className="stat-sub">{stat.subValue}</span>}
          </div>

          {idx < stats.length - 1 && <div className="stat-divider-line" />}
        </React.Fragment>
      ))}

      <style jsx>{`
        .stat-band-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 20px 32px;
          border-radius: var(--radius-pill);
          width: 100%;
        }

        @media (max-width: 640px) {
          .stat-band-wrapper {
            flex-direction: column;
            gap: 16px;
            border-radius: var(--radius-lg);
          }
          .stat-divider-line {
            display: none;
          }
        }

        .stat-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
        }

        .stat-val {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .stat-lbl {
          font-size: 12px;
          font-weight: 600;
        }

        .stat-sub {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .text-white-muted {
          color: rgba(255, 255, 255, 0.7);
        }

        .stat-divider-line {
          width: 1px;
          height: 36px;
          background: var(--border);
        }
      `}</style>
    </div>
  );
}
