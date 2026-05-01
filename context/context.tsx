import React, { createContext, useContext, useState } from 'react';

const Context = createContext<any>(null);

export function Provider({ children }: { children: React.ReactNode }) {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  return (
    <Context.Provider value={{ adminPassword, setAdminPassword }}>
      {children}
    </Context.Provider>
  );
}

export function useGlobalContext() {
  return useContext(Context);
}