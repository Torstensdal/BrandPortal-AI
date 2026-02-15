import React from 'react';
export const Badge: React.FC<any> = ({ children, className }) => (
  <div className={`ui-badge ${className || ''}`}>
    {children || 'Badge Component'}
  </div>
);