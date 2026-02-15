import React from 'react';
export const Tooltip: React.FC<any> = ({ children, className }) => (
  <div className={`ui-tooltip ${className || ''}`}>
    {children || 'Tooltip Component'}
  </div>
);