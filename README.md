MediGist

MediGist is a privacy focused medical summarization tool that converts raw medical records into structured summaries using AI. It supports both doctor and patient views while applying redaction before any AI processing.

Doctors receive concise clinical summaries.
Patients receive simplified, easy to understand explanations.
Sensitive information is redacted before being sent to the AI.

Project overview

MediGist allows users to:

Paste or upload medical records

Automatically redact sensitive data

Generate AI powered summaries using Google Gemini

Maintain per patient medical history

View summaries in doctor or patient mode

Apply UI level privacy protections like copy blocking and tab visibility blur

Tech stack

Vite

React

TypeScript

Tailwind CSS

shadcn-ui

Google Gemini API

Getting started locally

Prerequisites

Node.js

npm

Installation

Clone the repository

git clone <YOUR_GIT_URL>

Navigate into the project directory

cd <YOUR_PROJECT_NAME>

Install dependencies

npm install

Environment variables

Create a .env file in the root directory and add your Gemini API key.

VITE_GEMINI_API_KEY=your_gemini_api_key_here

Important:
Because this project uses Vite, environment variables must be prefixed with VITE_.

After adding the key, restart the development server.

Run the project

npm run dev

The app will be available at the local URL shown in the terminal.

Relevant project structure

src/
utils/
ai/
geminiClient.ts
aisummarizer.ts
prompts.ts
summarization.ts
redaction.ts
patientHistory.ts
pages/
Dashboard.tsx

Security and privacy notes

Medical text is redacted before AI processing

API keys are not hardcoded

UI level protections prevent copying and background viewing

Intended for academic and prototype use

For production, AI calls should be moved to a secure backend.

Build for production

npm run build

The output will be generated in the dist folder.