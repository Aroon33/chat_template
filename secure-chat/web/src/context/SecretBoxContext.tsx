import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";


export type SecretItemType = "message" | "link" | "file";

export type SecretItem = {
  id: string;
  type: SecretItemType;
  content: string;
  createdAt: string;
};

type SecretBoxContextValue = {
  items: SecretItem[];
  addItem: (item: { type: SecretItemType; content: string }) => void;
};

const SecretBoxContext = createContext<SecretBoxContextValue | undefined>(
  undefined
);

type ProviderProps = {
  children: ReactNode;
};

export function SecretBoxProvider(props: ProviderProps) {
  const { children } = props;

  const [items, setItems] = useState<SecretItem[]>([]);

  const addItem = (item: { type: SecretItemType; content: string }) => {
    const now = new Date();
    const newItem: SecretItem = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      type: item.type,
      content: item.content,
      createdAt: now.toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  return (
    <SecretBoxContext.Provider value={{ items, addItem }}>
      {children}
    </SecretBoxContext.Provider>
  );
}

export const useSecretBox = () => {
  const ctx = useContext(SecretBoxContext);
  if (!ctx) {
    throw new Error("useSecretBox must be used within SecretBoxProvider");
  }
  return ctx;
};

