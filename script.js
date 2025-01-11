// Keeps track of the selected cell
let selectedCell = null;

// Initialize a 64x64 grid on page load
window.onload = function initializeGrid() {
    const spreadsheet = document.getElementById('spreadsheet');

    // Create headers
    const headerRow = document.createElement('div');
    headerRow.classList.add('header-row');
    headerRow.innerHTML = `<div class="cell header"></div>`;
    for (let col = 0; col < 64; col++) {
        const columnLabel = getColumnLabel(col);
        headerRow.innerHTML += `<div class="cell header">${columnLabel}</div>`;
    }
    spreadsheet.appendChild(headerRow);

    // Create rows
    for (let row = 1; row <= 64; row++) {
        const newRow = document.createElement('div');
        newRow.classList.add('row');
        newRow.innerHTML = `<div class="cell header">${row}</div>`;

        for (let col = 0; col < 64; col++) {
            const columnLabel = getColumnLabel(col);
            const cellId = `${columnLabel}${row}`;
            newRow.innerHTML += `<div class="cell" contenteditable="true" data-cell="${cellId}" data-type="text"></div>`;
        }
        spreadsheet.appendChild(newRow);
    }

    // Attach cell listeners
    attachCellListeners();
};

// Attach event listeners to editable cells
function attachCellListeners() {
    document.querySelectorAll('.cell[contenteditable="true"]').forEach(cell => {
        cell.addEventListener('focus', () => {
            selectedCell = cell;
            document.getElementById('formulaBar').value = cell.textContent;
        });

        // Save data in cell when Enter key is pressed
        cell.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default new line behavior
                const formulaBarValue = document.getElementById('formulaBar').value.trim();
                cell.innerHTML = formulaBarValue; // Save the data in the cell
                applyFormula(); // Apply the formula or save the content
                moveToNextCell(); // Move to the next cell
            }
        });

        cell.addEventListener('input', () => {
            if (selectedCell === cell) {
                document.getElementById('formulaBar').value = cell.textContent; // Sync the formula bar
            }
        });
    });
}

