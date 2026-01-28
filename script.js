import { saveResultToFirebase, getStudentResults, verifyStudentMatch, createStudent, saveSubjectsToFirebase, getSubjectsFromFirebase } from './firebase-config.js';

// ... (existing code) ...

// Sync History from Firebase
async function syncFirebaseHistory() {
    const userSession = sessionStorage.getItem('res_user');
    if (!userSession) return;

    const user = JSON.parse(userSession);
    const onlineHistory = await getStudentResults(user.rollNo);

    if (onlineHistory && onlineHistory.length > 0) {
        let localHistory = JSON.parse(localStorage.getItem('gpa_history') || '[]');
        const clearedAt = parseInt(localStorage.getItem('history_cleared_at') || '0');

        onlineHistory.forEach(remoteItem => {
            // Respect local clear: Don't sync items older than the clear action
            if (remoteItem.timestamp && remoteItem.timestamp <= clearedAt) {
                return;
            }

            const exists = localHistory.find(local => local.sem == remoteItem.sem);
            if (!exists) {
                localHistory.push(remoteItem);
            } else {
                // Update if remote is newer? Or just strictly trust remote?
                // Let's update existing to ensure consistency
                Object.assign(exists, remoteItem);
            }
        });

        // Sort by sem descending or timestamp
        localHistory.sort((a, b) => b.sem - a.sem);

        localStorage.setItem('gpa_history', JSON.stringify(localHistory));

        // Refresh display if on history page
        if (document.getElementById('history-list')) {
            renderHistory();
        }
        // Refresh home stats
        if (document.getElementById('total-cgpa-display')) {
            updateHomePageStats();
        }
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on calculator.html
    const params = new URLSearchParams(window.location.search);
    const semParam = params.get('sem');

    if (semParam && document.getElementById('subject-list')) {
        currentSem = parseInt(semParam);
        loadSubjects(currentSem);
        document.getElementById('semester-badge').textContent = `Semester ${currentSem}`;
    }

    // Trigger Sync
    syncFirebaseHistory();

    // Update Home Page Stats
    if (document.getElementById('total-cgpa-display')) {
        updateHomePageStats();
    }

    const toggle = document.getElementById('prev-stats-toggle');
    if (toggle) toggle.checked = false;
});
/**
 * CGPA Calculator - Core Logic
 */

