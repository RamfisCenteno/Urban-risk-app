import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useReportDraft } from '../../context/report-draft-context';
import { useState } from 'react';
import { getOrCreateReporterId } from '../../utils/reporter-id';


const INCIDENT_OPTIONS = [
  'Robo',
  'Intento de robo',
  'Acoso',
  'Violencia',
  'Actividad sospechosa',
  'Zona insegura',
];

const SEVERITY_OPTIONS = [
  'Alto',
  'Medio',
  'Bajo',
];

export default function ReportScreen() {
  const { draft, updateDraft, resetDraft } = useReportDraft();
  const [loading, setLoading] = useState(false);
  const [showIncidentOptions, setShowIncidentOptions] = useState(false);
  const [showSeverityOptions, setshowSeverityOptions] = useState(false);

  const handleSubmit = async () => {
    if (
      !draft.incidentType.trim() ||
      !draft.severity.trim() ||
      !draft.place.trim()
    ) {
      Alert.alert('Faltan datos', 'Completa tipo, gravedad y lugar.');
      return;
    }

    if (draft.latitude === null || draft.longitude === null) {
      Alert.alert('Falta ubicación', 'Selecciona la ubicación en el mapa.');
      return;
    }

    setLoading(true);

    const title = `Reporte de ${draft.incidentType.trim()}`;
    const reporterId = await getOrCreateReporterId();


    const { error } = await supabase.from('incidents').insert([
      {
        title,
        description: draft.description.trim() || null,
        incident_type: draft.incidentType.trim(),
        severity: draft.severity.trim(),
        place: draft.place.trim(),
        address: draft.address || null,
        latitude: draft.latitude,
        longitude: draft.longitude,
        reporter_id : reporterId, 
      },
    ]);

    setLoading(false);

    if (error) {
      console.log('Error insertando incidente:', error);
      Alert.alert('Error', 'No se pudo guardar el reporte.');
      return;
    }

    Alert.alert('Éxito', 'Reporte guardado correctamente.');
    resetDraft();
  };

  const handleGoToMap = () => {
    router.push('/select-location');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reportar incidente</Text>

    <Text style={styles.label}>Tipo de incidente</Text>

    <TouchableOpacity
      style={styles.dropdownButton}
      onPress={() => setShowIncidentOptions(!showIncidentOptions)}
    >
      <Text
        style={[
          styles.dropdownButtonText,
          !draft.incidentType && styles.dropdownPlaceholder,
        ]}
      >
        {draft.incidentType || 'Selecciona un tipo de incidente'}
      </Text>
      <Text style={styles.dropdownArrow}>{showIncidentOptions ? '▲' : '▼'}</Text>
    </TouchableOpacity>

    {showIncidentOptions && (
      <View style={styles.dropdownList}>
        {INCIDENT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.dropdownItem}
            onPress={() => {
              updateDraft({ incidentType: option });
              setShowIncidentOptions(false);
            }}
          >
            <Text style={styles.dropdownItemText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe brevemente lo ocurrido"
        value={draft.description}
        onChangeText={(text) => updateDraft({ description: text })}
        multiline
      />

      <Text style={styles.label}>Gravedad</Text>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setshowSeverityOptions(!showSeverityOptions)}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !draft.severity && styles.dropdownPlaceholder,
          ]}
        >
          {draft.severity || 'Selecciona la gravedad del evento'}
        </Text>
        <Text style={styles.dropdownArrow}>{showSeverityOptions ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showSeverityOptions && (
        <View style={styles.dropdownList}>
          {SEVERITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                updateDraft({ severity: option });
                setshowSeverityOptions(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

    <Text style={styles.label}>Distrito</Text>
      <View style={styles.readOnlyBox}>
        <Text
          style={draft.place ? styles.readOnlyText : styles.readOnlyPlaceholder}
        >
          {draft.place || 'Se completará automáticamente al elegir ubicación'}
        </Text>
      </View>


      <Text style={styles.label}>Ubicación en mapa</Text>
      <TouchableOpacity style={styles.mapButton} onPress={handleGoToMap}>
        <Text style={styles.mapButtonText}>Elegir ubicación en mapa</Text>
      </TouchableOpacity>

      <View style={styles.locationBox}>
        {draft.latitude !== null && draft.longitude !== null ? (
          <>
            <Text style={styles.locationText}>
              Dirección: {draft.address || 'Dirección no disponible'}
            </Text>
            <Text style={styles.locationText}>
              Distrito: {draft.place || 'No detectado'}
            </Text>
          </>
        ) : (
          <Text style={styles.locationPlaceholder}>
            Aún no has seleccionado una ubicación
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Enviar reporte'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 20,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mapButton: {
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#1f6feb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  locationPlaceholder: {
    fontSize: 14,
    color: '#777',
  },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#f3f4f6',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#111827',
  },
  readOnlyPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#6b7280',
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
});