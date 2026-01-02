import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';
import Button from '../common/Button';

/**
 * Reusable error message component with full customization options
 * 
 * @param {Object} props - Component props
 * @param {string|Error|Object} props.error - Error message, Error object, or error config object
 * @param {Function} [props.onRetry] - Function to call when retry button is clicked
 * @param {Function} [props.onDismiss] - Function to call when dismiss button is clicked
 * @param {string} [props.className] - Additional CSS classes for the container
 * @param {boolean} [props.dismissible] - Whether the error can be dismissed
 * @param {string} [props.type='error'] - Type of message (error, warning, info, success)
 * @param {string} [props.title] - Optional title for the error message
 * @param {React.ElementType} [props.icon] - Custom icon component
 * @param {string} [props.retryText='Try Again'] - Text for the retry button
 * @param {string} [props.dismissText='Dismiss'] - Text for the dismiss button
 * @param {Object} [props.styles] - Custom styles for different parts of the component
 * @param {string} [props.role='alert'] - ARIA role for the error message
 * @param {number} [props.autoDismiss] - Auto dismiss after a delay (in ms)
 * @param {Function} [props.onAutoDismiss] - Callback when auto-dismiss completes
 * @returns {JSX.Element}
 */
const ErrorMessage = ({
  error: errorProp,
  onRetry,
  onDismiss,
  className = '',
  dismissible = true,
  type = 'error',
  title: titleProp,
  icon: CustomIcon,
  retryText = 'Try Again',
  dismissText = 'Dismiss',
  styles = {},
  role = 'alert',
  autoDismiss,
  onAutoDismiss,
  isLoading = false,
  loadingText = 'Processing...',
  ...restProps
}) => {
  // Safely get error message from different error formats
  const getErrorMessage = (err) => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    return err?.message || err?.error || 'An unknown error occurred';
  };

  const message = getErrorMessage(errorProp);
  const title = titleProp || (type?.charAt(0)?.toUpperCase() + type?.slice(1));

  // Handle auto-dismissal
  useEffect(() => {
    if (autoDismiss && onDismiss && !isLoading) {
      const timer = setTimeout(() => {
        onDismiss?.();
        onAutoDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, onAutoDismiss, isLoading]);

  if (!message && !isLoading) return null;
  
  // Extract error message and configuration with optional chaining
  let errorMessage = 'An unexpected error occurred';
  let errorConfig = {};
  
  if (typeof errorProp === 'string') {
    errorMessage = errorProp;
  } else if (errorProp?.message) {
    errorMessage = errorProp.message;
    errorConfig = { ...errorProp };
    delete errorConfig.message;
  } else if (typeof errorProp === 'object' && errorProp !== null) {
    errorConfig = { ...errorProp };
    errorMessage = errorConfig.message ?? errorMessage;
    delete errorConfig.message;
  }
  
  // Merge props with error config (error config overrides props)
  const {
    type: errorType = type,
    title: errorTitle = title,
    icon: errorIcon = CustomIcon,
    retryText: errorRetryText = retryText,
    dismissText: errorDismissText = dismissText,
    styles: errorStyles = {},
    ...restErrorProps
  } = errorConfig ?? {};
  
  // Default styles based on message type
  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-700',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      buttonHover: 'hover:bg-red-100',
      buttonFocus: 'focus:ring-red-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-700',
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      buttonHover: 'hover:bg-yellow-100',
      buttonFocus: 'focus:ring-yellow-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-700',
      icon: Info,
      iconColor: 'text-blue-400',
      buttonHover: 'hover:bg-blue-100',
      buttonFocus: 'focus:ring-blue-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-700',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      buttonHover: 'hover:bg-green-100',
      buttonFocus: 'focus:ring-green-500',
    },
  };
  
  const currentType = typeStyles[errorType] || typeStyles.error;
  const IconComponent = errorIcon || currentType.icon || AlertTriangle;
  
  // Merge styles with type-specific styles
  const containerStyles = {
    ...(errorStyles.container || {}),
    className: `${currentType.bg} border-l-4 ${currentType.border} p-4 ${className}`.trim()
  };
  
  const iconStyles = {
    ...(errorStyles.icon || {}),
    className: `h-5 w-5 ${currentType.iconColor} ${errorStyles.icon?.className || ''}`.trim()
  };
  
  const messageStyles = {
    ...(errorStyles.message || {}),
    className: `text-sm ${currentType.text} ${errorStyles.message?.className || ''}`.trim()
  };
  
  const titleStyles = {
    ...(errorStyles.title || {}),
    className: `text-sm font-medium ${currentType.text} ${errorStyles.title?.className || ''}`.trim()
  };
  
  const buttonStyles = (variant = 'outline') => ({
    ...(errorStyles[`${variant}Button`] || {}),
    className: `${variant === 'outline' ? 'text-current' : ''} ${currentType.buttonHover} ${currentType.buttonFocus} ${errorStyles[`${variant}Button`]?.className || ''}`.trim()
  });
  
  const dismissButtonStyles = {
    ...(errorStyles.dismissButton || {}),
    className: `inline-flex rounded-md p-1.5 text-current hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentType.buttonFocus} ${errorStyles.dismissButton?.className || ''}`.trim()
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div 
        className={`${typeStyles[type]?.bg || 'bg-blue-50'} p-4 rounded-md flex items-center ${className}`}
        role="status"
        aria-live="polite"
        {...restProps}
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
        <span className="text-sm text-current">{loadingText}</span>
      </div>
    );
  }

  return (
    <div 
      {...containerStyles}
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      {...restErrorProps}
      {...restProps}
    >
      <div className="flex">
        {IconComponent && (
          <div className="flex-shrink-0">
            <IconComponent 
              {...iconStyles} 
              aria-hidden={!errorTitle ? 'true' : undefined}
              aria-label={!errorTitle ? errorMessage : undefined}
            />
          </div>
        )}
        
        <div className={`${IconComponent ? 'ml-3' : ''} flex-1`}>
          {errorTitle && (
            <h3 {...titleStyles}>
              {errorTitle}
            </h3>
          )}
          
          <p {...messageStyles}>
            {message}
          </p>
          
          {(onRetry || (dismissible && onDismiss)) && (
            <div className="mt-2 flex space-x-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={onRetry}
                  {...buttonStyles('outline')}
                >
                  {errorRetryText}
                </Button>
              )}
              
              {dismissible && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  {...buttonStyles('ghost')}
                >
                  {errorDismissText}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                {...dismissButtonStyles}
                aria-label={errorDismissText}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Error),
    PropTypes.shape({
      message: PropTypes.string,
      type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
      title: PropTypes.string,
      icon: PropTypes.elementType,
      retryText: PropTypes.string,
      dismissText: PropTypes.string,
      styles: PropTypes.object,
    }),
  ]),
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
  dismissible: PropTypes.bool,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  title: PropTypes.string,
  icon: PropTypes.elementType,
  retryText: PropTypes.string,
  dismissText: PropTypes.string,
  styles: PropTypes.shape({
    container: PropTypes.object,
    icon: PropTypes.object,
    message: PropTypes.object,
    title: PropTypes.object,
    outlineButton: PropTypes.object,
    ghostButton: PropTypes.object,
    dismissButton: PropTypes.object,
  }),
  role: PropTypes.string,
  autoDismiss: PropTypes.number,
  onAutoDismiss: PropTypes.func,
};

ErrorMessage.defaultProps = {
  type: 'error',
  dismissible: true,
  role: 'alert',
  retryText: 'Try Again',
  dismissText: 'Dismiss',
  styles: {},
};

export default ErrorMessage;
