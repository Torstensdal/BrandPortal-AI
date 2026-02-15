import React from 'react';
export const Rating: React.FC<any> = ({ children, className }) => (
  <div className={`ui-rating ${className || ''}`}>
    {children || 'Rating Component'}
  </div>
);