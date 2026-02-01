// src/utils/ai/aiSummarizer.ts
import axios from 'axios';
import { MedicalExtraction } from '../summarization';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://api.gemini.ai/v1'; // replace with actual Gemini endpoint

export const shouldUseAI = (extraction: MedicalExtraction): boolean => {
  // Use AI if there are conditions, medications, or lab results
  return extraction.conditions.length > 0 || extraction.medications.length > 0 || extraction.labResults.length > 0;
};

export const generateAISupplement = async (text: string, target: 'doctor' | 'patient'): Promise<string | null> => {
  try {
    const systemPrompt =
      target === 'doctor'
        ? 'Generate a professional clinical summary from the following text. Keep it concise, structured, and safe.'
        : 'Generate a simple, patient-friendly summary of the following medical text. Explain medical terms simply.';

    const response = await axios.post(
      `${GEMINI_BASE_URL}/generate`,
      {
        prompt: `${systemPrompt}\n\n${text}`,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.text) return response.data.text;
    return null;
  } catch (err) {
    console.error('Gemini AI error:', err);
    return null;
  }
};
