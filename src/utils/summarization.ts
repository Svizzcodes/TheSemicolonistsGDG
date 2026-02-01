// src/utils/summarization.ts
import { shouldUseAI, generateAISupplement } from './ai/aiSummarizer';

export interface LabResult {
  test: string;
  value: string;
  status: 'normal' | 'abnormal' | 'unknown';
}

export interface VitalSign {
  name: string;
  value: string;
}

export interface MedicalExtraction {
  conditions: string[];
  medications: string[];
  labResults: LabResult[];
  vitalSigns: VitalSign[];
  allergies: string[];
  procedures: string[];
}

export interface PatientHistoryEntry {
  timestamp: string;
  conditions: string[];
  doctorSummary: string;
  patientSummary: string;
}

// --------- Mock extraction (replace with real NLP if needed) ---------
export const extractMedicalInfo = (text: string): MedicalExtraction => {
  // Simple regex-based extraction (demo)
  const conditions = Array.from(text.matchAll(/condition: ([\w\s]+)/gi), m => m[1].trim());
  const medications = Array.from(text.matchAll(/medication: ([\w\s]+)/gi), m => m[1].trim());
  const labResults: LabResult[] = Array.from(text.matchAll(/lab: ([\w\s]+) - ([\d.]+) \((normal|abnormal)\)/gi), m => ({
    test: m[1].trim(),
    value: m[2].trim(),
    status: m[3] as 'normal' | 'abnormal'
  }));

  return {
    conditions,
    medications,
    labResults,
    vitalSigns: [], 
    allergies: [],
    procedures: []
  };
};

// --------- Rule-based summaries (unchanged from your previous code) ---------
export const generateDoctorSummary = (extraction: MedicalExtraction, history: PatientHistoryEntry[]): string => {
  let lines: string[] = ['=== CLINICAL SUMMARY ===\n'];
  lines.push('CONDITIONS:');
  lines.push(extraction.conditions.length ? extraction.conditions.map(c => `  • ${c}`).join('\n') : '  No conditions explicitly identified in record.');
  lines.push('\nMEDICATIONS:');
  lines.push(extraction.medications.length ? extraction.medications.map(m => `  • ${m}`).join('\n') : '  No medications explicitly mentioned.');
  lines.push('\nLAB RESULTS:');
  lines.push(extraction.labResults.length ? extraction.labResults.map(lr => `  ${lr.status === 'abnormal' ? '⚠' : '✓'} ${lr.test}: ${lr.value} (${lr.status})`).join('\n') : '  No lab results found in record.');
  lines.push('\n---');
  lines.push('Note: This summary is extracted from the provided text using pattern matching.');
  return lines.join('\n');
};

export const generatePatientSummary = (extraction: MedicalExtraction, history: PatientHistoryEntry[]): string => {
  let lines: string[] = ['=== YOUR HEALTH SUMMARY ===\n'];
  lines.push('YOUR HEALTH CONDITIONS:');
  lines.push(extraction.conditions.length ? extraction.conditions.map(c => `  • ${c}`).join('\n') : '  No specific conditions were identified in this record.');
  lines.push('\nYOUR MEDICATIONS:');
  lines.push(extraction.medications.length ? extraction.medications.map(m => `  • ${m}`).join('\n') : '  No specific medications were mentioned.');
  lines.push('\n---');
  lines.push('This summary is for informational purposes only.');
  return lines.join('\n');
};

// --------- AI-assisted summaries ---------
export const generateDoctorSummaryWithAI = async (extraction: MedicalExtraction, history: PatientHistoryEntry[], rawText: string): Promise<string> => {
  let summary = generateDoctorSummary(extraction, history);
  if (shouldUseAI(extraction)) {
    const aiExtra = await generateAISupplement(rawText, 'doctor');
    if (aiExtra) summary += `\n\n=== AI-ASSISTED CONTEXT ===\n${aiExtra}`;
  }
  return summary;
};

export const generatePatientSummaryWithAI = async (extraction: MedicalExtraction, history: PatientHistoryEntry[], rawText: string): Promise<string> => {
  let summary = generatePatientSummary(extraction, history);
  if (shouldUseAI(extraction)) {
    const aiExtra = await generateAISupplement(rawText, 'patient');
    if (aiExtra) summary += `\n\n=== AI-ASSISTED EXPLANATION ===\n${aiExtra}`;
  }
  return summary;
};