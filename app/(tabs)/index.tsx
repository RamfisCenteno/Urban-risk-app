import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
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

type DateRangeFilter = 'all' | 'week' | 'month' | '3months' | 'year';
type FilterKey = 'incidentType' | 'severity' | 'dateRange';

type FilterOption = {
  label: string;
  value: string;
};

type Filters = {
  incidentType: string;
  severity: string;
  dateRange: DateRangeFilter;
};

const DATE_OPTIONS: FilterOption[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Último año', value: 'year' },
];

function getStartDate(range: DateRangeFilter): Date | null {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7);
      return start;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      return start;
    case '3months':
      start.setMonth(now.getMonth() - 3);
      return start;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      return start;
    case 'all':
    default:
      return null;
  }
}

function getSelectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label || 'Todo';
}


const normalizeText = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();


export default function MapScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    incidentType: 'all',
    severity: 'all',
    dateRange: 'all',
  });

  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

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

  const incidentTypeOptions = useMemo<FilterOption[]>(() => {
    const uniqueTypes = [...new Set(incidents.map((item) => item.incident_type).filter(Boolean))];
    return [
      { label: 'Todo', value: 'all' },
      ...uniqueTypes.map((type) => ({
        label: type,
        value: type,
      })),
    ];
  }, [incidents]);

  const severityOptions = useMemo<FilterOption[]>(() => {
      const uniqueSeverities = [...new Set(incidents.map((item) => item.severity).filter(Boolean))];

      return [
        { label: 'Todo', value: 'all' },
        ...uniqueSeverities.map((severity) => ({
          label: severity,
          value: severity,
        })),
      ];
    }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const startDate = getStartDate(filters.dateRange);

    return incidents.filter((incident) => {
      const incidentType = normalizeText(incident.incident_type);
      const incidentSeverity = normalizeText(incident.severity);
      const selectedType = normalizeText(filters.incidentType);
      const selectedSeverity = normalizeText(filters.severity);

      const matchesType =
        selectedType === 'all' || incidentType === selectedType;

      const matchesSeverity =
        selectedSeverity === 'all' || incidentSeverity === selectedSeverity;

      const createdAt = new Date(incident.created_at);
      const matchesDate = !startDate || createdAt >= startDate;

      return matchesType && matchesSeverity && matchesDate;
    });
  }, [incidents, filters]);

  const currentOptions =
    openFilter === 'incidentType'
      ? incidentTypeOptions
      : openFilter === 'severity'
      ? severityOptions
      : DATE_OPTIONS;

  const handleSelectOption = (value: string) => {
    if (!openFilter) return;

    setFilters((prev) => ({
      ...prev,
      [openFilter]: value,
    }));

    setOpenFilter(null);
  };

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
        {filteredIncidents.map((incident) => (
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

 <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setOpenFilter('incidentType')}
          >
            <Text style={styles.filterTitle}>Tipo</Text>
            <Text style={styles.filterValue}>
              {getSelectedLabel(incidentTypeOptions, filters.incidentType)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setOpenFilter('severity')}
          >
            <Text style={styles.filterTitle}>Gravedad</Text>
            <Text style={styles.filterValue}>
              {getSelectedLabel(severityOptions, filters.severity)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setOpenFilter('dateRange')}
          >
            <Text style={styles.filterTitle}>Fecha</Text>
            <Text style={styles.filterValue}>
              {getSelectedLabel(DATE_OPTIONS, filters.dateRange)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        onPress={fetchIncidents}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Text>
      </TouchableOpacity>


      {!loading && filteredIncidents.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {incidents.length === 0
              ? 'Aún no hay reportes para mostrar.'
              : 'No hay reportes con los filtros elegidos.'}
          </Text>
        </View>
      )}

  <Modal
        visible={openFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenFilter(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpenFilter(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {openFilter === 'incidentType'
                ? 'Selecciona un tipo'
                : openFilter === 'severity'
                ? 'Selecciona una gravedad'
                : 'Selecciona una fecha'}
            </Text>

            {currentOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionButton}
                onPress={() => handleSelectOption(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setOpenFilter(null)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  filtersContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  filtersRow: {
    paddingRight: 8,
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 110,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  filterValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    position: 'absolute',
    top: 78,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  optionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
  },
  closeButton: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});