// Data: Subjects for each semester
const subjectData = {
    1: [
        { name: "ENGINEERING PHYSICS", credit: 3, code: "23BSS01" },
        { name: "PHYSICS LABORATORY", credit: 2, code: "23BSS02" },
        { name: "ALGEBRA AND CALCULUS", credit: 4, code: "23BSS21" },
        { name: "PROGRAMMING FOR PROBLEM SOLVING USING C", credit: 3, code: "23GES01" },
        { name: "PROGRAMMING IN C LABORATORY", credit: 1, code: "23GES02" },
        { name: "ELECTRICAL AND ELECTRONICS SCIENCES", credit: 3, code: "23GES06" },
        { name: "TECHNICAL AND COMMUNICATIVE ENGLISH I", credit: 3, code: "23HSS01" },
        { name: "HERITAGE OF TAMILS", credit: 1, code: "23HSS08" }
    ],
    2: [
        { name: "ENGINEERING CHEMISTRY", credit: 3, code: "23BSS11" },
        { name: "CHEMISTRY LABORATORY", credit: 2, code: "23BSS12" },
        { name: "ADVANCED CALCULUS AND COMPLEX ANALYSIS", credit: 4, code: "23BSS22" },
        { name: "PYTHON PROGRAMMING", credit: 3, code: "23GES03" },
        { name: "COMPUTER  PERIPHERALS AND PROGRAMMING ESSENTIALS", credit: 3, code: "23GES04" },
        { name: "PYTHON PROGRAMMING LABORATORY", credit: 1, code: "23GES05" },
        { name: "TECHNICAL AND COMMUNICATIVE ENGLISH II", credit: 3, code: "23HSS02" },
        { name: "TAMILS AND TECHNOLOGY", credit: 1, code: "23HSS09" },
    ],
    3: [
        { name: "DISCRETE MATHEMATICS", credit: 4, code: "23BSS25", type: "Basic Sciences" },
        { name: "DATA STRUCTURES AND ALGORITHMS", credit: 3, code: "23CSF01", type: "Professional Core" },
        { name: "OBJECT ORIENTED PROGRAMMING WITH JAVA", credit: 3, code: "23CSF02", type: "Professional Core" },
        { name: "DATA STRUCTURES USING JAVA LABORATORY", credit: 1, code: "23CSF03", type: "Professional Core" },
        { name: "DATABASE MANAGEMENT SYSTEMS", credit: 3, code: "23CSF04", type: "Professional Core" },
        { name: "DATABASE MANAGEMENT SYSTEMS LABORATORY", credit: 1, code: "23CSF05", type: "Professional Core" },
        { name: "SOFTWARE ENGINEERING", credit: 3, code: "23CSF06", type: "Professional Core" },
        { name: "OPERATING SYSTEMS", credit: 3, code: "23CSF12", type: "Professional Core" },
        { name: "OPERATING SYSTEMS LABORATORY", credit: 1, code: "23CSF13", type: "Professional Core" }
    ],
    4: [
        { name: "PROBABILITY AND STATISTICS", credit: 4, code: "23BSS32", type: "Basic Sciences" },
        { name: "COMPUTER NETWORKS", credit: 3, code: "23CSF07", type: "Professional Core" },
        { name: "DESIGN AND ANALYSIS OF ALGORITHMS", credit: 3, code: "23CSF10", type: "Professional Core" },
        { name: "COMPUTER ORGANIZATION AND ARCHITECTURE", credit: 3, code: "23CSF11", type: "Professional Core" },
        { name: "COMPUTER NETWORKS LABORATORY", credit: 1, code: "23CSF24", type: "Professional Core" },
        { name: "CAREER DEVELOPMENT SKILL - I", credit: 1, code: "23BSS30", type: "Basic Sciences" },
        { name: "WEB DEVELOPMENT", credit: 3, code: "23CSF40", type: "Professional Core" },
        { name: "WEB DEVELOPMENT LABORATORY", credit: 1, code: "23CSF41", type: "Professional Core" },
        { name: "FOUNDATIONS OF DATA SCIENCE", credit: 3, code: "23CSE67", type: "Professional Elective" },
        { name: "DATA SCIENCE LABORATORY", credit: 1, code: "23CSE68", type: "Professional Elective" },
    ],
    5: [
        { name: "CAREER DEVELOPMENT SKILL - II", credit: 1, code: "23BSS31", type: "Basic Sciences" },
        { name: "INTERNET OF THINGS", credit: 3, code: "23CSE01", type: "Professional Core" },
        { name: "INTERNET OF THINGS LABORATORY", credit: 1, code: "23CSE02", type: "Professional Core" },
        { name: "SALESFORCE CRM AND PLATFORM", credit: 3, code: "23CSE06", type: "Professional Core" },
        { name: "SALESFORCE CRM AND PLATFORM LABORATORY", credit: 1, code: "23CSE07", type: "Professional Core" },
        { name: "COMPUTER NETWORKS", credit: 3, code: "23CSF07", type: "Professional Core" },
        { name: "DATA WAREHOUSING AND DATA MINING", credit: 3, code: "23CSF18", type: "Professional Core" },
        { name: "COMPUTER NETWORKS LABORATORY", credit: 1, code: "23CSF24", type: "Professional Core" },
        { name: "FOUNDATIONS OF QUANTUM COMPUTING", credit: 3, code: "23CSF39", type: "Professional Core" },


    ],
    6: [
        { name: "RENEWABLE ENERGY SOURCES", credit: 3, code: "23GES29", type: "Professional Core" },
        { name: "COMPILER DESIGN", credit: 3, code: "23CSF19", type: "Professional Core" },
        { name: "COMPILER DESIGN LABORATORY", credit: 1, code: "23CSF20", type: "Professional Core" },
        { name: "VIRTUAL REALITY AND AUGMENTED REALITY", credit: 3, code: "23CSF19", type: "Professional Core" },
        { name: "VIRTUAL REALITY AND AUGMENTED REALITY LABORATORY", credit: 1, code: "23CSF20", type: "Professional Core" },
        { name: "OBJECT ORIENTED ANALYSIS AND DESIGN", credit: 3, code: "23CSF21", type: "Professional Core" },
        { name: "CLOUD COMPUTING", credit: 3, code: "23CSF22", type: "Professional Core" },
        { name: "PROFESSIONAL ELECTIVE - II", credit: 3, code: "...", type: "Professional Elective" },
        { name: "MINI PROJECT (Case Tools)", credit: 1, code: "23CSP03", type: "Employability Enhancement Courses" },

    ],
    7: [{ name: "Cloud Computing", credit: 3, code: "23CSE09" }],
    8: [
        { name: "Project Work Phase - II", credit: 12, code: "23CSP05", type: "Employability Enhancement Courses" }
    ]
};

