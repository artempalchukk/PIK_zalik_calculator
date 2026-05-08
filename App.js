import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const [history, setHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);

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
    const expression = `${formatNumber(previous)} ${operator} ${display}`;
    if (result === ERROR_TEXT) {
      setHistory((prev) => [
        { id: String(Date.now()), expression, result: ERROR_TEXT },
        ...prev,
      ]);
      setDisplay(ERROR_TEXT);
      setPrevious(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }
    const formatted = formatNumber(result);
    setHistory((prev) => [
      { id: String(Date.now()), expression, result: formatted },
      ...prev,
    ]);
    setDisplay(formatted);
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const useHistoryEntry = (entry) => {
    if (entry.result === ERROR_TEXT) {
      setHistoryVisible(false);
      return;
    }
    setDisplay(entry.result);
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
    setHistoryVisible(false);
  };

  const clearHistory = () => setHistory([]);

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
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Калькулятор</Text>
          <Pressable
            onPress={() => setHistoryVisible(true)}
            style={({ pressed }) => [
              styles.historyButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.historyButtonText}>
              Історія{history.length > 0 ? ` · ${history.length}` : ''}
            </Text>
          </Pressable>
        </View>

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
                  <Pressable
                    key={label}
                    onPress={() => handlePress(label)}
                    style={({ pressed }) => [
                      styles.button,
                      isWide && styles.buttonWide,
                      isOperator && styles.buttonOperator,
                      isFunction && styles.buttonFunction,
                      isActive && styles.buttonOperatorActive,
                      pressed && styles.pressed,
                    ]}
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
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setHistoryVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Історія</Text>
              <View style={styles.modalActions}>
                {history.length > 0 && (
                  <Pressable
                    onPress={clearHistory}
                    style={({ pressed }) => [
                      styles.modalActionBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalActionText}>Очистити</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setHistoryVisible(false)}
                  style={({ pressed }) => [
                    styles.modalActionBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.modalActionText}>Закрити</Text>
                </Pressable>
              </View>
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Історія порожня</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.historyRow,
                      pressed && styles.historyRowPressed,
                    ]}
                    onPress={() => useHistoryEntry(item)}
                  >
                    <Text style={styles.historyExpression} numberOfLines={1}>
                      {item.expression}
                    </Text>
                    <Text
                      style={[
                        styles.historyResult,
                        item.result === ERROR_TEXT && styles.historyResultError,
                      ]}
                      numberOfLines={1}
                    >
                      = {item.result}
                    </Text>
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  historyText: {
    color: '#7a7a7e',
    fontSize: 22,
    marginBottom: 10,
    fontWeight: '300',
  },
  resultText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -1,
  },
  resultTextError: {
    color: '#ff453a',
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 0,
  },
  keypad: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 6,
    borderRadius: 100,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonWide: {
    flex: 2.15,
    aspectRatio: undefined,
    height: undefined,
    alignItems: 'flex-start',
    paddingLeft: 36,
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
    fontSize: 34,
    fontWeight: '400',
  },
  buttonTextLight: {
    color: '#fff',
  },
  buttonTextActive: {
    color: '#ff9500',
  },
  pressed: {
    opacity: 0.6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  appTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  historyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
  },
  historyButtonText: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3a3c',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalActionBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalActionText: {
    color: '#ff9500',
    fontSize: 15,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2c2c2e',
    marginHorizontal: 20,
  },
  historyRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  historyRowPressed: {
    backgroundColor: '#2c2c2e',
  },
  historyExpression: {
    color: '#a0a0a5',
    fontSize: 16,
    marginBottom: 4,
  },
  historyResult: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
  historyResultError: {
    color: '#ff453a',
  },
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
