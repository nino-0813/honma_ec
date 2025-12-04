
import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

// Progressive Image Loading Component
export const FadeInImage = ({ src, alt, className, priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#f4f4f4] ${className}`}>
      {/* Placeholder / Skeleton */}
      <div className={`absolute inset-0 bg-[#f4f4f4] transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />
      
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-all duration-1000 ease-out transform ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
        }`}
      />
    </div>
  );
};

interface LoadingButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// Micro-interaction Button: Idle -> Loading -> Success -> Callback
export const LoadingButton = ({ onClick, children, disabled, className }: LoadingButtonProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleClick = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    
    // Simulate network request / processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setStatus('success');
    
    // Show success state briefly before triggering the actual action (opening cart)
    setTimeout(() => {
      onClick();
      setTimeout(() => setStatus('idle'), 500); // Reset button state after drawer opens
    }, 800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || status !== 'idle'}
      className={`${className} relative overflow-hidden transition-all duration-500 ease-out ${
        status === 'success' ? '!bg-gray-900 !border-gray-900 text-white' : ''
      }`}
    >
      {/* Default Text */}
      <span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
        status === 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}>
        {children}
      </span>
      
      {/* Loading Spinner */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
        status === 'loading' ? 'opacity-100 translate-y-0' : status === 'idle' ? 'opacity-0 translate-y-full' : 'opacity-0 -translate-y-full'
      }`}>
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      </div>

      {/* Success State */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
        status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}>
        <span className="flex items-center gap-2 font-medium tracking-widest text-white">
          <Check className="w-5 h-5" /> ADDED
        </span>
      </div>
    </button>
  );
};
