import { useMemo } from 'react';
import { View } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { Widget } from '@/components/ui/Widget';

export const LastMonthConsumption = () => {
  const { meterReadings } = useApp();
  
  const lastMonthConsumption = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    return meterReadings
      .filter(reading => {
        const readingDate = new Date(reading.timestamp);
        return readingDate.getMonth() === lastMonth.getMonth() &&
               readingDate.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((total, reading) => total + reading.reading, 0);
  }, [meterReadings]);

  return (
    <Widget
      title="Verbrauch letzter Monat" 
      value={`${lastMonthConsumption.toFixed(1)} kWh`}
    />
  );
};
