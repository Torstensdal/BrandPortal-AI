import React from 'react';
export const HoverCard: React.FC<any> = ({ children, className }) => (
  <div className={`ui-hovercard ${className || ''}`}>
    {children || 'HoverCard Component'}
  </div>
);