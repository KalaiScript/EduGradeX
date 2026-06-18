# EduGradeX — All Semester CGPA Calculator

EduGradeX is a comprehensive, web-based GPA, CGPA calculation, and strategy projection system designed to help students manage and monitor their academic performance. Featuring a sleek glassmorphic dark-mode interface and a robust administrative portal, the platform enables real-time synchronisation, customizable study projections, and detailed administrative reports.

---

## 🚀 Key Features

### For Students
*   **Accurate GPA/CGPA Calculations:** Effortlessly compute Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) dynamically.
*   **AI SGPA & CGPA Predictor:** Select target graduation outcomes and behavioral profiles (Auto-Trend Analytics, Steady Consistency, Ambitious Acceleration) to receive intelligent grade trajectory plans and actionable study insights.
*   **Target CGPA Calculator:** Determine the exact GPA needed in remaining semesters to achieve desired target scores based on completed and remaining credits.
*   **Student Details View:** View subject-wise breakdowns of grades, subject codes, and credit values in a clean table format.
*   **Auto-Sync & History Tracking:** Store calculation history in both local storage and the Firebase database using secure Roll Number and Name authentication.
*   **Professional PDF Reports:** Export beautifully formatted academic transcripts of calculated semesters with a single click.

### For Administrators
*   **Secure Admin Portal:** Control access via a document-based administrator validation mechanism.
*   **Live Student Monitoring:** Access real-time results logs filterable by Year (1st–4th), Section (A–E), and Semester (1st–8th).
*   **Subject Registry Management:** Dynamically add, edit, reorder, or delete registry subjects, credit values, and subject codes for individual semesters.
*   **Student Data Management:**
    *   Add single students with live status checking.
    *   Perform bulk student roster uploads via CSV formats.
    *   Perform range-based promotions, updates, or deletions.
*   **System Controls:** Toggle database writing capabilities ON/OFF for individual semesters to enforce data integrity during critical evaluation windows.
*   **Advanced Data Exporting:** Export aggregated records or individual subject grade logs directly to formatted CSV and A4 landscape PDF reports.

---

## 🛠️ Technology Stack

*   **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom properties, Media Queries, Glassmorphic effects), Vanilla JavaScript (ES6 Modules).
*   **Database & Backend:** Serverless Firebase Firestore (Real-time NoSQL cloud database).
*   **Libraries:** `html2pdf.js` (for client-side PDF document generation).
*   **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts.

---

## 📂 Project Structure

*   [index.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/index.html) — Landing page for students featuring semester grids, auth checks, history links, target calculator links, and overall CGPA logs.
*   [calculator.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/calculator.html) — Main calculation interface where grades are selected for dynamically loaded subjects.
*   [ai-predictor.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/ai-predictor.html) — Proactive GPA projections page utilizing behavioral profile algorithms.
*   [target.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/target.html) — Goal-oriented target CGPA requirements calculator.
*   [student-detail.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/student-detail.html) — Displays subject-wise grades, codes, and credit values for a specific student's selected semester.
*   [login.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/login.html) — Student authentication screen verifying Roll Number and Name inputs.
*   [history.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/history.html) — Local and online calculation history portal with import/export capabilities.
*   [admin.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/admin.html) — Administrator authentication interface.
*   [dashboard.html](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/dashboard.html) — Consolidated administration manager interface handling student rosters, subjects, results, settings, and exports.
*   [script.js](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/script.js) — Primary client-side application logic, UI bindings, and GPA algorithms.
*   [firebase-config.js](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/firebase-config.js) — Centralized Firebase client and query helper configuration.
*   [style.css](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/style.css) — Global layout, glassmorphic dark-theme classes, and responsive layout configurations.

---

## 🗄️ Firestore Database Schema

The platform relies on four major collections in Firestore:

