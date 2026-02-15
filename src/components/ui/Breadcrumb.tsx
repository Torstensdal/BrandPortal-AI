import React from 'react';
export const Breadcrumb: React.FC<any> = ({ children, className }) => (
  <div className={`ui-breadcrumb ${className || ''}`}>
    {children || 'Breadcrumb Component'}
  </div>
);