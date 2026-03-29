"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type YearContextType = {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  years: string[];
};

const YearContext = createContext<YearContextType | undefined>(undefined);

const STORAGE_KEY = "dashboardSelectedYear";

export function YearProvider({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  // Keep dropdown size reasonable.
  const years = useMemo(() => {
    const start = Math.max(2000, currentYear - 20);
    const end = currentYear + 1;
    const arr: string[] = [];
    for (let y = start; y <= end; y++) arr.push(String(y));
    return arr;
  }, [currentYear]);

  const [selectedYear, setSelectedYearState] = useState<string>(String(currentYear));

  useEffect(() => {
    // Use sessionStorage to persist selected year across pages during the same session.
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && /^\d{4}$/.test(saved)) {
      setSelectedYearState(saved);
    } else {
      sessionStorage.setItem(STORAGE_KEY, String(currentYear));
    }
  }, [currentYear]);

  const setSelectedYear = (year: string) => {
    setSelectedYearState(year);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, year);
    }
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, years }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used within YearProvider");
  return ctx;
}

