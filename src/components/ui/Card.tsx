import React from 'react';
export const Card: React.FC<any> = ({ children, className }) => (
  <div className={`ui-card ${className || ''}`}>
    {children || 'Card Component'}
  </div>
);