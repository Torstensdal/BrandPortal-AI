import React from 'react';
export const Progress: React.FC<any> = ({ children, className }) => (
  <div className={`ui-progress ${className || ''}`}>
    {children || 'Progress Component'}
  </div>
);