import React from 'react';
export const OtpInput: React.FC<any> = ({ children, className }) => (
  <div className={`ui-otpinput ${className || ''}`}>
    {children || 'OtpInput Component'}
  </div>
);