// Grade Points Mapping
const gradePoints = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0 };

// Global State
let currentSem = 1;
let studentDetails = { name: '', rollNo: '' };

// Navigation
function selectSemester(sem) {
    window.location.href = `calculator.html?sem=${sem}`;
}

// Expose functions globally for dashboard.html
window.getSubjects = getSubjects;
window.saveSemesterSubjects = saveSemesterSubjects;

// Helper: Get Subjects (LS Override > Default + Custom Legacy)
// Helper: Get Subjects (Firebase-first, localStorage fallback)
async function getSubjects(sem) {
    // 0. Static Override for Semester 8 (Lock to 12-credit Project)
    if (sem == 8) {
        return subjectData[8];
    }

    // 1. Try Firebase first
    try {
        const firebaseSubjects = await getSubjectsFromFirebase(sem);
        if (firebaseSubjects && firebaseSubjects.length > 0) {
            return firebaseSubjects;
        }
    } catch (e) {
        console.log('Firebase fetch failed, using localStorage');
    }

    // 2. Fallback to localStorage
    const override = localStorage.getItem(`subjects_sem_${sem}`);
    if (override) {
        return JSON.parse(override);
    }

    // 3. Use Default Data
    let subjects = subjectData[sem] ? [...subjectData[sem]] : [];

    // 4. Merge with 'custom_subjects' (Legacy support)
    const custom = JSON.parse(localStorage.getItem('custom_subjects') || '[]');
    const customForSem = custom.filter(s => s.sem == sem);

    return [...subjects, ...customForSem];
}

// Helper: Save Semester Data (Firebase + localStorage)
async function saveSemesterSubjects(sem, subjects) {
    // Save to Firebase (cloud sync)
    await saveSubjectsToFirebase(sem, subjects);
    // Also save to localStorage as cache  
    localStorage.setItem(`subjects_sem_${sem}`, JSON.stringify(subjects));
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => { // Made async
    // Check if we are on calculator.html
    const params = new URLSearchParams(window.location.search);
    const semParam = params.get('sem');

    if (semParam && document.getElementById('subject-list')) {
        currentSem = parseInt(semParam);
        await loadSubjects(currentSem); // Now async
        document.getElementById('semester-badge').textContent = `Semester ${currentSem}`;
    }

    // Update Home Page Stats
    if (document.getElementById('total-cgpa-display')) {
        updateHomePageStats();
    }

    const toggle = document.getElementById('prev-stats-toggle');
    if (toggle) toggle.checked = false;
});

