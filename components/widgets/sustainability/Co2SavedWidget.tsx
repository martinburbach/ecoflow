import { useApp } from '@/contexts/AppContext';
import { View, Text } from 'react-native';

export const Co2SavedWidget = () => {
  const { energyStats } = useApp();
  const co2Saved = energyStats?.monthly?.co2Saved ?? 0;
  const kmEquivalent = energyStats?.monthly?.kmEquivalent ?? 0;

  return (
    <View className="bg-white rounded-xl p-4 shadow">
      <Text className="text-lg font-semibold">CO2 Einsparung</Text>
      <Text className="text-2xl font-bold">{co2Saved.toFixed(1)} kg</Text>
      <Text className="text-sm text-gray-600">
        entspricht {Math.round(kmEquivalent)} km Autofahrt
      </Text>
    </View>
  );
};
