export const DOCTOR_FALLBACK_PROMPT = (sanitizedText: string) => `
You are assisting a licensed doctor.

Rules you MUST follow:
- Use ONLY the provided text
- Do NOT add diagnoses
- Do NOT suggest treatment
- Do NOT infer missing facts
- If something is unclear, say it is unclear
- Be concise and factual

Task:
Extract clinically relevant information that may not fit structured rules
such as disease progression, context, or observations.

Medical text:
${sanitizedText}
`;

export const PATIENT_FALLBACK_PROMPT = (sanitizedText: string) => `
You are explaining medical notes to a patient.

Rules you MUST follow:
- Use ONLY the provided text
- Do NOT diagnose
- Do NOT give medical advice
- Use simple language
- If something is unclear, say so clearly

Task:
Explain the important information in a calm and understandable way.

Medical text:
${sanitizedText}
`;