// Load Subjects (Async for Firebase fetch)
async function loadSubjects(sem) {
    const listContainer = document.getElementById('subject-list');
    const subjects = await getSubjects(sem); // Await Firebase fetch

    listContainer.innerHTML = '';

    if (subjects.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);">No subjects found for this semester.</p>';
        return;
    }

    subjects.forEach((subj) => {
        const card = document.createElement('div');
        card.className = 'card subject-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '10px';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 class="subject-name" style="margin: 0; font-size: 1rem;">${subj.name}</h4>
                    <span class="subject-credits" style="font-size: 0.75rem; color: var(--text-muted);">${subj.credit} Credits • ${subj.type || 'Core'}</span>
                </div>
                <span class="subject-code" style="background-color: rgba(47, 128, 237, 0.1); color: var(--primary-color); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${subj.code || 'CODE'}</span>
            </div>
            
            <select class="grade-select" data-credit="${subj.credit}" data-code="${subj.code || 'N/A'}" data-name="${subj.name}" onchange="this.style.borderColor='var(--glass-border)'">
                <option value="0" disabled selected>Select Grade</option>
                <option value="10">O </option>
                <option value="9">A+ </option>
                <option value="8">A </option>
                <option value="7">B+ </option>
                <option value="6">B </option>
                <option value="5">C </option>
                <option value="0">U </option>
            </select>
        `;
        listContainer.appendChild(card);
    });
}

// Toggle Previous Stats
function togglePrevStats() {
    const isChecked = document.getElementById('prev-stats-toggle').checked;
    document.getElementById('prev-stats-inputs').style.display = isChecked ? 'block' : 'none';

    if (isChecked) {
        // Pre-fill from history - show only the LATEST calculation
        const history = JSON.parse(localStorage.getItem('gpa_history') || '[]');
        const currentNum = Number(currentSem);

        const otherSemesters = history.filter(item => Number(item.sem) !== currentNum);

        const creditsInput = document.getElementById('prev-credits');
        const cgpaInput = document.getElementById('prev-cgpa');
        const info = document.getElementById('prev-stats-info');

        if (otherSemesters.length > 0) {
            otherSemesters.sort((a, b) => b.timestamp - a.timestamp);
            const latestCalc = otherSemesters[0];
            const semSubjects = getSubjects(latestCalc.sem);
            const semCredits = semSubjects.reduce((sum, subj) => sum + subj.credit, 0);

            creditsInput.value = semCredits;
            cgpaInput.value = parseFloat(latestCalc.result).toFixed(2);

            if (info) {
                info.textContent = `Latest calculation from Semester ${latestCalc.sem}`;
                info.style.color = "var(--accent-green)";
            }
        } else {
            creditsInput.value = "";
            cgpaInput.value = "";
            if (info) {
                info.textContent = "No previous semester data found.";
                info.style.color = "var(--text-muted)";
            }
        }
    }
}

// 1. Initiate Calculation (Validate & Open Modal)
function initiateCalculation() {
    const creditInputs = document.querySelectorAll('.grade-select');
    let allFilled = true;
    let firstMissing = null;

    // Validate inputs first
    creditInputs.forEach(input => {
        input.style.borderColor = "var(--glass-border)";
        if (input.value === "0" && input.options[input.selectedIndex].text === "Select Grade") {
            allFilled = false;
            input.style.borderColor = "#ff5252";
            if (!firstMissing) firstMissing = input;
        }
    });

    if (!allFilled) {
        if (firstMissing) {
            firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstMissing.focus();
        }
        return;
    }

    // Open Modal for Student Details
    openModal(true); // true = calculation mode
}

// 2. Perform Calculation (Called after Modal Submit)
function performCalculation() {
    const creditInputs = document.querySelectorAll('.grade-select');
    let totalCredits = 0;
    let totalPoints = 0;
    const subjectsArray = []; // NEW: Collect subject details

    creditInputs.forEach(input => {
        const credit = parseFloat(input.getAttribute('data-credit'));
        const point = parseFloat(input.value);
        const subjectCode = input.getAttribute('data-code') || 'N/A';
        const subjectName = input.getAttribute('data-name') || 'Unknown Subject';
        const gradeText = input.options[input.selectedIndex].text; // e.g., "O", "A+"

        totalCredits += credit;
        totalPoints += (point * credit);

        // Store subject details
        subjectsArray.push({
            code: subjectCode,
            name: subjectName,
            grade: gradeText,
            credit: credit,
            gradePoint: point
        });
    });

    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    document.getElementById('result-sgpa').textContent = sgpa;
    document.getElementById('total-credits-display').textContent = totalCredits;

    // CGPA Calculation
    const usePrev = document.getElementById('prev-stats-toggle') ? document.getElementById('prev-stats-toggle').checked : false;
    let finalResult = sgpa;
    let type = "SGPA";

    if (usePrev) {
        const prevCredits = parseFloat(document.getElementById('prev-credits').value) || 0;
        const prevCGPA = parseFloat(document.getElementById('prev-cgpa').value) || 0;
        const prevPoints = prevCredits * prevCGPA;
        const finalCredits = totalCredits + prevCredits;
        const finalPoints = totalPoints + prevPoints;
        const cgpa = finalCredits > 0 ? (finalPoints / finalCredits).toFixed(2) : "0.00";
        if (document.getElementById('result-cgpa')) document.getElementById('result-cgpa').textContent = cgpa;
        finalResult = cgpa;
        type = "CGPA";
    }

    const savedCredits = (type === "CGPA") ? (totalCredits + (parseFloat(document.getElementById('prev-credits').value) || 0)) : totalCredits;
    saveToHistory(currentSem, finalResult, type, savedCredits, studentDetails.rollNo, studentDetails.name, studentDetails.year, studentDetails.section);

    // Save to Firebase (Online Sync)
    // Save to Firebase (Online Sync)
    const userSession = sessionStorage.getItem('res_user');

    // Determine target rollNo: Priority to Input (from modal) > Logged In User
    // However, studentDetails might be empty if modal wasn't used/needed?
    // Wait, calculation flow forces modal via submitDetailsAndCalculate if performCalculation is called?
    // Actually performCalculation is called by submitDetailsAndCalculate, so studentDetails SHOULD be set.

    let targetRollNo = "";
    if (studentDetails && studentDetails.rollNo) {
        targetRollNo = studentDetails.rollNo;
    } else if (userSession) {
        targetRollNo = JSON.parse(userSession).rollNo;
    }

    if (targetRollNo) {
        // We calculate CGPA differently in the helper, but passing what we have is good
        let sgpaToSend = sgpa;
        let cgpaToSend = (type === "CGPA") ? finalResult : sgpa; // Rough approx for now

        console.log(`Saving result for RollNo: ${targetRollNo}, Sem: ${currentSem}`);
        saveResultToFirebase(
            targetRollNo,
            currentSem,
            sgpaToSend,
            cgpaToSend,
            savedCredits,
            studentDetails.year,
            studentDetails.section,
            subjectsArray // NEW: Pass subjects array
        );
    }

    // Scroll to result
    document.querySelector('.card:has(#result-sgpa)').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Modal Logic
function openModal(isCalculation = false) {
    const modal = document.getElementById('student-modal');
    const title = modal.querySelector('.modal-header h2');
    const submitBtn = modal.querySelector('.btn-download');

    // Pre-fill if exists
    if (studentDetails.name) document.getElementById('pdf-student-name').value = studentDetails.name;
    if (studentDetails.rollNo) document.getElementById('pdf-roll-no').value = studentDetails.rollNo;

    if (isCalculation) {
        title.textContent = "Enter Details to Calculate";
        submitBtn.textContent = "Calculate Result";
        submitBtn.onclick = submitDetailsAndCalculate;
    } else {
        // Should rarely be reached if flow works correctly, but safe fallback
        title.textContent = "Enter Details";
        submitBtn.textContent = "Download PDF";
        submitBtn.onclick = submitDetailsAndDownload;
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('student-modal').style.display = 'none';
}

// 3. Submit Details & Calculate
async function submitDetailsAndCalculate() {
    if (!validateStudentDetails()) return;

    // Verify Roll No AND Name
    const verification = await verifyStudentMatch(studentDetails.rollNo, studentDetails.name);

    if (!verification.isValid) {
        alert(`Validation Failed: ${verification.error}`);
        return;
    }

    closeModal();
    performCalculation();
}

// 4. Download Report (Uses stored details)
function downloadReportDirectly() {
    const sgpa = document.getElementById('result-sgpa').textContent;
    if (sgpa === "0.00") {
        alert("Please calculate your GPA first.");
        return;
    }

    if (!studentDetails.name || !studentDetails.rollNo) {
        // Fallback: If for some reason details aren't there, ask again
        openModal(false);
        return;
    }

    generatePDF(studentDetails.name, studentDetails.rollNo);
}

// Submit & Download (Fallback for manual trigger)
// Submit & Download (Fallback for manual trigger)
async function submitDetailsAndDownload() {
    if (!validateStudentDetails()) return;

    // Verify Roll No AND Name
    const verification = await verifyStudentMatch(studentDetails.rollNo, studentDetails.name);

    if (!verification.isValid) {
        alert(`Validation Failed: ${verification.error}`);
        return;
    }

    closeModal();
    generatePDF(studentDetails.name, studentDetails.rollNo);
}

function validateStudentDetails() {
    const nameInput = document.getElementById('pdf-student-name');
    const rollInput = document.getElementById('pdf-roll-no');
    const name = nameInput.value.trim();
    const roll = rollInput.value.trim();

    if (!name) {
        alert("Please enter Student Name.");
        nameInput.focus();
        nameInput.style.borderColor = "#ff5252";
        return false;
    }
    if (!roll) {
        alert("Please enter Roll Number.");
        rollInput.focus();
        rollInput.style.borderColor = "#ff5252";
        return false;
    }

    // Store details
    studentDetails.name = name;
    studentDetails.rollNo = roll;
    const yearInput = document.getElementById('pdf-student-year');
    const sectionInput = document.getElementById('pdf-student-section');
    const year = yearInput.value;
    const section = sectionInput.value;

    if (!name) {
        alert("Please enter Student Name.");
        nameInput.focus();
        nameInput.style.borderColor = "#ff5252";
        return false;
    }
    if (!roll) {
        alert("Please enter Roll Number.");
        rollInput.focus();
        rollInput.style.borderColor = "#ff5252";
        return false;
    }
    if (!year) {
        alert("Please select your Year.");
        yearInput.focus();
        yearInput.style.borderColor = "#ff5252";
        return false;
    }
    if (!section) {
        alert("Please select your Section.");
        sectionInput.focus();
        sectionInput.style.borderColor = "#ff5252";
        return false;
    }

    // Store details
    studentDetails.name = name;
    studentDetails.rollNo = roll;
    studentDetails.year = year;
    studentDetails.section = section;
    return true;
}

async function generatePDF(studentName, rollNo) {
    const semBadge = document.getElementById('semester-badge');
    if (!semBadge) return;

    const sgpa = document.getElementById('result-sgpa').textContent;
    const totalCredits = document.getElementById('total-credits-display').textContent;

    const subjectItems = document.querySelectorAll('.subject-card');
    let tableHtml = '';

    subjectItems.forEach((item) => {
        const name = item.querySelector('.subject-name').textContent;
        const code = item.querySelector('.subject-code').textContent;
        const gradeSelect = item.querySelector('.grade-select');
        const gradeText = gradeSelect.options[gradeSelect.selectedIndex].text.trim();

        const bgColor = '#ffffff';
        const borderStyle = 'border-bottom: 1px solid #000;';

        tableHtml += `
            <tr style="background-color: ${bgColor}; ${borderStyle}">
                <td style="padding: 12px 15px; text-align: left; color: #333; vertical-align: middle; font-weight: 500;">${code}</td>
                <td style="padding: 12px 15px; text-align: left; color: #333; vertical-align: middle; text-transform: uppercase;">${name}</td>
                <td style="padding: 12px 15px; text-align: left; font-weight: 600; color: #333; vertical-align: middle;">${gradeText}</td>
            </tr>
        `;
    });

    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const percentage = (parseFloat(sgpa) * 9.5).toFixed(2);

    // Get current semester number
    const semesterText = semBadge.textContent.trim();
    const currentSem = parseInt(semesterText.replace('Semester ', '').replace('SEM ', '')) || 1;

    // Calculate CGPA from Firebase
    let cgpa = sgpa; // Default to current SGPA
    try {
        const { getStudentResults } = await import('./firebase-config.js');
        const allResults = await getStudentResults(rollNo);

        if (allResults && allResults.length > 0) {
            // Calculate average of all semester SGPAs
            const totalSGPA = allResults.reduce((sum, item) => sum + parseFloat(item.result || 0), 0);
            cgpa = (totalSGPA / allResults.length).toFixed(2);
        }
    } catch (error) {
        console.warn("Could not fetch Firebase data for CGPA:", error);
        // Continue with current SGPA as CGPA
    }

    // Convert year to Roman numerals
    const romanNumerals = ['I', 'II', 'III', 'IV'];
    const year = parseInt(studentDetails.year || '1');
    const yearRoman = romanNumerals[year - 1] || 'I';
    const section = studentDetails.section || 'A';

    // Combine Year / Branch / Section into single line
    const academicInfo = `${yearRoman} / CSE / ${section}`;

    document.getElementById('report-student-name').textContent = studentName;
    document.getElementById('report-roll-no').textContent = rollNo;
    document.getElementById('report-academic-info').textContent = academicInfo;
    document.getElementById('report-date').textContent = dateStr;
    document.getElementById('report-table-body').innerHTML = tableHtml;
    document.getElementById('report-total-credits').textContent = totalCredits;
    document.getElementById('report-final-gpa').textContent = sgpa;
    document.getElementById('report-cgpa').textContent = cgpa;
    document.getElementById('report-percentage').textContent = percentage + '%';

    const element = document.getElementById('report-template');
    const originalStyle = element.style.cssText;
    element.style.cssText = "position: relative; left: 0; top: 0; background: white; color: black; padding: 25px; font-family: 'Arial', sans-serif; width: 750px; line-height: 1.4; display: block; box-sizing: border-box;";

    const opt = {
        margin: [5, 5, 5, 5],
        filename: `${studentName.replace(/\s+/g, '_')}_Semester_${currentSem}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 1.8,
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.cssText = originalStyle;
    });
}


