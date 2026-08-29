'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface AlertBannerProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export default function AlertBanner({
  type = 'info',
  title,
  description,
  action,
}: AlertBannerProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue shrink-0" />;
    }
  };

  const getVariantClass = () => {
    switch (type) {
      case 'warning':
        return 'card-sand alert-warning';
      case 'success':
        return 'card-sand alert-success';
      case 'error':
        return 'card-orange-lt alert-error';
      default:
        return 'card-blue-lt alert-info';
    }
  };

  return (
    <div className={`alert-banner card ${getVariantClass()}`}>
      <div className="alert-left">
        {getIcon()}
        <div>
          <strong className="alert-title display-font text-navy">{title}</strong>
          {description && <p className="alert-desc">{description}</p>}
        </div>
      </div>

      {action && (
        <div className="alert-action">
          {action.href ? (
            <a href={action.href} className="btn btn-primary btn-sm">
              <span>{action.label}</span>
            </a>
          ) : (
            <button onClick={action.onClick} className="btn btn-primary btn-sm">
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .alert-banner {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .alert-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .alert-action {
            width: 100%;
          }
          .alert-action :global(.btn) {
            width: 100%;
          }
        }

        .alert-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .alert-title {
          font-size: 14px;
          display: block;
        }

        .alert-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
