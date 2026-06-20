import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  let roundedClass = 'rounded-2xl';
  if (variant === 'circular') roundedClass = 'rounded-full';
  if (variant === 'text') roundedClass = 'rounded-md';

  return (
    <div
      className={`animate-pulse bg-border ${roundedClass} ${className}`}
    />
  );
};

export default Skeleton;