// History
// History
function saveToHistory(sem, result, type, credits, resultRollNo, resultName, year, section) {
    const now = new Date();
    // Get current user for binding
    const userSession = sessionStorage.getItem('res_user');
    let sessionRollNo = 'anonymous';
    if (userSession) {
        sessionRollNo = JSON.parse(userSession).rollNo;
    }

    // PRIORITY: Use valid resultRollNo if passed, then global studentDetails, then session
    const rollNo = resultRollNo || (typeof studentDetails !== 'undefined' ? studentDetails.rollNo : "") || sessionRollNo;
    const name = resultName || (typeof studentDetails !== 'undefined' ? studentDetails.name : "") || "";

    const historyItem = {
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        sem: sem,
        result: result,
        type: type,
        credits: credits,
        timestamp: Date.now(),
        rollNo: rollNo, // The student whose SGPA was calculated
        name: name,
        year: year || (typeof studentDetails !== 'undefined' ? studentDetails.year : "") || "",
        section: section || (typeof studentDetails !== 'undefined' ? studentDetails.section : "") || "",
        performedBy: sessionRollNo // Track who performed the calculation
    };

    let history = JSON.parse(localStorage.getItem('gpa_history') || '[]');
    history.unshift(historyItem);
    if (history.length > 50) history.pop();
    localStorage.setItem('gpa_history', JSON.stringify(history));
}

