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
import MapView, { Marker, Heatmap } from 'react-native-maps';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { getOrCreateReporterId } from '../../utils/reporter-id';



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
  reporter_id: string | null;
};

type DateRangeFilter = 'all' | 'week' | 'month' | '3months' | 'year';
type FilterKey = 'incidentType' | 'severity' | 'dateRange';
type MapMode = 'points' | 'heatmap';

type FilterOption = {
  label: string;
  value: string;
};

type Filters = {
  incidentType: string;
  severity: string;
  dateRange: DateRangeFilter;
  ownOnly: boolean;
};

const DATE_OPTIONS: FilterOption[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Último año', value: 'year' },
];

const LEGEND_ITEMS = [
  'Robo',
  'Intento de robo',
  'Acoso',
  'Violencia',
  'Actividad sospechosa',
  'Zona insegura',
];


const INITIAL_FILTERS: Filters = {
  incidentType: 'all',
  severity: 'all',
  dateRange: 'all',
  ownOnly: false,
};



const normalizeText = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();

function getStartDate(range: DateRangeFilter): Date | null {
  const now = new Date();
  const start = new Date(now);
  switch (range) {
    case 'week': start.setDate(now.getDate() - 7); return start;
    case 'month': start.setMonth(now.getMonth() - 1); return start;
    case '3months': start.setMonth(now.getMonth() - 3); return start;
    case 'year': start.setFullYear(now.getFullYear() - 1); return start;
    default: return null;
  }
}

function getSelectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label || 'Todo';
}

function getIncidentColor(type: string) {
  switch (normalizeText(type)) {
    case 'robo': return '#ef4444';
    case 'intento de robo': return '#f97316';
    case 'acoso': return '#a855f7';
    case 'violencia': return '#111827';
    case 'actividad sospechosa': return '#eab308';
    case 'zona insegura': return '#2563eb';
    default: return '#6b7280';
  }
}

function buildHeatmapGradient(selectedType: string) {
  if (normalizeText(selectedType) === 'all') {
    return { colors: ['#93c5fd', '#3b82f6', '#1d4ed8'], startPoints: [0.2, 0.6, 1], colorMapSize: 256 };
  }
  const color = getIncidentColor(selectedType);
  return { colors: ['#ffffff00', color, color], startPoints: [0.2, 0.6, 1], colorMapSize: 256 };
}

