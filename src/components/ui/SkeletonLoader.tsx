import React from 'react';
export const SkeletonLoader: React.FC<any> = ({ children, className }) => (
  <div className={`ui-skeletonloader ${className || ''}`}>
    {children || 'SkeletonLoader Component'}
  </div>
);