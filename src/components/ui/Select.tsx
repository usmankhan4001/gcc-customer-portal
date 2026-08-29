'use client';

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export default function Select({
  label,
  helperText,
  error,
  options,
  children,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = selectId ? `${selectId}-error` : undefined;
  const helperId = selectId ? `${selectId}-helper` : undefined;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className="select-field-wrapper">
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}

      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`input-field ${error ? 'select-error' : ''} ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error && <span id={errorId} className="select-error-msg" role="alert">{error}</span>}
      {helperText && !error && <span id={helperId} className="select-helper-msg">{helperText}</span>}

      <style jsx>{`
        .select-field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .select-error {
          border-color: var(--error) !important;
        }
        .select-error-msg {
          font-size: 12px;
          color: var(--error);
          font-weight: 600;
          margin-top: 2px;
        }
        .select-helper-msg {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
