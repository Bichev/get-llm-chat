import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  className?: string;
  'data-testid'?: string;
  id?: string;
  name?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error = false,
  errorMessage,
  helperText,
  className = '',
  'data-testid': testId,
  id,
  name,
}, ref) => {
  const baseClasses = [
    'block w-full px-3 py-2 border rounded-lg shadow-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'text-sm',
    'appearance-none',
    'bg-white',
  ];

  const stateClasses = error
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500';

  const disabledClasses = disabled
    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'hover:border-gray-400';

  const selectClasses = [
    ...baseClasses,
    stateClasses,
    disabledClasses,
    className,
  ].join(' ');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange?.(event.target.value);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={selectClasses}
          data-testid={testId}
          aria-invalid={error}
          aria-describedby={
            errorMessage ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.icon && `${option.icon} `}
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      
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

Select.displayName = 'Select'; 