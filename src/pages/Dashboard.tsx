import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { redactText, RedactionResult } from '../utils/redaction';
import {
  generateDoctorSummaryWithAI,
  generatePatientSummaryWithAI,
  generateDoctorSummary,
  generatePatientSummary
} from '../utils/summarization';
import { PatientHistoryEntry, getPatientHistory, savePatientHistory, getAllPatientEmails } from '../utils/patientHistory';

// Mock extraction function for now
const mockExtractMedicalInfo = (text: string) => {
  // Very simple heuristic: split lines for conditions or meds
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    conditions: lines.slice(0, 3),          // first 3 lines as conditions
    medications: lines.slice(3, 6),         // next 3 lines as meds
    labResults: lines.slice(6, 9).map(l => ({ test: l, value: 'N/A', status: 'normal' })),
    vitalSigns: [{ name: 'Blood Pressure', value: '120/80' }],
    allergies: ['None noted'],
    procedures: ['General Checkup']
  };
};



const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Medical record state
  const [rawText, setRawText] = useState('');
  const [redactedPreview, setRedactedPreview] = useState<RedactionResult | null>(null);
  const [showRedacted, setShowRedacted] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');

  // Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<'doctor' | 'patient'>('doctor');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<PatientHistoryEntry[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [availablePatients, setAvailablePatients] = useState<string[]>([]);

  // UI state
  const [uploadError, setUploadError] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Load available patients for doctors
  useEffect(() => {
    if (user?.role === 'doctor') {
      setAvailablePatients(getAllPatientEmails());
    } else if (user?.role === 'patient') {
      setPatientEmail(user.email);
      setHistory(getPatientHistory(user.email));
    }
  }, [user]);

  // Tab visibility for privacy
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Prevent right-click on summary
  const preventContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Handle logout - clear all sensitive data
  const handleLogout = () => {
    setRawText('');
    setRedactedPreview(null);
    setSummary(null);
    setPatientEmail('');
    setHistory([]);
    logout();
    navigate('/');
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      setUploadError('Only TXT and PDF files are supported. PDF content will be read as text.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setRedactedPreview(null);
        setSummary(null);
      }
    };
    reader.onerror = () => setUploadError('Failed to read file. Please try again.');
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Preview redaction
  const handlePreviewRedaction = () => {
    if (!rawText.trim()) return;
    const result = redactText(rawText);
    setRedactedPreview(result);
    setShowRedacted(true);
  };

  // Generate summary
  const handleGenerateSummary = async () => {
    if (!rawText.trim()) {
      setUploadError('Please enter or upload medical record text first.');
      return;
    }

    if (user?.role === 'doctor' && !patientEmail.trim()) {
      setUploadError('Please enter the patient email to associate this record.');
      return;
    }

    setUploadError('');
    const targetEmail = user?.role === 'patient' ? user.email : patientEmail;
    const patientHistory = getPatientHistory(targetEmail);

    // Redact first
    const { redactedText } = redactText(rawText);
    if (!redactedText.trim()) {
      setUploadError('Redacted text is empty.');
      return;
    }

    // Extract medical information
  let extraction;
try {
  extraction = mockExtractMedicalInfo(redactedText);
} catch (err) {
  console.error('Extraction failed:', err);
  setUploadError('Failed to extract medical info.');
  return;
}


    try {
      let displaySummary = '';
      if (user?.role === 'doctor') {
        displaySummary = await generateDoctorSummaryWithAI(extraction, patientHistory, redactedText);
        setSummaryType('doctor');
      } else {
        displaySummary = await generatePatientSummaryWithAI(extraction, patientHistory, redactedText);
        setSummaryType('patient');
      }

      setSummary(displaySummary);
      const timestamp = new Date().toISOString();
      setGeneratedAt(timestamp);

      // Save to history
      const historyEntry: PatientHistoryEntry = {
        timestamp,
        conditions: extraction.conditions,
        doctorSummary: user?.role === 'doctor' ? displaySummary : '',
        patientSummary: user?.role === 'patient' ? displaySummary : ''
      };
      savePatientHistory(targetEmail, historyEntry);
      setHistory([...patientHistory, historyEntry]);

      // Update available patients for doctors
      if (user?.role === 'doctor') {
        setAvailablePatients(getAllPatientEmails());
      }

      // Clear raw text after processing
      setRawText('');
      setRedactedPreview(null);
      setShowRedacted(false);
    } catch (err) {
      console.error('AI call failed:', err);
      setUploadError('Failed to generate summary. Please try again.');
    }
  };

  // Load history entry
  const handleLoadHistory = (index: number) => {
    const entry = history[index];
    if (entry) {
      setSelectedHistoryIndex(index);
      const displaySummary = user?.role === 'doctor' ? entry.doctorSummary : entry.patientSummary;
      setSummary(displaySummary);
      setSummaryType(user?.role === 'doctor' ? 'doctor' : 'patient');
      setGeneratedAt(entry.timestamp);
    }
  };

  // Load patient history (for doctors)
  const handleLoadPatientHistory = (email: string) => {
    setPatientEmail(email);
    const patientHistory = getPatientHistory(email);
    setHistory(patientHistory);
    setSelectedHistoryIndex(null);
    setSummary(null);
  };

  const formatTimestamp = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            Medi<span className="text-teal-600">Gist</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Input & History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Medical Record Input */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Medical Record Input</h2>

                {user?.role === 'doctor' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Patient Email
                    </label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Upload File (TXT)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
                </div>

                {/* Text Area */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Or Paste/Type Medical Record
                  </label>
                  <textarea
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      setRedactedPreview(null);
                    }}
                    placeholder="Paste medical record text here..."
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviewRedaction}
                    disabled={!rawText.trim()}
                    className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview Redaction
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={!rawText.trim()}
                    className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Summary
                  </button>
                </div>

                {/* Redacted Preview */}
                {redactedPreview && showRedacted && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-amber-800">
                        Redacted Preview ({redactedPreview.redactionCount.total} items redacted)
                      </h3>
                      <button
                        onClick={() => setShowRedacted(false)}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        ✕
                      </button>
                    </div>
                    <pre className="text-xs text-amber-900 whitespace-pre-wrap overflow-auto max-h-40 bg-amber-100 p-2 rounded">
                      {redactedPreview.redactedText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Patient History */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Patient History</h2>

                {user?.role === 'doctor' && availablePatients.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                    <select
                      value={patientEmail}
                      onChange={(e) => handleLoadPatientHistory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Choose a patient...</option>
                      {availablePatients.map(email => (
                        <option key={email} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>
                )}

                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">No history found for this patient.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {history.map((entry, index) => (
                      <button
                        key={index}
                        onClick={() => handleLoadHistory(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedHistoryIndex === index
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <p className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</p>
                        <p className="text-sm font-medium text-slate-700 mt-1">
                          {entry.conditions.length > 0 
                            ? entry.conditions.slice(0, 3).join(', ') + (entry.conditions.length > 3 ? '...' : '')
                            : 'No conditions identified'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {summaryType === 'doctor' ? 'Clinical Summary' : 'Patient Summary'}
                  </h2>
                  {summary && (
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
                      {user?.role === 'doctor' ? 'Doctor View' : 'Patient View'}
                    </span>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500">
                    🔒 UI-level privacy protection applied. Text selection and right-click disabled.
                  </p>
                </div>

                {/* Summary Display */}
                {summary ? (
                  <div
                    className={`relative ${!isTabVisible ? 'blur-lg' : ''}`}
                    onContextMenu={preventContextMenu}
                    style={{ userSelect: 'none' }}
                  >
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      <div className="transform -rotate-45 text-2xl font-bold text-slate-800 whitespace-nowrap">
                        Viewed by: {user?.name} ({user?.role}) | {generatedAt && formatTimestamp(generatedAt)}
                      </div>
                    </div>

                    <pre
                      className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto max-h-[500px]"
                      onCopy={(e) => e.preventDefault()}
                    >
                      {summary}
                    </pre>

                    <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center">
                      <p className="text-xs text-slate-600">
                        <strong>Viewed by:</strong> {user?.name} ({user?.role}) | {generatedAt && formatTimestamp(generatedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">Enter a medical record to generate a summary</p>
                    </div>
                  </div>
                )}

                {/* Tab visibility warning */}
                {!isTabVisible && summary && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                    <div className="bg-white p-6 rounded-lg text-center">
                      <p className="text-slate-700 font-medium">Content hidden for privacy</p>
                      <p className="text-sm text-slate-500 mt-1">Return to this tab to view</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500">
        MediGist © 2026
      </footer>
    </div>
  );
};

export default Dashboard;
