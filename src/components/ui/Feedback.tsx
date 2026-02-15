import React from 'react';
export const Feedback: React.FC<any> = ({ children, className }) => (
  <div className={`ui-feedback ${className || ''}`}>
    {children || 'Feedback Component'}
  </div>
);