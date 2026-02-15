import React from 'react';
export const Form: React.FC<any> = ({ children, className }) => (
  <div className={`ui-form ${className || ''}`}>
    {children || 'Form Component'}
  </div>
);