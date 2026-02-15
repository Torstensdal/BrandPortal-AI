import React from 'react';
export const VerificationCode: React.FC<any> = ({ children, className }) => (
  <div className={`ui-verificationcode ${className || ''}`}>
    {children || 'VerificationCode Component'}
  </div>
);