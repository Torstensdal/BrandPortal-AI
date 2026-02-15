import React from 'react';
export const Stepper: React.FC<any> = ({ children, className }) => (
  <div className={`ui-stepper ${className || ''}`}>
    {children || 'Stepper Component'}
  </div>
);