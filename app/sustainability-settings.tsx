import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/constants/languages';

export default function SustainabilitySettingsScreen() {
  const { sustainabilityGoals, updateSustainabilityGoals, language } = useApp();
  const { colors } = useTheme();
  const t = useTranslation(language);

  const [monthlyCo2Goal, setMonthlyCo2Goal] = useState(sustainabilityGoals.monthlyCo2Goal.toString());
  const [energySaverGoal, setEnergySaverGoal] = useState(sustainabilityGoals.energySaverGoal.toString());
  const [solarPioneerGoal, setSolarPioneerGoal] = useState(sustainabilityGoals.solarPioneerGoal.toString());
  const [sustainabilityChampionGoal, setSustainabilityChampionGoal] = useState(sustainabilityGoals.sustainabilityChampionGoal.toString());

  const handleSave = () => {
    updateSustainabilityGoals({
      monthlyCo2Goal: parseInt(monthlyCo2Goal, 10),
      energySaverGoal: parseInt(energySaverGoal, 10),
      solarPioneerGoal: parseInt(solarPioneerGoal, 10),
      sustainabilityChampionGoal: parseInt(sustainabilityChampionGoal, 10),
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.monthlyGoal}</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={monthlyCo2Goal}
              onChangeText={setMonthlyCo2Goal}
              keyboardType="numeric"
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>kg CO₂</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.energySaver}</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={energySaverGoal}
              onChangeText={setEnergySaverGoal}
              keyboardType="numeric"
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>kg CO₂</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.solarPioneer}</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={solarPioneerGoal}
              onChangeText={setSolarPioneerGoal}
              keyboardType="numeric"
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>kWh</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.sustainabilityChampion}</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={sustainabilityChampionGoal}
              onChangeText={setSustainabilityChampionGoal}
              keyboardType="numeric"
            />
            <Text style={[styles.unit, { color: colors.textSecondary }]}>€</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t.save}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  unit: {
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});