import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function OnboardingScreen() {
const handleStart = async () => {
  await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  router.replace({ pathname: '/(tabs)' });
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Urban Risk</Text>

      <Text style={styles.subtitle}>
        Reporta incidentes ciudadanos y visualiza zonas de riesgo en el mapa.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uso responsable</Text>
        <Text style={styles.cardText}>
          Esta app busca identificar zonas de riesgo a partir de reportes ciudadanos.
          No debe usarse para acusar personas o negocios específicos.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Empezar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    lineHeight: 26,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardText: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});