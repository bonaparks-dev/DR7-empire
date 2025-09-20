import React from 'react';

// FIX: Updated ButtonProps to support polymorphism with an 'as' prop and allow additional props like 'to' for links.
type ButtonProps = React.PropsWithChildren<{
  variant?: 'primary' | 'outline' | 'luxury';
  size?: 'sm' | 'md' | 'lg';
  as?: React.ElementType;
  className?: string;
  [x: string]: any;
}>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', as: Component = 'button', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary: "bg-white text-black hover:bg-gray-200",
      outline: "bg-transparent border border-white/40 text-white hover:bg-white/10 hover:border-white",
      luxury: "bg-gradient-to-r from-gray-700 via-gray-800 to-black text-white border border-gray-600 shadow-lg hover:shadow-white/20 transform hover:scale-105",
    };

    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const finalClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return <Component className={finalClasses} ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
