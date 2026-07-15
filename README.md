# EduGradeX — All Semester CGPA Calculator

EduGradeX is a comprehensive, web-based GPA and CGPA calculation system designed for students to manage and monitor their academic performance across all 8 semesters. Featuring a sleek glassmorphic dark-mode interface, Firebase cloud sync, AI-powered grade projections, and a robust administrative portal — all without requiring a traditional login flow.

---

## 🚀 Key Features

### For Students
- **No Login Required:** Students simply enter their **Roll Number** when calculating. The system auto-creates a new Firestore record if one doesn't exist, or updates their existing record.
- **Accurate SGPA / CGPA Calculations:** Effortlessly compute Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) dynamically across all semesters.
- **Live CGPA Display on Home Page:** The home page always shows the **latest calculated student's CGPA** — updated every time a new calculation is performed, even when multiple students use the same device.
- **AI SGPA & CGPA Predictor:** Select target graduation outcomes and behavioral profiles (Auto-Trend Analytics, Steady Consistency, Ambitious Acceleration) to receive intelligent grade trajectory plans and actionable study insights.
- **Target CGPA Calculator:** Determine the exact GPA needed in remaining semesters to achieve a desired target score based on completed and remaining credits.
- **Subject-wise Student Detail View:** View subject-wise breakdowns of grades, subject codes, and credit values in a clean table format.
- **Auto-Sync & History Tracking:** Store calculation history in both local storage and Firebase Firestore using Roll Number as the unique identifier.
- **Professional PDF Reports:** Export beautifully formatted academic transcripts with a single click.

### For Administrators
- **Secure Admin Portal:** Access controlled via a document-based administrator validation mechanism in Firestore.
- **Live Student Monitoring:** Real-time results logs filterable by Year (1st–4th), Section (A–E), and Semester (1st–8th).
- **Subject Registry Management:** Dynamically add, edit, reorder, or delete subjects, credit values, and subject codes per semester.
- **Student Data Management:**
  - Add single students with live status checking.
  - Bulk upload student rosters via CSV (`rollNo, name, year, section`).
  - Range-based promotions, updates, or deletions.
- **System Controls:** Toggle database write access ON/OFF per semester to enforce data integrity during evaluation windows.
- **Advanced Data Export:** Export aggregated records or subject-wise grade logs as formatted CSV or A4 landscape PDF reports.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Semantic HTML5, Vanilla CSS3 (Custom properties, Glassmorphic effects), Vanilla JavaScript (ES6 Modules) |
| **Database** | Serverless Firebase Firestore (Real-time NoSQL cloud database) |
| **PDF Generation** | `html2pdf.js` (client-side PDF export) |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

---

## 📂 Project Structure

```
All-semester-CGPA-calculator/
├── index.html            — Home page: semester grid, live CGPA display, navigation
├── calculator.html       — Grade input & SGPA/CGPA calculation interface
├── ai-predictor.html     — AI-powered grade trajectory projections
├── target.html           — Target CGPA goal calculator
├── student-detail.html   — Subject-wise grade breakdown for a student
├── history.html          — Calculation history with import/export
├── login.html            — (Legacy) Student authentication screen
├── admin.html            — Admin login portal
├── dashboard.html        — Admin management interface (students, subjects, results, settings)
├── script.js             — Core application logic, GPA algorithms, UI bindings
├── firebase-config.js    — Firebase client configuration & Firestore query helpers
├── style.css             — Global layout, dark-theme, glassmorphic CSS
└── generatePDF_new.js    — PDF generation helper module
```

---

## 🗄️ Firestore Database Schema

The platform uses four main Firestore collections:

### 1. `Students` Collection
Stores student profiles and all semester results.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Student name (defaults to roll number if not provided) |
| `id` | string | Roll number (same as Document ID) |
| `year` | string | Academic year (`"1"` – `"4"`) |
| `section` | string | Classroom section (`"A"` – `"E"`) |
| `currentCGPA` | string | Latest computed cumulative GPA |
| `lastUpdated` | string | ISO timestamp of last update |
| `results` | map | Nested semester results: `sem_1`, `sem_2`, … `sem_8` |

Each `sem_{n}` map contains:

| Sub-field | Type | Description |
|-----------|------|-------------|
| `sgpa` | string | Semester GPA |
| `credits` | number | Total enrolled credits |
| `timestamp` | string | Entry timestamp |
| `subjects` | array | List of `{ code, name, grade, credit, gradePoint }` |

### 2. `admins` Collection
Validates admin credentials.

| Field | Type | Description |
|-------|------|-------------|
| `password` | string | Admin password (Document ID = username) |

### 3. `Subjects` Collection
Master subject registry per semester (Document ID: `sem_1` … `sem_8`).

| Field | Type | Description |
|-------|------|-------------|
| `semester` | number | Semester number (1–8) |
| `lastUpdated` | string | ISO timestamp |
| `subjects` | array | List of `{ code, name, credit }` |

### 4. `Settings` Collection
Controls semester-level save permissions (Document ID: `semester_calculation`).

| Field | Type | Description |
|-------|------|-------------|
| `1` – `8` | boolean | `true` = allow saving results, `false` = block saving |

---

## ⚙️ Setup & Installation

### 1. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Initialize a **Firestore Database** (Test Mode for development; add security rules for production).
3. Register a **Web App** and copy the `firebaseConfig` object.
4. Open `firebase-config.js` and replace the config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Admin Account Creation
1. Open your Firestore console.
2. Create a collection named `admins`.
3. Add a document — set the **Document ID** as the admin username (e.g., `admin`).
4. Add a string field `password` with the desired password value.

### 3. Running Locally
The project uses ES6 Module imports (`type="module"`), so it **must** be served via a web server — not opened directly from the filesystem (`file://`).

**Option A — VS Code Live Server:** Install the Live Server extension and click **Go Live**.

**Option B — Python HTTP Server:**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

---

## 📝 Core Workflows

### Student Calculation Workflow
1. Open the home page (`index.html`) and select the desired semester.
2. On the calculator page, select your letter grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `U`) for each subject.
3. Click **Calculate SGPA**.
4. Enter your **Roll Number**, Year, and Section in the popup modal.
5. Your result is calculated, displayed on screen, and synced to Firebase automatically (if saves are enabled for that semester).
6. Return to the home page — the **Final Score (CGPA)** display is updated to reflect your latest result.
7. *(Optional)* Download a PDF transcript, view history, or use the AI Predictor / Target Calculator.

> **Multi-student support on the same device:** Each calculation saves the latest student's Roll Number. The home page always shows the CGPA of the **most recently calculated student**, making it easy to use the app for different students on the same phone or computer.

### Admin Workflow
1. Navigate to `admin.html` and authenticate.
2. Use the **Manage Subjects** tab to configure the subject catalog per semester.
3. Use the **Manage Students** tab to add students individually or bulk-upload a CSV roster.
4. View and export student results from the **Student Results** tab.

---

## 🤝 Contributing
Feel free to open issues or submit pull requests for features, bug fixes, or subject data updates.

## 📜 License
This project is open-source. Please refer to standard open-source licensing terms for usage and redistribution.
