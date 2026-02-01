// patientHistory.ts
const HISTORY_STORAGE_KEY = 'medigist_patient_history';

// ------------------- Types -------------------

export interface PatientHistoryEntry {
  timestamp: string; // ISO string
  conditions: string[];
  doctorSummary?: string;
  patientSummary?: string;
  medications?: string[];
  labResults?: { test: string; value: string; status: 'normal' | 'abnormal' | 'unknown' }[];
  allergies?: string[];
  vitalSigns?: { name: string; value: string }[];
  procedures?: string[];
}

// ------------------- Storage -------------------

interface HistoryStore {
  [patientEmail: string]: PatientHistoryEntry[];
}

export const getPatientHistory = (patientEmail: string): PatientHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const allHistory: HistoryStore = JSON.parse(stored);
    return allHistory[patientEmail.toLowerCase()] || [];
  } catch (err) {
    console.error('Error reading patient history:', err);
    return [];
  }
};

export const savePatientHistory = (patientEmail: string, entry: PatientHistoryEntry) => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const allHistory: HistoryStore = stored ? JSON.parse(stored) : {};
    const email = patientEmail.toLowerCase();
    if (!allHistory[email]) allHistory[email] = [];
    allHistory[email].push(entry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
  } catch (err) {
    console.error('Error saving patient history:', err);
  }
};

export const getAllPatientEmails = (): string[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const allHistory: HistoryStore = JSON.parse(stored);
    return Object.keys(allHistory);
  } catch (err) {
    console.error('Error reading patient emails:', err);
    return [];
  }
};

export const clearAllHistory = (): void => {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
};

// ------------------- Minimal extraction -------------------

export interface MedicalExtraction {
  conditions: string[];
  medications: string[];
  labResults: { test: string; value: string; status: 'normal' | 'abnormal' | 'unknown' }[];
  allergies: string[];
  vitalSigns: { name: string; value: string }[];
  procedures: string[];
}

export const extractMedicalInfo = (text: string): MedicalExtraction => {
  // Placeholder: returns empty arrays so summaries won't break
  return {
    conditions: [],
    medications: [],
    labResults: [],
    allergies: [],
    vitalSigns: [],
    procedures: [],
  };
};
