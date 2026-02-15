import React from 'react';
export const Popover: React.FC<any> = ({ children, className }) => (
  <div className={`ui-popover ${className || ''}`}>
    {children || 'Popover Component'}
  </div>
);