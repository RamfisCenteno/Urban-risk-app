import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
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


export default function ListScreen() {
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error cargando incidentes:', error);
      return;
    }

    setIncidents(data || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de reportes</Text>


      {loading && incidents.length === 0 ? (
        <Text style={styles.helperText}>Cargando reportes...</Text>
      ) : incidents.length === 0 ? (
        <Text style={styles.helperText}>Aún no hay reportes registrados.</Text>
      ) : (

        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.description}</Text>
              <Text style={styles.cardMeta}>Tipo: {item.incident_type}</Text>
              <Text style={styles.cardMeta}>Lugar: {item.place}</Text>
              <Text style={styles.cardMeta}>Gravedad: {item.severity}</Text>
              <Text style={styles.cardMeta}>Fecha: {formatDate(item.created_at)}</Text>
            </View>
          )}
        />
 
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#ddd' },
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  cardText: { fontSize: 14, marginBottom: 8 },
  cardMeta: { fontSize: 13, color: '#555' },
  helperText: {
  fontSize: 15,
  color: '#666',
  marginTop: 12,
},
});