import React from 'react';
export const Textarea: React.FC<any> = ({ children, className }) => (
  <div className={`ui-textarea ${className || ''}`}>
    {children || 'Textarea Component'}
  </div>
);