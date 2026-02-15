import React from 'react';
export const Alert: React.FC<any> = ({ children, className }) => (
  <div className={`ui-alert ${className || ''}`}>
    {children || 'Alert Component'}
  </div>
);