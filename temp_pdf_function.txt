// Temporary backup - will replace generatePDF function
// Reference format requirements:
//  - Simple header: Name, Roll No, Branch, Date (left-aligned)
//  - Horizontal line separator  
//  - "SEMESTER SUBJECTS" title
//  - Black-bordered table with Course Code, Course Name, Letter Grade
//  - "FINAL RESULT" section with complete borders
//  - 3 columns: TOTAL CREDITS, SGPA, PERCENTAGE (no CGPA in reference)

async function generatePDF_NEW(studentName, rollNo) {
    const semBadge = document.getElementById('semester-badge');
    if (!semBadge) return;

    // Get current semester data
    const semesterText = semBadge.textContent.trim();
    const currentSem = parseInt(semesterText.replace('Semester ', '').replace('SEM ', '')) || 1;
    const sgpa = document.getElementById('result-sgpa').textContent;
    const totalCredits = document.getElementById('total-credits-display').textContent;
    const percentage = (parseFloat(sgpa) * 9.5).toFixed(2);

    // Get student details
    const branch = studentDetails.branch || "Computer Science and Engineering";
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    // Create Container
    const container = document.createElement('div');
    container.style.padding = "40px";
    container.style.background = "white";
    container.style.color = "black";
    container.style.fontFamily = "'Arial', sans-serif";
    container.style.width = "750px";
    container.style.margin = "0 auto";
    container.style.boxSizing = "border-box";

    // === HEADER SECTION ===
    const headerInfo = document.createElement('div');
    headerInfo.style.marginBottom = "20px";
    headerInfo.style.fontSize = "16px";
    headerInfo.style.lineHeight = "1.8";

    const createHeaderLine = (label, value) => {
        const div = document.createElement('div');
        div.innerHTML = `<strong style="display: inline-block; width: 120px;">${label}:</strong> ${value}`;
        return div;
    };

    headerInfo.appendChild(createHeaderLine("Name", studentName));
    headerInfo.appendChild(createHeaderLine("Roll No", rollNo));
    headerInfo.appendChild(createHeaderLine("Branch", branch));
    headerInfo.appendChild(createHeaderLine("Date", dateStr));
    container.appendChild(headerInfo);

    // Horizontal Line
    const hr1 = document.createElement('div');
    hr1.style.borderTop = "2px solid #000";
    hr1.style.marginBottom = "25px";
    container.appendChild(hr1);

    // === SEMESTER SUBJECTS SECTION ===
    const subjectsTitle = document.createElement('h3');
    subjectsTitle.textContent = "SEMESTER SUBJECTS";
    subjectsTitle.style.fontSize = "20px";
    subjectsTitle.style.fontWeight = "700";
    subjectsTitle.style.marginBottom = "15px";
    subjectsTitle.style.textTransform = "uppercase";
    container.appendChild(subjectsTitle);

    // Course Table with Border
    const tableContainer = document.createElement('div');
    tableContainer.style.border = "2px solid #000";
    tableContainer.style.borderRadius = "8px";
    tableContainer.style.marginBottom = "30px";

    const table = document.createElement('table');
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    // Table Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.background = "#ffffff";
    headerRow.style.borderBottom = "2px solid #000";

    const headers = ['Course Code', 'Course Name', 'Letter Grade'];
    const widths = ['20%', '55%', '25%'];
    headers.forEach((headerText, index) => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = "12px 15px";
        th.style.textAlign = "left";
        th.style.fontWeight = "600";
        th.style.fontSize = "14px";
        th.style.width = widths[index];
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement('tbody');
    const subjectItems = document.querySelectorAll('.subject-card');

    subjectItems.forEach((item, index) => {
        const name = item.querySelector('.subject-name').textContent;
        const code = item.querySelector('.subject-code').textContent;
        const gradeSelect = item.querySelector('.grade-select');
        const gradeText = gradeSelect.options[gradeSelect.selectedIndex].text.trim();

        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
        if (index < subjectItems.length - 1) {
            tr.style.borderBottom = "1px solid #ddd";
        }

        const td1 = document.createElement('td');
        td1.textContent = code;
        td1.style.padding = "12px 15px";
        td1.style.fontSize = "14px";

        const td2 = document.createElement('td');
        td2.textContent = name.toUpperCase();
        td2.style.padding = "12px 15px";
        td2.style.fontSize = "14px";
        td2.style.color = "#666";

        const td3 = document.createElement('td');
        td3.textContent = gradeText;
        td3.style.padding = "12px 15px";
        td3.style.fontSize = "14px";
        td3.style.fontWeight = "700";
        td3.style.textAlign = "left";

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);

    // === FINAL RESULT SECTION ===
    const resultContainer = document.createElement('div');
    resultContainer.style.border = "2px solid #000";
    resultContainer.style.borderRadius = "8px";

    // Result Title
    const resultTitle = document.createElement('div');
    resultTitle.textContent = "FINAL RESULT";
    resultTitle.style.background = "#ffffff";
    resultTitle.style.padding = "12px 15px";
    resultTitle.style.textAlign = "center";
    resultTitle.style.fontSize = "18px";
    resultTitle.style.fontWeight = "700";
    resultTitle.style.borderBottom = "2px solid #000";
    resultContainer.appendChild(resultTitle);

    // Result Values Container
    const resultValues = document.createElement('div');
    resultValues.style.display = "grid";
    resultValues.style.gridTemplateColumns = "1fr 1fr 1fr";
    resultValues.style.background = "#f0f4f8";
    resultValues.style.padding = "0";

    const createResultColumn = (label, value, isLast = false) => {
        const col = document.createElement('div');
        col.style.padding = "25px 20px";
        col.style.textAlign = "center";
        if (!isLast) {
            col.style.borderRight = "1px solid #ccc";
        }

        const labelDiv = document.createElement('div');
        labelDiv.textContent = label;
        labelDiv.style.fontSize = "12px";
        labelDiv.style.fontWeight = "700";
        labelDiv.style.color = "#4a90e2";
        labelDiv.style.marginBottom = "8px";
        labelDiv.style.textTransform = "uppercase";

        const valueDiv = document.createElement('div');
        valueDiv.textContent = value;
        valueDiv.style.fontSize = "28px";
        valueDiv.style.fontWeight = "700";
        valueDiv.style.color = "#000";

        col.appendChild(labelDiv);
        col.appendChild(valueDiv);
        return col;
    };

    resultValues.appendChild(createResultColumn("Total Credits", totalCredits));
    resultValues.appendChild(createResultColumn("SGPA", sgpa));
    resultValues.appendChild(createResultColumn("Percentage", percentage + '%', true));

    resultContainer.appendChild(resultValues);
    container.appendChild(resultContainer);

    // Generate PDF
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${studentName.replace(/\s+/g, '_')}_Semester_${currentSem}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save().catch((err) => {
        console.error("PDF Generation failed:", err);
        alert("Error generating PDF: " + (err.message || err));
    });
}
