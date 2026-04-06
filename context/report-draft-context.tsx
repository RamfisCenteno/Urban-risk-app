import { createContext, useContext, useState, ReactNode } from 'react';

type ReportDraft = {
  incidentType: string;
  description: string;
  severity: string;
  place: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
};

type ReportDraftContextType = {
  draft: ReportDraft;
  updateDraft: (fields: Partial<ReportDraft>) => void;
  resetDraft: () => void;
};

const initialDraft: ReportDraft = {
  incidentType: '',
  description: '',
  severity: '',
  place: '',
  latitude: null,
  longitude: null,
  address: '',
};

const ReportDraftContext = createContext<ReportDraftContextType | undefined>(
  undefined
);

export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);

  const updateDraft = (fields: Partial<ReportDraft>) => {
    setDraft((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  const resetDraft = () => {
    setDraft(initialDraft);
  };

  return (
    <ReportDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const context = useContext(ReportDraftContext);

  if (!context) {
    throw new Error('useReportDraft debe usarse dentro de ReportDraftProvider');
  }

  return context;
}