import React, { forwardRef } from 'react';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  className?: string;
  'data-testid'?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  id?: string;
  name?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error = false,
  errorMessage,
  helperText,
  className = '',
  'data-testid': testId,
  autoFocus = false,
  autoComplete,
  maxLength,
  id,
  name,
}, ref) => {
  const baseClasses = [
    'block w-full px-3 py-2 border rounded-lg shadow-sm',
    'placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'text-sm',
  ];

  const stateClasses = error
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500';

  const disabledClasses = disabled
    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'bg-white hover:border-gray-400';

  const inputClasses = [
    ...baseClasses,
    stateClasses,
    disabledClasses,
    className,
  ].join(' ');

  return (
    <div className="w-full">
      <input
        ref={ref}
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={inputClasses}
        data-testid={testId}
        aria-invalid={error}
        aria-describedby={
          errorMessage ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
      />
      
      {/* Error message */}
      {error && errorMessage && (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      
      {/* Helper text */}
      {!error && helperText && (
        <p
          id={`${id}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input'; 