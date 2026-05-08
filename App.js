import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
          <TouchableOpacity
            onPress={() => setHistoryVisible(true)}
            style={styles.historyButton}
            activeOpacity={0.6}
          >
            <Text style={styles.historyButtonText}>
              Історія{history.length > 0 ? ` (${history.length})` : ''}
            </Text>
          </TouchableOpacity>
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
                  <TouchableOpacity
                    onPress={clearHistory}
                    style={styles.modalActionBtn}
                  >
                    <Text style={styles.modalActionText}>Очистити</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setHistoryVisible(false)}
                  style={styles.modalActionBtn}
                >
                  <Text style={styles.modalActionText}>Закрити</Text>
                </TouchableOpacity>
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
                  <TouchableOpacity
                    style={styles.historyRow}
                    onPress={() => useHistoryEntry(item)}
                    activeOpacity={0.6}
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
                  </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  historyButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
  },
  historyButtonText: {
    color: '#ff9500',
    fontSize: 15,
    fontWeight: '500',
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
    paddingVertical: 12,
    paddingHorizontal: 20,
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
