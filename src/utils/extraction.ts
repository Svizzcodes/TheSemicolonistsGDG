// utils/extraction.ts
import { PatientHistoryEntry } from './patientHistory';

export interface MedicalExtraction {
  conditions: string[];
  medications: string[];
  labResults: { test: string; value: string; status: 'normal' | 'abnormal' | 'unknown' }[];
  vitalSigns: { name: string; value: string }[];
  allergies: string[];
  procedures: string[];
}

export const extractMedicalInfo = (text: string): MedicalExtraction => {
  // This is a simple placeholder. You can improve with regex later
  const lowerText = text.toLowerCase();

  const conditions = [];
  if (lowerText.includes('diabetes')) conditions.push('Diabetes');
  if (lowerText.includes('hypertension')) conditions.push('Hypertension');

  const medications = [];
  if (lowerText.includes('metformin')) medications.push('Metformin');
  if (lowerText.includes('lisinopril')) medications.push('Lisinopril');

  const labResults = [];
  if (lowerText.includes('hba1c')) labResults.push({ test: 'HbA1c', value: '7.2%', status: 'abnormal' });

  const vitalSigns = [];
  if (lowerText.includes('blood pressure')) vitalSigns.push({ name: 'Blood Pressure', value: '140/90' });

  const allergies = lowerText.includes('penicillin') ? ['Penicillin'] : [];
  const procedures = lowerText.includes('blood test') ? ['Blood Test'] : [];

  return { conditions, medications, labResults, vitalSigns, allergies, procedures };
};
