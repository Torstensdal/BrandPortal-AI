import React from 'react';
export const Loading: React.FC<any> = ({ children, className }) => (
  <div className={`ui-loading ${className || ''}`}>
    {children || 'Loading Component'}
  </div>
);