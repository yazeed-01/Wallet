/**
 * Calculator utility functions for safe mathematical expression evaluation
 */

/**
 * Evaluates a mathematical expression safely (without using eval())
 * Supports: +, -, *, / operators with left-to-right evaluation
 * @param expression - The mathematical expression string (e.g., "100 + 50 - 20")
 * @returns The calculated result or null if invalid
 */
export function evaluateExpression(expression: string): number | null {
  try {
    // Remove whitespace
    const cleaned = expression.replace(/\s+/g, '');

    // Return null for empty expression
    if (!cleaned) return null;

    // If just a number, parse and return
    if (/^-?\d+\.?\d*$/.test(cleaned)) {
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }

    // Split expression into tokens (numbers and operators)
    const tokens = cleaned.split(/([+\-×÷*/])/);

    // Validate tokens
    if (tokens.length === 0) return null;

    // Start with first number
    let result = parseFloat(tokens[0]);
    if (isNaN(result)) return null;

    // Process operators and numbers left to right
    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const nextNum = parseFloat(tokens[i + 1]);

      if (isNaN(nextNum)) return null;

      switch (operator) {
        case '+':
          result += nextNum;
          break;
        case '-':
          result -= nextNum;
          break;
        case '×':
        case '*':
          result *= nextNum;
          break;
        case '÷':
        case '/':
          if (nextNum === 0) return null; // Division by zero
          result /= nextNum;
          break;
        default:
          return null;
      }
    }

    // Return null for invalid results
    if (!isFinite(result) || isNaN(result)) return null;

    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Formats an expression for display
 * Ensures proper spacing around operators
 * @param expression - The raw expression string
 * @returns Formatted expression
 */
export function formatExpression(expression: string): string {
  return expression
    .replace(/\s+/g, '') // Remove existing spaces
    .replace(/([+\-×÷*/])/g, ' $1 ') // Add spaces around operators
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
}

/**
 * Validates if a character can be added to the current expression
 * @param char - The character to add
 * @param currentExpression - The current expression
 * @returns True if the character is valid
 */
export function isValidCalculatorInput(
  char: string,
  currentExpression: string
): boolean {
  const lastChar = currentExpression.slice(-1);
  const operators = ['+', '-', '×', '÷', '*', '/'];

  // Always allow first character if it's a number or decimal
  if (!currentExpression) {
    return /[0-9.]/.test(char);
  }

  // Check for decimal point rules
  if (char === '.') {
    // Don't allow multiple decimals in the same number
    const parts = currentExpression.split(/[+\-×÷*/]/);
    const lastNumber = parts[parts.length - 1];
    return !lastNumber.includes('.');
  }

  // Check for operator rules
  if (operators.includes(char)) {
    // Don't allow operator as first character
    if (!currentExpression) return false;
    // Don't allow consecutive operators
    if (operators.includes(lastChar)) return false;
    // Don't allow operator after decimal point
    if (lastChar === '.') return false;
    return true;
  }

  // Allow numbers
  if (/[0-9]/.test(char)) {
    return true;
  }

  return false;
}

/**
 * Checks if the expression is complete and valid for evaluation
 * @param expression - The expression to check
 * @returns True if the expression can be evaluated
 */
export function isCompleteExpression(expression: string): boolean {
  if (!expression) return false;

  const trimmed = expression.trim();
  const lastChar = trimmed.slice(-1);
  const operators = ['+', '-', '×', '÷', '*', '/'];

  // Expression should not end with an operator or decimal
  if (operators.includes(lastChar) || lastChar === '.') {
    return false;
  }

  return true;
}

/**
 * Formats a number result for display in the amount field
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatCalculatorResult(
  value: number,
  decimals: number = 2
): string {
  return value.toFixed(decimals);
}
