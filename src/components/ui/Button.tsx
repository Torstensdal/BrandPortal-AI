import React from 'react';
export const Button: React.FC<any> = ({ children, className }) => (
  <div className={`ui-button ${className || ''}`}>
    {children || 'Button Component'}
  </div>
);