import { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';

type Incident = {
  id: number;
  title: string;
  description: string | null;
  incident_type: string;
  severity: string;
  place: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

export default function MapScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error cargando incidentes en mapa:', error);
      setLoading(false);
      return;
    }

    setIncidents(data || []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
    }, [])
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -12.09,
          longitude: -77.04,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            title={incident.title}
            description={incident.description || 'Sin descripción'}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        onPress={fetchIncidents}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Text>
      </TouchableOpacity>

      {!loading && incidents.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aún no hay reportes para mostrar.</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  emptyText: {
    color: '#fff',
    fontSize: 14,
  },
});