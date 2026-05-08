import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BUTTONS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const OPERATORS = ['÷', '×', '-', '+'];
const ERROR_TEXT = 'Помилка';

function calculate(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) return ERROR_TEXT;
      return a / b;
    default:
      return b;
  }
}

function formatNumber(num) {
  if (!Number.isFinite(num)) return String(num);
  const rounded = Math.round(num * 1e10) / 1e10;
  return String(rounded);
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const isError = display === ERROR_TEXT;
  const isCleanState =
    display === '0' && previous == null && operator == null && !waitingForOperand;
  const clearLabel = isCleanState || isError ? 'AC' : 'C';

  const clearAll = () => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
    setWaitingForOperand(false);
  };

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const percent = () => {
    const value = parseFloat(display);
    setDisplay(formatNumber(value / 100));
    setWaitingForOperand(false);
  };

  const performOperator = (nextOp) => {
    const current = parseFloat(display);

    if (previous == null) {
      setPrevious(current);
    } else if (operator && !waitingForOperand) {
      const result = calculate(previous, current, operator);
      if (result === ERROR_TEXT) {
        setDisplay(ERROR_TEXT);
        setPrevious(null);
        setOperator(null);
        setWaitingForOperand(false);
        return;
      }
      setDisplay(formatNumber(result));
      setPrevious(result);
    }

    setOperator(nextOp);
    setWaitingForOperand(true);
  };

  const performEquals = () => {
    if (operator == null || previous == null) return;
    const current = parseFloat(display);
    const result = calculate(previous, current, operator);
    if (result === ERROR_TEXT) {
      setDisplay(ERROR_TEXT);
      setPrevious(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }
    setDisplay(formatNumber(result));
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handlePress = (label) => {
    if (label === 'C' || label === 'AC') {
      if (clearLabel === 'AC') {
        clearAll();
      } else {
        clearEntry();
      }
      return;
    }

    if (isError) return;

    if (label >= '0' && label <= '9') {
      inputDigit(label);
    } else if (label === '.') {
      inputDot();
    } else if (label === '⌫') {
      backspace();
    } else if (label === '%') {
      percent();
    } else if (label === '=') {
      performEquals();
    } else if (OPERATORS.includes(label)) {
      performOperator(label);
    }
  };

  const expressionPreview =
    !isError && previous != null && operator
      ? `${formatNumber(previous)} ${operator}${waitingForOperand ? '' : ' ' + display}`
      : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.display}>
          <Text style={styles.historyText} numberOfLines={1}>
            {expressionPreview}
          </Text>
          <Text
            style={[styles.resultText, isError && styles.resultTextError]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {display}
          </Text>
        </View>

        <View style={styles.keypad}>
          {BUTTONS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((label) => {
                const displayLabel = label === 'C' ? clearLabel : label;
                const isOperator = ['÷', '×', '-', '+', '='].includes(label);
                const isFunction = ['C', '⌫', '%'].includes(label);
                const isWide = label === '0';
                const isActive = operator === label && waitingForOperand;

                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => handlePress(label)}
                    style={[
                      styles.button,
                      isWide && styles.buttonWide,
                      isOperator && styles.buttonOperator,
                      isFunction && styles.buttonFunction,
                      isActive && styles.buttonOperatorActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        (isOperator || isFunction) && styles.buttonTextLight,
                        isActive && styles.buttonTextActive,
                      ]}
                    >
                      {displayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  historyText: {
    color: '#888',
    fontSize: 24,
    marginBottom: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '300',
  },
  resultTextError: {
    color: '#ff453a',
    fontSize: 56,
  },
  keypad: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 5,
    borderRadius: 100,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWide: {
    flex: 2.15,
    aspectRatio: undefined,
    height: undefined,
    alignItems: 'flex-start',
    paddingLeft: 32,
  },
  buttonOperator: {
    backgroundColor: '#ff9500',
  },
  buttonOperatorActive: {
    backgroundColor: '#fff',
  },
  buttonFunction: {
    backgroundColor: '#a5a5a5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '400',
  },
  buttonTextLight: {
    color: '#fff',
  },
  buttonTextActive: {
    color: '#ff9500',
  },
});
