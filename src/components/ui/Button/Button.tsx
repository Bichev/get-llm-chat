import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && 'btn-disabled',
    loading && 'btn-loading',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      data-testid={testId}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </button>
  );
}; 