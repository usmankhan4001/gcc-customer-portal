import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
}

export function Input({
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] flex pointer-events-none">
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
          className={`input-field ${error ? 'border-[var(--color-error)]! focus:shadow-none!' : ''} ${icon ? 'pl-[42px]' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <span id={errorId} className="input-error" role="alert">
          {error}
        </span>
      )}
      {helper && !error && (
        <span id={helperId} className="input-helper">
          {helper}
        </span>
      )}
    </div>
  );
}

export default Input;
