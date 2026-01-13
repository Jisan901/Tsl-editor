
import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  simpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
}

export const UIContext = createContext<UIContextType>({ simpleMode: false, setSimpleMode: () => {} });

export const useUI = () => useContext(UIContext);

export const UIProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [simpleMode, setSimpleMode] = useState(false);
  return (
    <UIContext.Provider value={{ simpleMode, setSimpleMode }}>
      {children}
    </UIContext.Provider>
  );
};
