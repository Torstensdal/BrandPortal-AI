import React from 'react';
export const RadioGroup: React.FC<any> = ({ children, className }) => (
  <div className={`ui-radiogroup ${className || ''}`}>
    {children || 'RadioGroup Component'}
  </div>
);