### 1. `Students` Collection
Stores student profiles, enrolled credentials, and semester results maps.
*   **Document ID:** Roll Number (e.g., `24CS001`)
*   **Fields:**
    *   `name` *(string)*: Registered student name.
    *   `id` *(string)*: Registered roll number.
    *   `year` *(string)*: Academic year (e.g., `"1"`, `"2"`).
    *   `section` *(string)*: Classroom section (e.g., `"A"`, `"B"`).
    *   `currentCGPA` *(string)*: Current calculated cumulative GPA.
    *   `lastUpdated` *(string)*: ISO timestamp.
    *   `results` *(map)*: Nested map of semester calculations:
        *   `sem_{num}` *(map)* (e.g., `sem_3`):
            *   `sgpa` *(string)*: SGPA value.
            *   `credits` *(number)*: Enrolled credits.
            *   `timestamp` *(string)*: Entry creation timestamp.
            *   `subjects` *(array)*: Grade list:
                *   `code` *(string)*: Subject code (e.g., `21CSF27`).
                *   `name` *(string)*: Subject description.
                *   `grade` *(string)*: Earned letter grade (e.g., `O`, `A+`, `A`).
                *   `credit` *(number)*: Subject credit count.

### 2. `admins` Collection
Validates administrative credentials.
*   **Document ID:** Username (e.g., `admin`)
*   **Fields:**
    *   `password` *(string)*: Admin password (stored as plain text for simplicity; recommended to hash in production).

### 3. `Subjects` Collection
Maintains the master database of subjects offered per semester.
*   **Document ID:** Semester key (e.g., `sem_3`)
*   **Fields:**
    *   `semester` *(number)*: Semester ID (1–8).
    *   `lastUpdated` *(string)*: ISO timestamp.
    *   `subjects` *(array)*: Registry list:
        *   `code` *(string)*: Subject code.
        *   `name` *(string)*: Subject title.
        *   `credit` *(number)*: Designated credit value.

### 4. `Settings` Collection
Controls semester-specific functionality.
*   **Document ID:** `semester_calculation`
*   **Fields:**
    *   `1` to `8` *(boolean)*: Toggle `true` (Enable saving calculated data to database) or `false` (Disable saving).

---

## ⚙️ Setup and Installation

### 1. Firebase Configuration
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Initialize a **Firestore Database** in Test Mode (configure security rules appropriately for production).
3. Register a new **Web App** in your project settings.
4. Copy the web app's `firebaseConfig` object.
5. Open [firebase-config.js](file:///home/kalaiyarasan/Projects/All-semester-CGPA-calculator/firebase-config.js) and update the config declaration:
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

### 2. Administrator Creation
Because authentication relies on database lookups:
1. Access your Firestore Database in the console.
2. Create a new collection named `admins`.
3. Add a document. Set the **Document ID** as the desired username (e.g., `admin`).
4. Add a string field named `password` containing the password value (e.g., `secure_password`).

### 3. Running the Server Locally
Due to Javascript ES6 Module imports (`type="module"`), the project requires a web server to resolve dependencies correctly. Serving directly from the file system (`file://`) will result in CORS failures.

You can serve the directory using **VS Code Live Server** or Python:
```bash
# Start a simple Python 3 web server on port 8000
python -m http.server 8000
```
Navigate to `http://localhost:8000` in your web browser.

---

## 📝 Core Workflows

### Student Calculation Workflow
1. Navigate to the landing page and log in using your registered **Roll Number** and **Name**.
2. Select the semester you wish to calculate from the primary semester grid.
3. Select your letter grades (e.g., `O`, `A+`, `A`) from the drop-down selectors for your subjects.
4. Click **Calculate SGPA**. Your results will calculate, render on screen, and synchronize automatically to the Firestore database (if database saves are enabled for that semester).
5. (Optional) Download a generated transcript PDF or navigate to the AI Predictor or Target Calculator to plan future semesters.

### Admin Registry & Roster Setup Workflow
1. Navigate to `admin.html` and authenticate with your admin credentials.
2. Select the **Manage Subjects** tab to populate the subject catalog for active semesters.
3. Select the **Manage Students** tab to register students individually or upload a student roster via a CSV file containing `rollNo, name, year, section`.
4. Monitor student SGPAs and CGPAs under the **Student Results** tab, filtering data and downloading detailed CSV/PDF reports.

---

## 🤝 Contributing
Feel free to open issues or submit pull requests for additional features or bug fixes.

## 📜 License
This project is open-source. Please refer to standard licensing rules for usage and redistribution.
