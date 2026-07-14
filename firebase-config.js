/**
 * Firebase Configuration & Helper Functions
 * 
 * INSTRUCTIONS FOR USER:
 * 1. Go to your Firebase Console (console.firebase.google.com).
 * 2. Create a new project (or use existing).
 * 3. Go to Project Settings > General > Your apps > Add app > Web.
 * 4. Copy the "firebaseConfig" object and paste it below to replace the placeholder.
 * 5. Enable "Firestore Database" in the Firebase Console (in Test Mode for now).
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, arrayUnion, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyAymIyfZavwLcC2CZPjG7vSNNk-PbGpmww",
    authDomain: "cgpa-calculator-9ce70.firebaseapp.com",
    projectId: "cgpa-calculator-9ce70",
    storageBucket: "cgpa-calculator-9ce70.firebasestorage.app",
    messagingSenderId: "466983466930",
    appId: "1:466983466930:web:80faf9753da953464c56ab"
};
// ------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection References
const STUDENTS_COLLECTION = "Students";
const RESULTS_COLLECTION = "results";

/**
 * Login Student: Checks if Roll No exists in 'students' collection.
 * @param {string} name - Student Name (for verification/first time add if allowed, strictly we check rollNo)
 * @param {string} rollNo - Roll Number (Unique ID)
 * @returns {Promise<boolean>} - True if login success
 */
export async function loginStudent(name, rollNo) {
    if (!rollNo || !name) return false;

    const studentRef = doc(db, STUDENTS_COLLECTION, rollNo);
    const snap = await getDoc(studentRef);

    if (snap.exists()) {
        const data = snap.data();

        // Verify BOTH name and roll number match
        if (data.name === name) {
            // Both name and roll number match - allow login
            sessionStorage.setItem('res_user', JSON.stringify({
                name: data.name,
                rollNo: rollNo,
                isLoggedIn: true
            }));
            return true;
        } else {
            // Roll number exists but name doesn't match
            console.warn("Name does not match the registered name for this Roll Number.");
            return false;
        }
    } else {
        // Roll number not found in database
        console.warn("Roll Number not found in database.");
        return false;
    }
}

/**
 * Check if Student Exists
 */
/**
 * Verify Student Identity (Roll No + Name Check)
 * Priority: Check Name First
 */
export async function verifyStudentMatch(rollNo, inputName) {
    if (!rollNo || !inputName) return { isValid: false, error: "Missing details" };

    // 1. Check if Name Exists (Query)
    // Note: Firestore queries are case-sensitive by default.
    // We try to match the exact name entered.
    const q = query(collection(db, STUDENTS_COLLECTION), where("name", "==", inputName));
    const nameSnap = await getDocs(q);

    if (nameSnap.empty) {
        return { isValid: false, error: "Student Name not found in database." };
    }

    // 2. Name Exists -> Check if Roll No matches any of the docs with this name
    let rollNoMatch = false;
    nameSnap.forEach(doc => {
        if (doc.id === rollNo) {
            rollNoMatch = true;
        }
    });

    if (rollNoMatch) {
        return { isValid: true };
    } else {
        return { isValid: false, error: "Roll Number does not match the registered Name." };
    }
}

/**
 * Create Student (For Testing/Seeding)
 */
export async function createStudent(rollNo, name, year, section) {
    if (!rollNo) return false;
    const studentRef = doc(db, STUDENTS_COLLECTION, rollNo);
    try {
        await setDoc(studentRef, {
            name: name || "",
            id: rollNo,
            year: year || "1",
            section: section || "A",
            results: {},
            currentCGPA: "0.00",
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log(`Student (${rollNo}) created/updated.`);
        return true;
    } catch (e) {
        console.error("Error creating student:", e);
        return false;
    }
}

/**
 * Save or Create Student by Roll Number.
 * - If Roll Number exists in Firestore → just proceed (update will happen via saveResultToFirebase)
 * - If Roll Number does NOT exist → create a new document first, then return true
 * @param {string} rollNo - Roll Number (used as document ID)
 * @param {string} year
 * @param {string} section
 * @returns {Promise<{exists: boolean, created: boolean}>}
 */
export async function saveOrCreateStudent(rollNo, year, section) {
    if (!rollNo) return { exists: false, created: false };

    const studentRef = doc(db, STUDENTS_COLLECTION, rollNo);
    const snap = await getDoc(studentRef);

    if (snap.exists()) {
        console.log(`Student ${rollNo} already exists in database.`);
        return { exists: true, created: false };
    } else {
        // Create new student document
        try {
            await setDoc(studentRef, {
                name: "",           // Name not collected at this point
                id: rollNo,
                year: year || "1",
                section: section || "A",
                results: {},
                currentCGPA: "0.00",
                lastUpdated: new Date().toISOString()
            });
            console.log(`New student ${rollNo} created in database.`);
            return { exists: false, created: true };
        } catch (e) {
            console.error("Error creating new student:", e);
            return { exists: false, created: false };
        }
    }
}

/**
 * Login Admin: Checks if username/password matches a document in 'admins' collection.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function loginAdmin(username, password) {
    try {
        const adminRef = doc(db, "admins", username);
        const snap = await getDoc(adminRef);

        if (snap.exists()) {
            const data = snap.data();
            // In a real app, hash passwords! For now, simple string match as requested to replace hardcode.
            if (data.password === password) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Admin login error:", error);
        return false;
    }
}

/**
 * DELETE ALL STUDENTS (Use with caution)
 * Used to clean up bad uploads.
 */
import { deleteDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

export async function deleteAllStudents() {
    try {
        const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
        const total = snapshot.size;
        let count = 0;

        // Helper to facilitate parallel deletion in chunks could be better, but sequential is safer for now
        // or Promise.all in batches.
        const deletePromises = [];

        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });

        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} students.`);
        return deletePromises.length;
    } catch (e) {
        console.error("Error deleting all students:", e);
        throw e;
    }
}

/**
 * BULK UPDATE YEAR
 * Used to promote all students to a specific year.
 */
export async function updateAllStudentYears(newYear) {
    if (!newYear) return 0;
    try {
        const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
        const updatePromises = [];

        snapshot.forEach((doc) => {
            updatePromises.push(updateDoc(doc.ref, {
                year: newYear,
                lastUpdated: new Date().toISOString()
            }));
        });

        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} students to Year ${newYear}.`);
        return updatePromises.length;
    } catch (e) {
        console.error("Error updating student years:", e);
        throw e;
    }
}

