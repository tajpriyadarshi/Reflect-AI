# Reflective AI Journal

A secure, real-time AI-powered reflective journaling application built with React, TypeScript, Express, Tailwind CSS, Google Cloud Firestore, Firebase Authentication, and the Gemini API via `@google/genai`.

---

## 1. Threat Summary Table (Agentic Threat Modeling)

| Threat Zone | Threat Scenario | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection or oversized payload via `/api/chat` | Server enforces `express.json({ limit: '1mb' })`, null-safe destructuring, and string slicing up to 10,000 chars. |
| **Planning & Reasoning** | Prompt injection attempting to break journal persona | Dedicated system instructions with grounded, empathetic boundaries and separation between conversational history and system prompt. |
| **Tool / Model Execution** | Gemini rate limits, outages, or model deprecations | Automated resilient fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Memory & State** | Cross-user data leakage or unauthorized journal document tampering | Strict owner-bound Firestore security rules (`users/{userId}/journals/{journalId}` verifying `request.auth.uid == userId`) and payload undefined-stripping (`sanitizePayload`). |
| **Inter-System Communication** | Secret key leakage to browser client | Server-side proxy architecture where `GEMINI_API_KEY` is strictly kept on the Express backend (`server.ts`) and never exposed to the frontend. |

---

## 2. Prerequisites & Environment Setup

### Required Tools
- Node.js 20+
- Google Cloud SDK (`gcloud` CLI)
- Firebase CLI (`firebase-tools`)

### Enabled Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 3. Secret Management Setup (Zero-Hardcoding Hygiene)

Create and populate the `GEMINI_API_KEY` in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Google Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add the secret version with your Gemini API Key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run default service account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Firestore Database Security Configuration

Deploy owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journals/{journalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Google Cloud Run Deployment Flow

Deploy the full-stack container application directly to Cloud Run with Secret Manager environment injection:

```bash
# Build and deploy service
gcloud run deploy reflective-ai-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Mandatory Verification Binding (Challenge Label)
```bash
gcloud run services update reflective-ai-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Walkthrough & Test Guide

Every user interaction has a defined test case:

### Test Case 1: Google Authentication Flow
1. Open the application landing screen.
2. Click **"Sign In with Google"** in the navigation header or banner.
3. Complete the Google OAuth popup dialog.
4. **Verification**: The user profile avatar and name display in the top header, the empty journal dashboard renders, and the composer is enabled.

### Test Case 2: Multi-Turn Journal Entry Submission
1. In the composer textarea, select a mood chip (e.g. *Grateful*).
2. Click an inspiration starter or type a personal thought (e.g. *"Today I finished my major milestone and felt deeply satisfied."*).
3. Click **"Reflect & Save"** (or press `Cmd/Ctrl + Enter`).
4. **Verification**: 
   - A loading indicator displays during model inference.
   - The entry is persisted in real-time to Firestore.
   - The user thought and Gemini reflection appear at the top of the timeline.
   - The composer textarea resets cleanly.

### Test Case 3: Error Recovery & Input Preservation
1. Disconnect network or trigger an API rejection.
2. Attempt to submit a new reflection.
3. **Verification**: An accessible error banner appears with a **"Retry Save"** button; the written text in the textarea is strictly preserved without loss.

### Test Case 4: Search & Mood Filtering
1. Type a keyword present in one of the journal entries into the search bar.
2. **Verification**: The list filters instantly to show matching reflections with a live entry counter.
3. Click a mood filter (e.g. *Grateful*).
4. **Verification**: Only entries tagged with *Grateful* are displayed.

### Test Case 5: Copy & Delete Actions
1. Click the **Copy** icon on an entry card.
2. **Verification**: A checkmark icon flashes and the formatted text is written to the system clipboard.
3. Click the **Delete** (Trash) icon on an entry card and confirm.
4. **Verification**: The document is immediately removed from Firestore and disappears from the real-time timeline.
