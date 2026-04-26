import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTER_ID_KEY = 'reporterId';

function generateReporterId() {
  return `reporter-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateReporterId() {
  const existingId = await AsyncStorage.getItem(REPORTER_ID_KEY);

  if (existingId) {
    return existingId;
  }

  const newId = generateReporterId();
  await AsyncStorage.setItem(REPORTER_ID_KEY, newId);
  return newId;
}
