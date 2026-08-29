'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string;
  badgeVariant?: 'orange' | 'blue' | 'navy';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  badge,
  badgeVariant = 'navy',
  maxWidth = 'md',
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      default:
        return 'max-w-md';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-container card ${getMaxWidthClass()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || badge) && (
          <div className="modal-top">
            <div>
              {badge && (
                <span className={`badge badge-${badgeVariant} mb-1`}>{badge}</span>
              )}
              {title && <h3 className="modal-title display-font">{title}</h3>}
            </div>
            <button onClick={onClose} className="modal-close-btn" aria-label="Close Modal">
              <X className="w-4 h-4 text-navy" />
            </button>
          </div>
        )}

        <div className="modal-body">{children}</div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 250;
          background: rgba(20, 32, 74, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          width: 100%;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 24px 64px rgba(20, 32, 74, 0.25);
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.25s ease-out;
        }

        .max-w-sm {
          max-width: 440px;
        }
        .max-w-md {
          max-width: 580px;
        }
        .max-w-lg {
          max-width: 760px;
        }
        .max-w-xl {
          max-width: 960px;
        }

        .modal-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .modal-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--navy);
          margin-top: 4px;
        }

        .modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-pill);
          background: var(--sand);
          border: 1px solid var(--sand-dk);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: #E5E7EB;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
