# EduGradeX - All Semester CGPA Calculator

EduGradeX is a comprehensive, web-based GPA and CGPA calculation tool designed to help students track their academic performance. It features a modern, responsive interface and a robust administrative dashboard for faculty to manage subject registries and monitor student results in real-time.

## 🚀 Key Features

### For Students
*   **Accurate Calculations:** Calculate Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) effortlessly.
*   **Dynamic Subject Loading:** Subjects and credit values are automatically fetched from the cloud database based on the selected semester.
*   **Professional PDF Reports:** Generate and download detailed, formatted academic reports with a single click.
*   **Calculation History:** Automatically saves calculation history to the cloud and local browser for easy tracking across sessions.
*   **Cross-Device Sync:** Log in with your Roll Number and Name to view your past results from any device.

### For Administrators
*   **Secure Dashboard:** Dedicated admin portal for managing the system.
*   **Live Data Monitoring:** View student calculations in real-time, filterable by Year, Section, and Semester.
*   **Subject Registry Management:** Add, edit, reorder, or delete subjects for each semester dynamically.
*   **Student Data Management:**
    *   Add single students or perform bulk uploads via CSV.
    *   Perform bulk updates (e.g., promote all students to the next year).
    *   Manage specific ranges of roll numbers securely.
*   **System Settings:** Toggle database saving **ON/OFF** for individual semesters to control data flow during specific periods.
*   **Advanced Exporting:** Export aggregated student data to CSV or PDF for departmental analysis.

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3 (Glassmorphism design), Vanilla JavaScript (ES6 Modules).
*   **Backend / Database:** Firebase Firestore (Serverless, Real-time NoSQL database).
*   **Libraries:** `html2pdf.js` (for client-side PDF generation).
*   **Architecture:** The application relies on a thick-client architecture where the frontend handles logic and calculations, directly interacting with Firebase for persistence.

## 📂 Project Structure

*   **`index.html`:** The landing page where students select their semester.
*   **`calculator.html`:** The main calculation interface where grades are entered.
*   **`dashboard.html`:** The comprehensive Admin portal.
*   **`admin.html`:** The admin login screen.
*   **`login.html`:** The student login screen for history syncing.
*   **`history.html`:** Displays a student's past calculation results.
*   **`script.js`:** Contains the core application logic, UI interactions, and calculation algorithms.
*   **`firebase-config.js`:** Centralized file managing Firebase initialization and all database queries (CRUD operations).
*   **`style.css`:** Application styling, themes, and responsiveness website..

## ⚙️ Setup and Installation

To run this project locally or deploy it, you must configure a Firebase project.

### 1. Firebase Setup
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  Add a **Web App** to your project.
4.  Copy the `firebaseConfig` object provided during setup.
5.  Open `firebase-config.js` and replace the placeholder config with your own:
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
6.  In the Firebase Console, navigate to **Firestore Database** and click **Create database**. Start in **Test Mode** (or configure security rules appropriately for production).

### 2. Admin Account Creation
Currently, the system uses a direct document lookup for admin authentication. You must create the initial admin account manually in Firestore:
1.  In Firestore, create a collection named `admins`.
2.  Create a document within `admins`. The **Document ID** should be the admin's username (e.g., `admin`).
3.  Add a string field to the document: `password: "your_secure_password"`.

### 3. Running the Application
Because the project uses JavaScript ES6 Modules (`type="module"`), it **must be served via a local web server**. Simply opening the HTML files in a browser via the file system (`file://`) will result in CORS errors.

You can use extensions like **Live Server** in VS Code, or Python's built-in server:
```bash
# Using Python 3
python -m http.server 8000
```
Navigate to `http://localhost:8000` in your browser.

## 📝 Usage Workflow

1.  **Initial Setup:** As an admin, log in via `admin.html`. Navigate to the **Subject Manager** tab in the dashboard and populate the subjects for each semester.
2.  **Student Management:** Upload your student roster via the **Manage Students** tab (CSV format: `rollNo, name, year, section`).
3.  **Calculation:** Students visit the main page, select their semester, input their grades, and calculate. If they enter their details in the resulting modal, their score is saved to the database.
4.  **Monitoring:** Admins can view all saved results in real-time under the **Student Results** tab.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📜 License
This project is open-source and available under standard open-source licenses. Please refer to the specific license file if included.