/**
 * DELETE STUDENT RANGE (OR SINGLE)
 * Safely delete specific students.
 */
export async function deleteStudentRange(startRoll, endRoll) {
    if (!startRoll) return 0;

    const start = startRoll.trim().toUpperCase();
    // If end is provided, use it. If not, end = start (Single Delete)
    const end = endRoll ? endRoll.trim().toUpperCase() : start;

    try {
        const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
        const deletePromises = [];
        let count = 0;

        snapshot.forEach((doc) => {
            const roll = doc.id;
            if (roll >= start && roll <= end) {
                deletePromises.push(deleteDoc(doc.ref));
                count++;
            }
        });

        await Promise.all(deletePromises);
        console.log(`Deleted ${count} students in range ${start}-${end}.`);
        return count;
    } catch (e) {
        console.error("Error deleting student range:", e);
        throw e;
    }
}

/**
 * BULK UPDATE RANGE
 * Update Year/Section for a specific range of Roll Numbers.
 */
export async function updateStudentRange(startRoll, endRoll, newYear, newSection) {
    if (!startRoll || !endRoll) return 0;

    // Normalize to handle case sensitivity if needed, though usually uppercase
    const start = startRoll.trim().toUpperCase();
    const end = endRoll.trim().toUpperCase();

    try {
        const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
        const updatePromises = [];
        let count = 0;

        snapshot.forEach((doc) => {
            const roll = doc.id; // Using doc ID which is usually roll number
            // String comparison is tricky if formats differ length, but assuming consistent format (e.g. 24CS001)
            // Ideally we should strictly compare.
            if (roll >= start && roll <= end) {
                const updates = { lastUpdated: new Date().toISOString() };
                if (newYear) updates.year = newYear;
                if (newSection) updates.section = newSection;

                updatePromises.push(updateDoc(doc.ref, updates));
                count++;
            }
        });

        await Promise.all(updatePromises);
        console.log(`Updated ${count} students in range ${start}-${end}.`);
        return count;
    } catch (e) {
        console.error("Error updating student range:", e);
        throw e;
    }
}

/**
 * Save Result: Updates the student's result record in Firestore.
 * @param {string} rollNo 
 * @param {number} sem 
 * @param {string} sgpa 
 * @param {string} cgpa 
 * @param {number} totalCredits 
 * @param {string} year
 * @param {string} section
 * @param {Array} subjects - Array of subject objects with code, name, grade, credit
 */
export async function saveResultToFirebase(rollNo, sem, sgpa, cgpa, totalCredits, year, section, subjects = []) {
    if (!rollNo) return;

    // We store results in the 'students' document itself to keep it atomic and easy to query for CGPA.

    const studentRef = doc(db, STUDENTS_COLLECTION, rollNo);

    try {
        // 1. Get current data to calculate/update CGPA if needed (though passed in)
        // We will update the semester result map

        const updatePayload = {
            [`results.sem_${sem}`]: {
                sgpa: sgpa,
                credits: totalCredits,
                timestamp: new Date().toISOString(),
                subjects: subjects // NEW: Store subject details
            },
            currentCGPA: cgpa,
            lastUpdated: new Date().toISOString()
        };

        if (year) updatePayload.year = year;
        if (section) updatePayload.section = section;

        await updateDoc(studentRef, updatePayload);
        console.log("Result saved to Firebase with subject details");
    } catch (error) {
        console.error("Error saving result:", error);
        alert("Failed to save result online. Please check internet connection.");
    }
}

/**
 * Get All Results (For Admin) - OPTIMIZED
 * Only fetches students who have calculation results
 */
