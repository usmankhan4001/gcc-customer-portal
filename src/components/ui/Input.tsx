'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-field-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}

      <div className="input-box">
        {leftIcon && <div className="input-icon-left">{leftIcon}</div>}
        <input
          id={inputId}
          className={`input-field ${leftIcon ? 'pl-icon' : ''} ${rightIcon ? 'pr-icon' : ''} ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {rightIcon && <div className="input-icon-right">{rightIcon}</div>}
      </div>

      {error && <span className="input-error-msg">{error}</span>}
      {helperText && !error && <span className="input-helper-msg">{helperText}</span>}

      <style jsx>{`
        .input-field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .input-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .input-icon-left {
          position: absolute;
          left: 16px;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .input-icon-right {
          position: absolute;
          right: 16px;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
        }
        .pl-icon {
          padding-left: 44px;
        }
        .pr-icon {
          padding-right: 44px;
        }
        .input-error {
          border-color: var(--error) !important;
        }
        .input-error-msg {
          font-size: 12px;
          color: var(--error);
          font-weight: 600;
          margin-top: 2px;
        }
        .input-helper-msg {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
