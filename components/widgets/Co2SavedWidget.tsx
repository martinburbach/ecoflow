import { useApp } from '@/contexts/AppContext';

export const Co2SavedWidget = () => {
  const { energyStats } = useApp();
  const co2Saved = energyStats?.monthly?.co2Saved ?? 0;
  const kmEquivalent = energyStats?.monthly?.kmEquivalent ?? 0;

  return (
    <Widget
      title="CO2 diesen Monat eingespart" 
      value={`${co2Saved.toFixed(1)} kg`}
      subtitle={`entspricht ${Math.round(kmEquivalent)} km Autofahrt`}
    />
  );
};