export async function getAllStudentResults() {
    try {
        const studentsRef = collection(db, STUDENTS_COLLECTION);

        // Fetch ALL students, regardless of CGPA
        const querySnapshot = await getDocs(studentsRef);
        const students = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            students.push({ id: doc.id, ...data });
        });

        console.log(`Loaded ${students.length} students.`);
        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        // Fallback: if the query fails (e.g., missing index), load all and filter client-side
        try {
            const querySnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
            const students = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Only include students with results
                if (data.results && Object.keys(data.results).length > 0) {
                    students.push({ id: doc.id, ...data });
                }
            });
            console.log(`Loaded ${students.length} students (fallback filter)`);
            return students;
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
            return [];
        }
    }
}

/**
 * Get results for a specific student (For History Sync)
 */
export async function getStudentResults(rollNo) {
    if (!rollNo) return [];
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, rollNo);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert results map to array format expected by history
            const resultsMap = data.results || {};
            const history = [];

            for (const [key, val] of Object.entries(resultsMap)) {
                // key is like "sem_3"
                const semStr = key.split('_')[1];
                const sem = parseInt(semStr);

                history.push({
                    sem: sem,
                    rollNo: rollNo, // Bind to student
                    result: val.sgpa || "0.00",
                    type: "SGPA", // Default to SGPA for history display
                    credits: val.credits || 0,
                    timestamp: val.timestamp ? new Date(val.timestamp).getTime() : 0,
                    date: val.timestamp ? new Date(val.timestamp).toLocaleDateString() : 'Unknown',
                    subjects: val.subjects || [] // NEW: Include subject details
                });
            }
            return history;
        }
        return [];
    } catch (e) {
        console.error("Error syncing history:", e);
        return [];
    }
}

/**
 * Get Student Details (for Edit Mode)
 */
export async function getStudentDetails(rollNo) {
    if (!rollNo) return null;
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, rollNo);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        console.error("Error fetching student details:", e);
        return null;
    }
}

// Auth is disabled - login page removed
export function checkAuth() {
    return {};
}

export function logout() {
    sessionStorage.removeItem('res_user');
    window.location.reload();
}

/**
 * Subject Management Functions (Firebase Sync)
 */

const SUBJECTS_COLLECTION = "Subjects";

/**
 * Save subjects for a specific semester to Firebase
 * @param {number} sem - Semester number (1-8)
 * @param {Array} subjects - Array of subject objects
 */
export async function saveSubjectsToFirebase(sem, subjects) {
    try {
        const subjectDocRef = doc(db, SUBJECTS_COLLECTION, `sem_${sem}`);
        await setDoc(subjectDocRef, {
            semester: sem,
            subjects: subjects,
            lastUpdated: new Date().toISOString()
        });

        // Also save to localStorage as cache
        localStorage.setItem(`subjects_sem_${sem}`, JSON.stringify(subjects));

        console.log(`Subjects for semester ${sem} saved to Firebase`);
        return true;
    } catch (error) {
        console.error("Error saving subjects to Firebase:", error);
        // Fallback to localStorage only
        localStorage.setItem(`subjects_sem_${sem}`, JSON.stringify(subjects));
        return false;
    }
}

/**
 * Get subjects for a specific semester from Firebase
 * @param {number} sem - Semester number (1-8)
 * @returns {Promise<Array>} - Array of subjects
 */
export async function getSubjectsFromFirebase(sem) {
    try {
        const subjectDocRef = doc(db, SUBJECTS_COLLECTION, `sem_${sem}`);
        const docSnap = await getDoc(subjectDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const subjects = data.subjects || [];

            // Update localStorage cache
            localStorage.setItem(`subjects_sem_${sem}`, JSON.stringify(subjects));

            return subjects;
        }

        // If no Firebase data, try localStorage
        const localData = localStorage.getItem(`subjects_sem_${sem}`);
        if (localData) {
            return JSON.parse(localData);
        }

        return [];
    } catch (error) {
        console.error("Error fetching subjects from Firebase:", error);
        // Fallback to localStorage
        const localData = localStorage.getItem(`subjects_sem_${sem}`);
        return localData ? JSON.parse(localData) : [];
    }
}

/**
 * Semester Settings Management
 */

const SETTINGS_COLLECTION = "Settings";
const SEMESTER_SETTINGS_DOC = "semester_calculation";

/**
 * Save semester settings (ON/OFF)
 * @param {Object} settings - Object with sem numbers as keys and boolean as values
 */
export async function saveSemesterSettings(settings) {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SEMESTER_SETTINGS_DOC);
        await setDoc(settingsRef, settings, { merge: true });
        console.log("Semester settings saved to Firebase");
        return true;
    } catch (error) {
        console.error("Error saving semester settings:", error);
        return false;
    }
}

/**
 * Get semester settings (ON/OFF)
 * @returns {Promise<Object>} - Object with semester settings
 */
export async function getSemesterSettings() {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SEMESTER_SETTINGS_DOC);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
            return snap.data();
        }
        // Default: All ON if not set
        const defaults = {};
        for (let i = 1; i <= 8; i++) defaults[i] = true;
        return defaults;
    } catch (error) {
        console.error("Error fetching semester settings:", error);
        const defaults = {};
        for (let i = 1; i <= 8; i++) defaults[i] = true;
        return defaults;
    }
}