// Helper to get column labels (A, B, ..., Z, AA, AB, ...)
function getColumnLabel(index) {
    let label = '';
    while (index >= 0) {
        label = String.fromCharCode((index % 26) + 65) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
}

// Apply formula or value from the formula bar
function applyFormula() {
    const formulaBarValue = document.getElementById('formulaBar').value.trim();

    if (!selectedCell) {
        alert('Select a cell to apply the formula.');
        return;
    }

    if (formulaBarValue.startsWith('=')) {
        // Handle formula evaluation
        const operation = formulaBarValue.slice(1).toUpperCase();
        try {
            if (operation.startsWith('SUM(')) {
                selectedCell.textContent = handleSUM(operation);
            } else if (operation.startsWith('AVERAGE(')) {
                selectedCell.textContent = handleAVERAGE(operation);
            } else if (operation.startsWith('MAX(')) {
                selectedCell.textContent = handleMAX(operation);
            } else if (operation.startsWith('MIN(')) {
                selectedCell.textContent = handleMIN(operation);
            } else if (operation.startsWith('COUNT(')) {
                selectedCell.textContent = handleCOUNT(operation);
            } else if (operation.startsWith('UPPER(')) {
                selectedCell.textContent = handleUPPER(operation);
            } else if (operation.startsWith('LOWER(')) {
                selectedCell.textContent = handleLOWER(operation);
            } else if (operation.startsWith('TRIM(')) {
                selectedCell.textContent = handleTRIM(operation);
            } else if (operation.startsWith('REMOVE_DUPLICATES(')) {
                handleREMOVE_DUPLICATES(operation);
            } else {
                selectedCell.textContent = evalFormula(formulaBarValue.slice(1));
            }
        } catch (err) {
            alert('Error in formula: ' + err.message);
        }
    } else {
        // Save the plain value (non-formula)
        selectedCell.textContent = formulaBarValue;
    }

    // Sync the formula bar with the updated cell content
    document.getElementById('formulaBar').value = selectedCell.textContent;
}

// Evaluate simple mathematical formulas
function evalFormula(expression) {
    try {
        return eval(expression);
    } catch (error) {
        alert('Invalid mathematical expression.');
        return '';
    }
}

// Handle SUM formula
function handleSUM(operation) {
    const rangeOrCells = operation.match(/\((.*?)\)/)[1];
    if (rangeOrCells.includes(':')) {
        const range = parseRange(rangeOrCells);
        return range.reduce((sum, cell) => sum + getCellValue(cell), 0);
    } else {
        const cells = rangeOrCells.split(',').map(cell => cell.trim());
        return cells.reduce((sum, cell) => sum + getCellValue(cell), 0);
    }
}

// Handle AVERAGE formula
function handleAVERAGE(operation) {
    const range = parseRange(operation);
    const values = range.map(cell => getCellValue(cell));
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
}

// Handle MAX formula
function handleMAX(operation) {
    const range = parseRange(operation);
    return Math.max(...range.map(cell => getCellValue(cell)));
}

// Handle MIN formula
function handleMIN(operation) {
    const range = parseRange(operation);
    return Math.min(...range.map(cell => getCellValue(cell)));
}

// Handle COUNT formula
function handleCOUNT(operation) {
    const range = parseRange(operation);
    return range.filter(cell => !isNaN(getCellValue(cell))).length;
}

// Handle UPPER formula
function handleUPPER(operation) {
    const cellRef = operation.match(/\((.*?)\)/)[1].trim();
    const cell = document.querySelector(`[data-cell="${cellRef}"]`);
    return cell ? cell.textContent.toUpperCase() : '';
}

// Handle LOWER formula
function handleLOWER(operation) {
    const cellRef = operation.match(/\((.*?)\)/)[1].trim();
    const cell = document.querySelector(`[data-cell="${cellRef}"]`);
    return cell ? cell.textContent.toLowerCase() : '';
}

// Handle TRIM formula
function handleTRIM(operation) {
    const cellRef = operation.match(/\((.*?)\)/)[1].trim();
    const cell = document.querySelector(`[data-cell="${cellRef}"]`);
    return cell ? cell.textContent.trim() : '';
}

// Handle REMOVE_DUPLICATES formula
function handleREMOVE_DUPLICATES(operation) {
    const range = parseRange(operation);
    const seen = new Set();
    range.forEach(cell => {
        const cellElement = document.querySelector(`[data-cell="${cell}"]`);
        const value = cellElement.textContent.trim();
        if (seen.has(value)) {
            cellElement.textContent = '';
        } else {
            seen.add(value);
        }
    });
}

// Parse ranges (e.g., A1:A5)
function parseRange(operation) {
    const range = operation.match(/\((.*?)\)/)[1];
    const [start, end] = range.split(':');
    const startCol = start[0], startRow = parseInt(start.slice(1));
    const endCol = end[0], endRow = parseInt(end.slice(1));

    const cells = [];
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
            cells.push(String.fromCharCode(col) + row);
        }
    }
    return cells;
}

// Get cell value by reference
function getCellValue(cellReference) {
    const cell = document.querySelector(`[data-cell="${cellReference.trim()}"]`);
    return cell && cell.textContent ? parseFloat(cell.textContent) || 0 : 0;
}

// Move to the next cell on Enter key press
function moveToNextCell() {
    const cells = Array.from(document.querySelectorAll('.cell[contenteditable="true"]'));
    const currentIndex = cells.indexOf(selectedCell);
    const nextCell = cells[currentIndex + 1];
    if (nextCell) {
        nextCell.focus();
    }
}

// Save spreadsheet data and charts into an Excel file
function saveSpreadsheet() {
    // Extract spreadsheet data
    const rows = Array.from(document.querySelectorAll('.row'));
    const data = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('.cell'));
        return cells.map(cell => cell.textContent.trim());
    });

    // Create a workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Spreadsheet');

    // Check if a chart exists and export it
    const chartCanvas = document.getElementById('chartCanvas');
    if (chartCanvas) {
        const chartDataUrl = chartCanvas.toDataURL('image/png'); // Export chart as a data URL
        const chartImageSheet = XLSX.utils.aoa_to_sheet([['Chart Data'], ['Image Below']]);
        XLSX.utils.book_append_sheet(workbook, chartImageSheet, 'Charts');

        // Save the image URL in a separate file (or link to the Excel sheet if using advanced tools)
        alert("Note: Excel doesn't natively embed images. You can reference the exported image.");
    }

    // Save the workbook
    XLSX.writeFile(workbook, 'spreadsheet.xlsx');
}

