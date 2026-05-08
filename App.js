import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BUTTONS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.display}>
          <Text style={styles.historyText}></Text>
          <Text style={styles.resultText}>0</Text>
        </View>

        <View style={styles.keypad}>
          {BUTTONS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((label) => {
                const isOperator = ['÷', '×', '-', '+', '='].includes(label);
                const isFunction = ['C', '⌫', '%'].includes(label);
                const isWide = label === '0';

                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.button,
                      isWide && styles.buttonWide,
                      isOperator && styles.buttonOperator,
                      isFunction && styles.buttonFunction,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        (isOperator || isFunction) && styles.buttonTextLight,
                      ]}
                    >
                      {label}
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
});
