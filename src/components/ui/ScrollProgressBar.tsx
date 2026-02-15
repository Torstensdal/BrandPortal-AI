import React from 'react';
export const ScrollProgressBar: React.FC<any> = ({ children, className }) => (
  <div className={`ui-scrollprogressbar ${className || ''}`}>
    {children || 'ScrollProgressBar Component'}
  </div>
);