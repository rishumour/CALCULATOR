// DOM Elements
const displayCurrent = document.getElementById('display-current');
const displayHistory = document.getElementById('display-history');
const calculatorContainer = document.querySelector('.calculator-container');
const buttons = document.querySelectorAll('.btn');

// Calculator State
let currentValue = '0';
let previousValue = '';
let operator = '';
let shouldResetCurrentValue = false;
let historyEquation = '';

// Operators mapping for presentation
const OPERATOR_SYMBOLS = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷'
};

// Start initialization
init();

function init() {
    // Add event listeners to all buttons
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const val = button.getAttribute('data-val');
            handleInput(val);
        });
    });

    // Add keyboard support
    document.addEventListener('keydown', handleKeyboardInput);
}

// Handle all inputs (clicks or keyboard)
function handleInput(input) {
    if (isNumber(input)) {
        handleNumber(input);
    } else if (isOperator(input)) {
        handleOperator(input);
    } else {
        switch (input) {
            case 'AC':
                clearAll();
                break;
            case 'DEL':
                backspace();
                break;
            case '.':
                handleDecimal();
                break;
            case '+/-':
                toggleSign();
                break;
            case '%':
                handlePercent();
                break;
            case '=':
                evaluate();
                break;
        }
    }
    updateDisplay();
}

// Checkers
function isNumber(val) {
    return !isNaN(val) && val !== null;
}

function isOperator(val) {
    return ['+', '-', '*', '/'].includes(val);
}

// Input Handlers
function handleNumber(num) {
    if (currentValue === '0' || shouldResetCurrentValue || currentValue === 'Error') {
        currentValue = num;
        shouldResetCurrentValue = false;
    } else {
        // Prevent typing too many digits
        if (currentValue.replace(/[^0-9]/g, '').length < 15) {
            currentValue += num;
        }
    }
}

function handleDecimal() {
    if (shouldResetCurrentValue || currentValue === 'Error') {
        currentValue = '0.';
        shouldResetCurrentValue = false;
        return;
    }
    if (!currentValue.includes('.')) {
        currentValue += '.';
    }
}

function toggleSign() {
    if (currentValue === 'Error' || currentValue === '0') return;
    if (currentValue.startsWith('-')) {
        currentValue = currentValue.slice(1);
    } else {
        currentValue = '-' + currentValue;
    }
}

function handlePercent() {
    if (currentValue === 'Error') return;
    const num = parseFloat(currentValue);
    if (isNaN(num)) return;
    
    // Evaluate floating point division by 100 safely
    currentValue = safeRound(num / 100).toString();
}

function handleOperator(nextOperator) {
    if (currentValue === 'Error') return;

    const currentNum = parseFloat(currentValue);

    if (operator && !shouldResetCurrentValue) {
        // We already have an operator and the user entered a new number, calculate intermediate result
        const result = calculate();
        if (result === 'Error') {
            currentValue = 'Error';
            operator = '';
            previousValue = '';
            updateDisplay();
            return;
        }
        previousValue = result.toString();
        currentValue = previousValue;
    } else {
        previousValue = currentValue;
    }

    operator = nextOperator;
    shouldResetCurrentValue = true;
    historyEquation = `${previousValue} ${OPERATOR_SYMBOLS[operator]}`;
}

function evaluate() {
    if (!operator || shouldResetCurrentValue || currentValue === 'Error') return;

    const operand1 = parseFloat(previousValue);
    const operand2 = parseFloat(currentValue);
    
    const result = calculate();
    
    if (result === 'Error') {
        currentValue = 'Error';
        historyEquation = '';
    } else {
        // Format equation history (e.g. "12 + 5 =")
        historyEquation = `${previousValue} ${OPERATOR_SYMBOLS[operator]} ${currentValue} =`;
        currentValue = result.toString();
    }
    
    operator = '';
    previousValue = '';
    shouldResetCurrentValue = true;

    // Micro-interaction container computing flash effect
    calculatorContainer.classList.add('computing');
    setTimeout(() => {
        calculatorContainer.classList.remove('computing');
    }, 150);
}

function calculate() {
    const num1 = parseFloat(previousValue);
    const num2 = parseFloat(currentValue);

    if (isNaN(num1) || isNaN(num2)) return 'Error';

    let res;
    switch (operator) {
        case '+':
            res = num1 + num2;
            break;
        case '-':
            res = num1 - num2;
            break;
        case '*':
            res = num1 * num2;
            break;
        case '/':
            if (num2 === 0) return 'Error';
            res = num1 / num2;
            break;
        default:
            return 'Error';
    }

    return safeRound(res);
}

// Solve standard float issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
function safeRound(num) {
    if (Math.abs(num) === Infinity || isNaN(num)) return 'Error';
    // Round to 12 decimal places to fix float representation issues, then parse back to float
    return parseFloat(num.toFixed(12));
}

function clearAll() {
    currentValue = '0';
    previousValue = '';
    operator = '';
    shouldResetCurrentValue = false;
    historyEquation = '';
}

function backspace() {
    if (currentValue === 'Error' || shouldResetCurrentValue) {
        clearAll();
        return;
    }
    
    if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);
        if (currentValue === '-' || currentValue === '-0') {
            currentValue = '0';
        }
    } else {
        currentValue = '0';
    }
}

// Display Formatting and Updating
function updateDisplay() {
    displayCurrent.textContent = formatDisplayValue(currentValue);
    displayHistory.textContent = historyEquation;
}

function formatDisplayValue(val) {
    if (val === 'Error') return 'Error';
    
    // Check if the number is too large/small and needs scientific notation
    const num = parseFloat(val);
    if (!isNaN(num) && (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-7 && num !== 0))) {
        return num.toExponential(8);
    }
    
    return formatNumber(val);
}

function formatNumber(numStr) {
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    let formattedInt = integerPart;
    if (integerPart !== '-' && !isNaN(integerPart)) {
        formattedInt = parseFloat(integerPart).toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    }
    
    return decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
}

// Keyboard Input Event Handler
function handleKeyboardInput(e) {
    let keyVal = e.key;

    // Normalize keys
    if (keyVal === 'Enter') keyVal = '=';
    if (keyVal === 'Escape') keyVal = 'AC';
    if (keyVal === '*') keyVal = '*';
    if (keyVal === 'x' || keyVal === 'X') keyVal = '*';
    if (keyVal === '/') keyVal = '/';

    // Find matching button
    let targetButton = null;
    
    if (keyVal === 'Backspace') {
        targetButton = document.querySelector('button[data-val="DEL"]');
    } else {
        targetButton = document.querySelector(`button[data-val="${keyVal}"]`);
    }

    if (targetButton) {
        e.preventDefault();
        
        // Trigger active button styling animation
        targetButton.classList.add('keyboard-active');
        setTimeout(() => {
            targetButton.classList.remove('keyboard-active');
        }, 100);

        // Process key input
        if (keyVal === 'Backspace') {
            handleInput('DEL');
        } else {
            handleInput(keyVal);
        }
    }
}
