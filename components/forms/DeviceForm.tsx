import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { RadioGroup } from '@/components/RadioGroup';

export const DeviceForm = () => {
  const [type, setType] = useState<'solar-pv' | 'solar-pv-export' | 'battery' | 'grid'>('solar-pv');
  const [calculationType, setCalculationType] = useState<'difference' | 'sum'>('difference');

  useEffect(() => {
    if (type === 'solar-pv') {
      setCalculationType('sum');
    }
  }, [type]);

  return (
    <View>
      {/* ...existing form fields... */}
      
      {type === 'solar-pv' && (
        <View className="mt-4">
          <Text className="font-medium mb-2">Berechnungsmethode</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Für Solar PV wird die Summe der Einträge verwendet.
          </Text>
        </View>
      )}

      {type === 'solar-pv-export' && (
        <View className="mt-4">
          <Text className="font-medium mb-2">Berechnungsmethode</Text>
          <RadioGroup
            value={calculationType}
            onChange={setCalculationType}
            options={[
              { label: 'Differenz zwischen Ablesungen', value: 'difference' },
              { label: 'Summe der Einträge', value: 'sum' }
            ]}
          />
          <Text className="text-sm text-gray-600 mt-1">
            Bestimmt wie die Zählerstände berechnet werden sollen
          </Text>
        </View>
      )}
      
      {/* ...rest of form... */}
    </View>
  );
};