export default function MapScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('points');
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [currentReporterId, setCurrentReporterId] = useState<string | null>(null);


  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.log('Error cargando incidentes:', error); setLoading(false); return; }
    setIncidents(data || []);
    setLoading(false);
  };

  useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      const reporterId = await getOrCreateReporterId();
      setCurrentReporterId(reporterId);
      await fetchIncidents();
    };

    loadData();
  }, [])
);

  const incidentTypeOptions = useMemo<FilterOption[]>(() => {
    const uniqueTypes = [...new Set(incidents.map((i) => i.incident_type).filter(Boolean))];
    return [{ label: 'Todo', value: 'all' }, ...uniqueTypes.map((t) => ({ label: t, value: t }))];
  }, [incidents]);

  const severityOptions = useMemo<FilterOption[]>(() => {
    const uniqueSeverities = [...new Set(incidents.map((i) => i.severity).filter(Boolean))];
    return [{ label: 'Todo', value: 'all' }, ...uniqueSeverities.map((s) => ({ label: s, value: s }))];
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const startDate = getStartDate(filters.dateRange);
    return incidents.filter((incident) => {
      const matchesType = normalizeText(filters.incidentType) === 'all' || normalizeText(incident.incident_type) === normalizeText(filters.incidentType);
      const matchesSeverity = normalizeText(filters.severity) === 'all' || normalizeText(incident.severity) === normalizeText(filters.severity);
      const matchesDate = !startDate || new Date(incident.created_at) >= startDate;
      const matchesOwnOnly =
        !filters.ownOnly || incident.reporter_id === currentReporterId;

      return matchesType && matchesSeverity && matchesDate && matchesOwnOnly;

    });
  }, [incidents, filters, currentReporterId]);

  const heatmapPoints = useMemo(() =>
    filteredIncidents.map((i) => ({ latitude: i.latitude, longitude: i.longitude, weight: 1 })),
  [filteredIncidents]);

  const currentOptions =
    openFilter === 'incidentType' ? incidentTypeOptions :
    openFilter === 'severity' ? severityOptions : DATE_OPTIONS;

  const handleSelectOption = (value: string) => {
    if (!openFilter) return;
    setFilters((prev) => ({ ...prev, [openFilter]: value }));
    setOpenFilter(null);
  };

  return (
    <View style={styles.container}>

      {/* ── BARRA DE FILTROS (arriba) ── */}
      <View style={styles.filtersContainer}>

        {/* Fila superior: toggle + botón actualizar */}
        <View style={styles.filterTopRow}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleOption, mapMode === 'points' && styles.toggleOptionActive]}
              onPress={() => setMapMode('points')}
            >
              <Text style={[styles.toggleText, mapMode === 'points' && styles.toggleTextActive]}>Puntos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, mapMode === 'heatmap' && styles.toggleOptionActive]}
              onPress={() => setMapMode('heatmap')}
            >
              <Text style={[styles.toggleText, mapMode === 'heatmap' && styles.toggleTextActive]}>Calor</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
            onPress={fetchIncidents}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>{loading ? 'Actualizando...' : 'Actualizar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          <TouchableOpacity style={styles.filterChip} onPress={() => setOpenFilter('incidentType')}>
            <Text style={styles.filterChipLabel}>Tipo · </Text>
            <Text style={styles.filterChipValue}>{getSelectedLabel(incidentTypeOptions, filters.incidentType)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterChip} onPress={() => setOpenFilter('severity')}>
            <Text style={styles.filterChipLabel}>Gravedad · </Text>
            <Text style={styles.filterChipValue}>{getSelectedLabel(severityOptions, filters.severity)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterChip} onPress={() => setOpenFilter('dateRange')}>
            <Text style={styles.filterChipLabel}>Fecha · </Text>
            <Text style={styles.filterChipValue}>{getSelectedLabel(DATE_OPTIONS, filters.dateRange)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filters.ownOnly && styles.filterChipActive,
            ]}
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                ownOnly: !prev.ownOnly,
              }))
            }
          >
            <Text
              style={[
                styles.filterChipValue,
                filters.ownOnly && styles.filterChipValueActive,
              ]}
            >
              Mis reportes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearFilterChip}
            onPress={() => setFilters(INITIAL_FILTERS)}
          >
            <Text style={styles.clearFilterChipText}>Limpiar</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* ── MAPA (abajo, ocupa el resto) ── */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{ latitude: -12.09, longitude: -77.04, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        >
          {mapMode === 'points' && filteredIncidents.map((incident) => (
            <Marker
              key={incident.id}
              coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
              title={incident.incident_type}
            >
              <View style={[styles.dotMarker, { backgroundColor: getIncidentColor(incident.incident_type) }]} />
            </Marker>
          ))}

          {mapMode === 'heatmap' && heatmapPoints.length > 0 && (
            <Heatmap points={heatmapPoints} radius={10} opacity={0.5} gradient={buildHeatmapGradient(filters.incidentType)} />
          )}
        </MapView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendContent}
          style={styles.legendWrapper}
        >
          {LEGEND_ITEMS.map((item) => (
            <View key={item} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: getIncidentColor(item) },
                ]}
              />
              <Text style={styles.legendText}>{item}</Text>
            </View>
          ))}
        </ScrollView>

        {!loading && filteredIncidents.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {incidents.length === 0 ? 'Aún no hay reportes para mostrar.' : 'No hay reportes con los filtros elegidos.'}
            </Text>
          </View>
        )}
      </View>

      {/* ── MODAL DE FILTROS ── */}
      <Modal visible={openFilter !== null} transparent animationType="fade" onRequestClose={() => setOpenFilter(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpenFilter(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {openFilter === 'incidentType' ? 'Selecciona un tipo' :
               openFilter === 'severity' ? 'Selecciona una gravedad' : 'Selecciona una fecha'}
            </Text>
            {currentOptions.map((option) => (
              <TouchableOpacity key={option.value} style={styles.optionButton} onPress={() => handleSelectOption(option.value)}>
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setOpenFilter(null)}>
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
    flexDirection: 'column',
  },

  // ── Filtros ──
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    elevation: 4,
  },
  filterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 3,
  },
  toggleOption: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  toggleOptionActive: {
    backgroundColor: '#111827',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  filtersRow: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterChipLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterChipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Mapa ──
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  dotMarker: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyBox: {
    position: 'absolute',
    bottom: 84,
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

  // ── Modal ──
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
  filterChipActive: {
    backgroundColor: '#dbeafe',
  },
  filterChipValueActive: {
    color: '#1d4ed8',
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  clearFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  legendWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    maxHeight: 52,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: 16,
  },
  legendContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },
  legendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

});