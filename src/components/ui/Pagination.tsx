import React from 'react';
export const Pagination: React.FC<any> = ({ children, className }) => (
  <div className={`ui-pagination ${className || ''}`}>
    {children || 'Pagination Component'}
  </div>
);