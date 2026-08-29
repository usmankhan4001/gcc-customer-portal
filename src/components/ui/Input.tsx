'use client';

import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  error,
  helper,
  icon,
  type = 'text',
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;
  const describedBy = error ? errorId : helper ? helperId : undefined;

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={inputId} className="input-label">{label}</label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={`input-field ${error ? 'input-error' : ''}`}
          style={icon ? { paddingLeft: 42 } : undefined}
          {...props}
        />
      </div>
      {error && <span id={errorId} className="input-error" role="alert">{error}</span>}
      {helper && !error && <span id={helperId} className="input-helper">{helper}</span>}
    </div>
  );
}

export { Input };