function renderHistory() {
    const listContainer = document.getElementById('history-list');
    if (!listContainer) return;

    // Filter by current user
    const userSession = sessionStorage.getItem('res_user');
    const currentUser = userSession ? JSON.parse(userSession).rollNo : null;

    let history = JSON.parse(localStorage.getItem('gpa_history') || '[]');

    // Filter history to show calculations performed BY the current logged-in user
    const filteredHistory = history.filter(item => {
        if (item.hidden) return false; // Filter out soft-deleted items

        // If user is logged in, show calculations PERFORMED BY them
        if (currentUser) {
            // Check who performed the calculation (new field) or fallback to rollNo for legacy items
            const performer = item.performedBy || item.rollNo;
            return performer === currentUser;
        }

        // If no user is logged in, show all non-hidden items (legacy support)
        return true;
    });

    if (filteredHistory.length === 0) {
        listContainer.innerHTML = '<div class="card" style="text-align: center; color: var(--text-muted); padding: 40px;"><p>No calculations yet.</p></div>';
        return;
    }

    listContainer.innerHTML = '';
    filteredHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        // ... (rest of rendering logic matches existing style)
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '20px';
        div.innerHTML = `
            <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">${item.date} • ${item.time || ''}</span>
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Semester ${item.sem}</h3>
                
                ${item.name || item.rollNo ? `
                <div style="margin-top: 4px; font-size: 0.8rem; color: var(--text-main); font-weight: 500;">
                    ${item.name ? item.name : ''} 
                    ${item.rollNo ? `<span style="color: var(--primary-color); font-family: monospace; margin-left: 5px;">${item.rollNo}</span>` : ''}
                </div>
                ` : ''}
                
                ${item.year || item.section ? `
                <div style="margin-top: 2px; font-size: 0.75rem; color: var(--text-muted);">
                    ${item.year ? item.year + ' Year' : ''} ${item.section ? '• Section ' + item.section : ''}
                </div>
                ` : ''}

                <div style="margin-top: 8px; display: flex; gap: 8px;">
                     <span style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${item.credits || 0} Credits</span>
                </div>
            </div>
            <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 1.5rem; color: var(--primary-color);">${item.result}</h2>
                <span style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${item.type} / 10.0</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

function clearHistory() {
    if (confirm('Clear all history logs? This will hide current results from this view but keep your Final Score.')) {
        // Soft Delete: Mark all current items as hidden
        let history = JSON.parse(localStorage.getItem('gpa_history') || '[]');
        history.forEach(item => item.hidden = true);
        localStorage.setItem('gpa_history', JSON.stringify(history));

        localStorage.setItem('history_cleared_at', Date.now()); // Mark clear time
        renderHistory();
        updateHomePageStats();
    }
}

// Home Page Stats
async function updateHomePageStats() {
    const display = document.getElementById('total-cgpa-display');
    if (!display) return;

    // Get current user
    const userSession = sessionStorage.getItem('res_user');
    const currentUser = userSession ? JSON.parse(userSession).rollNo : null;

    if (!currentUser) {
        display.textContent = "0.00";
        return;
    }

    try {
        // Fetch results from Firebase (source of truth)
        const results = await getStudentResults(currentUser);

        if (!results || results.length === 0) {
            display.textContent = "0.00";
            return;
        }

        // Calculate CGPA as average of all semester SGPAs
        const totalSGPA = results.reduce((sum, item) => sum + parseFloat(item.result || 0), 0);
        const cgpa = (totalSGPA / results.length).toFixed(2);

        display.textContent = cgpa;
    } catch (error) {
        console.error("Error fetching CGPA from Firebase:", error);
        // Fallback to local storage if Firebase fails
        fallbackToLocalCGPA(display, currentUser);
    }
}

// Fallback function using local storage
function fallbackToLocalCGPA(display, currentUser) {
    let history = JSON.parse(localStorage.getItem('gpa_history') || '[]');

    const userHistory = history.filter(item => {
        if (!item.rollNo) return true; // Include legacy
        return item.rollNo === currentUser;
    });

    if (userHistory.length === 0) {
        display.textContent = "0.00";
        return;
    }

    const semesterMap = {};
    userHistory.forEach(item => {
        if (!semesterMap[item.sem] || item.timestamp > semesterMap[item.sem].timestamp) {
            semesterMap[item.sem] = item;
        }
    });

    const entries = Object.values(semesterMap);
    const sum = entries.reduce((acc, curr) => acc + parseFloat(curr.result), 0);
    const average = (sum / entries.length).toFixed(2);

    display.textContent = average;
}

function resetApp() {
    if (confirm('Are you sure you want to reset all data?')) {
        localStorage.clear();
        alert('Data cleared!');
        location.reload();
    }
}

// Legacy Admin Add
function addCustomSubject(sem, name, credit, code) {
    let subjects = getSubjects(sem);
    const newSubj = { name, credit: parseInt(credit), code: code || 'CUSTOM', sem: parseInt(sem) };
    subjects.push(newSubj);
    saveSemesterSubjects(sem, subjects);
    return true;
}

// --- EXPOSE GLOBALS for HTML onclick access ---
window.selectSemester = selectSemester;
window.initiateCalculation = initiateCalculation;
window.submitDetailsAndCalculate = submitDetailsAndCalculate;
window.closeModal = closeModal;
window.downloadReportDirectly = downloadReportDirectly;
window.togglePrevStats = togglePrevStats;
window.resetApp = resetApp;
window.addCustomSubject = addCustomSubject;
window.saveSemesterSubjects = saveSemesterSubjects;
window.getSubjects = getSubjects;
window.renderHistory = renderHistory;
window.clearHistory = clearHistory;
window.createStudent = createStudent;
// Admin specifics
window.saveSubject = window.saveSubject || null; // Will be defined in admin script if needed, but here we just export what we have
window.loadAdminSubjects = window.loadAdminSubjects || null;
