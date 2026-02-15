import React from 'react';
export const Label: React.FC<any> = ({ children, className }) => (
  <div className={`ui-label ${className || ''}`}>
    {children || 'Label Component'}
  </div>
);