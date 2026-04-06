import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useReportDraft } from '../context/report-draft-context';

export default function SelectLocationScreen() {
  const { draft, updateDraft } = useReportDraft();
  const [loading, setLoading] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    draft.latitude !== null && draft.longitude !== null
      ? {
          latitude: draft.latitude,
          longitude: draft.longitude,
        }
      : null
  );

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Debes permitir acceso a ubicación para obtener la dirección.'
        );
        return;
      }

      const results = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      console.log('Reverse geocode results:', JSON.stringify(results, null, 2));

      let address = '';
      let district = '';

      if (results.length > 0) {
        const firstResult = results[0];

        const streetParts = [
          firstResult.street,
          firstResult.streetNumber,
        ].filter(Boolean);

        address =
        firstResult.formattedAddress ||
        streetParts.join(' ').trim();


        district =
          firstResult.city ||
          '';
      }

      updateDraft({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address || 'Dirección no disponible',
        place: district || draft.place,
      });

      router.back();
    } catch (error) {
      console.log('Error obteniendo dirección:', error);
      Alert.alert('Error', 'No se pudo obtener la dirección de esa ubicación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona la ubicación</Text>
      <Text style={styles.subtitle}>Toca el mapa donde ocurrió el incidente</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation?.latitude ?? -12.09,
          longitude: selectedLocation?.longitude ?? -77.04,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title="Ubicación seleccionada" />
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.button, !selectedLocation && styles.buttonDisabled]}
        onPress={handleConfirmLocation}
        disabled={!selectedLocation}
      >
        <Text style={styles.buttonText}>Confirmar ubicación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#555',
  },
  map: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});