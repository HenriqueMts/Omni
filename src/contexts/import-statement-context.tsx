"use client";

import * as React from "react";

type ImportStatementContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ImportStatementContext = React.createContext<ImportStatementContextValue | null>(null);

export function ImportStatementProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open, setOpen }), [open]);
  return (
    <ImportStatementContext.Provider value={value}>
      {children}
    </ImportStatementContext.Provider>
  );
}

export function useImportStatement() {
  const ctx = React.useContext(ImportStatementContext);
  if (!ctx) {
    throw new Error("useImportStatement must be used within ImportStatementProvider");
  }
  return ctx;
}