// Function to run test cases and save results
function testFunctions() {
    const testData = [
        { formula: '=SUM(A1:A5)', expected: '15' },
        { formula: '=UPPER(A1)', expected: 'HELLO' },
        { formula: '=TRIM(A2)', expected: 'World' },
    ];

    const resultsDiv = document.getElementById('testResults');
    resultsDiv.innerHTML = '<h3>Test Results:</h3>';

    const testResults = testData.map(test => {
        const result = applyFormulaTest(test.formula);
        const passed = result == test.expected ? '✅ Passed' : `❌ Failed (Expected: ${test.expected}, Got: ${result})`;
        resultsDiv.innerHTML += `<p>${test.formula}: ${passed}</p>`;
        return { formula: test.formula, result, expected: test.expected, status: passed };
    });

    // Append test results to the workbook
    const workbook = XLSX.utils.book_new();
    const testSheetData = testResults.map(test => [test.formula, test.result, test.expected, test.status]);
    const testSheet = XLSX.utils.aoa_to_sheet([['Formula', 'Result', 'Expected', 'Status'], ...testSheetData]);
    XLSX.utils.book_append_sheet(workbook, testSheet, 'Test Results');

    XLSX.writeFile(workbook, 'test_results.xlsx');
}

// Function to simulate formula application for tests
function applyFormulaTest(formula) {
    const testCell = document.createElement('div');
    testCell.textContent = '';
    selectedCell = testCell;

    document.body.appendChild(testCell);
    document.getElementById('formulaBar').value = formula;
    applyFormula();

    const result = testCell.textContent;
    document.body.removeChild(testCell);
    return result;
}
let isDragging = false;
let dragStartCell, dragEndCell;

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartCell = e.target;
    });

    cell.addEventListener('mousemove', (e) => {
        if (isDragging) {
            dragEndCell = e.target;
            // Highlight range or track drag
        }
    });

    cell.addEventListener('mouseup', () => {
        isDragging = false;
        // Copy content/formulas from dragStartCell to dragEndCell
    });
});
function findAndReplace(findText, replaceText, range) {
    range.forEach(cellRef => {
        const cell = document.querySelector(`[data-cell="${cellRef}"]`);
        if (cell && cell.textContent.includes(findText)) {
            cell.textContent = cell.textContent.replace(findText, replaceText);
        }
    });
}
// Apply styles like Bold, Italic, Underline to the selected cell
function applyStyle(style) {
    if (selectedCell) {
        document.execCommand(style, false, null);
    } else {
        alert('Select a cell to apply the style.');
    }
}
// Apply a color to the text of the selected cell
function applyColor(color) {
    if (selectedCell) {
        selectedCell.style.color = color;
    } else {
        alert('Select a cell to apply the color.');
    }
}
function addRow() {
    const spreadsheet = document.getElementById('spreadsheet');
    const rowCount = spreadsheet.querySelectorAll('.row').length + 1;

    const newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.innerHTML = `<div class="cell header">${rowCount}</div>`;

    for (let i = 0; i < 64; i++) {
        const cellId = `${getColumnLabel(i)}${rowCount}`;
        newRow.innerHTML += `<div class="cell" contenteditable="true" data-cell="${cellId}" data-type="text"></div>`;
    }

    spreadsheet.appendChild(newRow);
    attachCellListeners(); // Reattach listeners for new cells
}
function addColumn() {
    const spreadsheet = document.getElementById('spreadsheet');
    const colCount = spreadsheet.querySelector('.header-row').children.length - 1;

    const newHeader = document.createElement('div');
    newHeader.classList.add('cell', 'header');
    newHeader.textContent = getColumnLabel(colCount);
    spreadsheet.querySelector('.header-row').appendChild(newHeader);

    const rows = spreadsheet.querySelectorAll('.row');
    rows.forEach((row, index) => {
        const newCell = document.createElement('div');
        newCell.classList.add('cell');
        newCell.setAttribute('contenteditable', 'true');
        newCell.setAttribute('data-cell', `${getColumnLabel(colCount)}${index + 1}`);
        newCell.setAttribute('data-type', 'text');
        row.appendChild(newCell);
    });

    attachCellListeners(); // Reattach listeners for new cells
}
