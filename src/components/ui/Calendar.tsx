import React from 'react';
export const Calendar: React.FC<any> = ({ children, className }) => (
  <div className={`ui-calendar ${className || ''}`}>
    {children || 'Calendar Component'}
  </div>
);