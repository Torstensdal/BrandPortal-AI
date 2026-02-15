import React from 'react';
export const Timeline: React.FC<any> = ({ children, className }) => (
  <div className={`ui-timeline ${className || ''}`}>
    {children || 'Timeline Component'}
  </div>
);