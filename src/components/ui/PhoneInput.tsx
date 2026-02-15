import React from 'react';
export const PhoneInput: React.FC<any> = ({ children, className }) => (
  <div className={`ui-phoneinput ${className || ''}`}>
    {children || 'PhoneInput Component'}
  </div>
);