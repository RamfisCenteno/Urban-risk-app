import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

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



const INITIAL_FILTERS: Filters = {
  incidentType: 'all',
  severity: 'all',
  dateRange: 'all',
  ownOnly: false,
};


const DATE_OPTIONS: FilterOption[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Último año', value: 'year' },
];

const normalizeText = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();

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
    default:
      return null;
  }
}

function getSelectedLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label || 'Todo';
}


export default function ListScreen() {
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentReporterId, setCurrentReporterId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);


  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);



  useEffect(() => {
    const loadData = async () => {
      const reporterId = await getOrCreateReporterId();
      setCurrentReporterId(reporterId);
      await fetchIncidents();
    };

    loadData();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error cargando incidentes:', error);
      setLoading(false);
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

  const handleDelete = (incidentId: number) => {
    Alert.alert(
      'Eliminar reporte',
      '¿Seguro que quieres borrar este reporte?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('incidents')
              .delete()
              .eq('id', incidentId);

            if (error) {
              console.log('Error borrando incidente:', error);
              Alert.alert('Error', 'No se pudo borrar el reporte.');
              return;
            }

            await fetchIncidents();
          },
        },
      ]
    );
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

  const incidentTypeOptions: FilterOption[] = [
    { label: 'Todo', value: 'all' },
    ...[...new Set(incidents.map((item) => item.incident_type).filter(Boolean))].map(
      (type) => ({
        label: type,
        value: type,
      })
    ),
  ];

  const severityOptions: FilterOption[] = [
    { label: 'Todo', value: 'all' },
    ...[...new Set(incidents.map((item) => item.severity).filter(Boolean))].map(
      (severity) => ({
        label: severity,
        value: severity,
      })
    ),
  ];

  const filteredIncidents = incidents.filter((incident) => {
    const startDate = getStartDate(filters.dateRange);

    const matchesType =
      normalizeText(filters.incidentType) === 'all' ||
      normalizeText(incident.incident_type) === normalizeText(filters.incidentType);

    const matchesSeverity =
      normalizeText(filters.severity) === 'all' ||
      normalizeText(incident.severity) === normalizeText(filters.severity);

    const matchesDate =
      !startDate || new Date(incident.created_at) >= startDate;

    const matchesOwnOnly =
      !filters.ownOnly || incident.reporter_id === currentReporterId;

    return matchesType && matchesSeverity && matchesDate && matchesOwnOnly;
  });

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

  const showFilters = !loading || incidents.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de reportes</Text>
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersRow}
        >

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setOpenFilter('incidentType')}
        >
          <Text style={styles.filterChipLabel}>Tipo · </Text>
          <Text style={styles.filterChipValue}>
            {getSelectedLabel(incidentTypeOptions, filters.incidentType)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setOpenFilter('severity')}
        >
          <Text style={styles.filterChipLabel}>Gravedad · </Text>
          <Text style={styles.filterChipValue}>
            {getSelectedLabel(severityOptions, filters.severity)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setOpenFilter('dateRange')}
        >
          <Text style={styles.filterChipLabel}>Fecha · </Text>
          <Text style={styles.filterChipValue}>
            {getSelectedLabel(DATE_OPTIONS, filters.dateRange)}
          </Text>
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
      )}
      {loading && filteredIncidents.length === 0 ? (
        <Text style={styles.helperText}>Cargando reportes...</Text>
      ) : filteredIncidents.length === 0 ? (
        <Text style={styles.helperText}>
          {incidents.length === 0
            ? 'Aún no hay reportes registrados.'
            : 'No hay reportes que coincidan con los filtros.'}
        </Text>
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => {
            const isOwnReport = item.reporter_id === currentReporterId;

            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                {isOwnReport && (
                  <Text style={styles.ownReportBadge}>Tu reporte</Text>
                )}

                {isOwnReport && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Borrar reporte</Text>
                  </TouchableOpacity>
                )}                

                <Text style={styles.cardText}>
                  {item.description || 'Sin descripción'}
                </Text>
                <Text style={styles.cardMeta}>Tipo: {item.incident_type}</Text>
                <Text style={styles.cardMeta}>Lugar: {item.place || 'No especificado'}</Text>
                <Text style={styles.cardMeta}>Gravedad: {item.severity}</Text>
                <Text style={styles.cardMeta}>Fecha: {formatDate(item.created_at)}</Text>
              </View>
            );
          }}
        />
      )}
      <Modal
        visible={openFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenFilter(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOpenFilter(null)}
        >
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
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ddd',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: '#555',
  },
  ownReportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
  },
  deleteButton: {
  alignSelf: 'flex-start',
  backgroundColor: '#fee2e2',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginBottom: 10,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
  },
  filtersRow: {
    gap: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 40,
  },
filterChipActive: {
  backgroundColor: '#dbeafe',
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
filterChipValueActive: {
  color: '#1d4ed8',
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
filtersScroll: {
  maxHeight: 56,
  marginBottom: 12,
},
clearFilterChip: {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'center',
  backgroundColor: '#111827',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 20,
  minHeight: 40,
},
clearFilterChipText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#fff',
},
});
