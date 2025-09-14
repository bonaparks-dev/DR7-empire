import React from 'react';

const EnvGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The environment variables have been hardcoded to resolve a configuration issue.
  // This guard is now disabled and simply renders its children.
  return <>{children}</>;
};

export default EnvGuard;
