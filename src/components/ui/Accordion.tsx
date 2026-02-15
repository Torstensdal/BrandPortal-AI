import React from 'react';
export const Accordion: React.FC<any> = ({ children, className }) => (
  <div className={`ui-accordion ${className || ''}`}>
    {children || 'Accordion Component'}
  </div>
);