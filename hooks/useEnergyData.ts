import { useState, useEffect } from 'react';
import { EnergyData, EnergyStats, MeterReading, EnergyProvider, Device } from '@/types/energy';
import { calculateEnergyStats, calculateCurrentEnergyData, calculateDetailedCosts } from '@/utils/energyCalculations';

export function useEnergyData(
  meterReadings: MeterReading[] = [],
  energyProviders: EnergyProvider[] = [],
  devices: Device[] = []
) {
  const [currentData, setCurrentData] = useState<EnergyData | null>(null);
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate real energy data from meter readings
  useEffect(() => {
    if (meterReadings.length > 0) {
      try {
        console.log('useEnergyData: Calculating energy data...');
        console.log('useEnergyData: Meter Readings:', JSON.stringify(meterReadings, null, 2));
        console.log('useEnergyData: Energy Providers:', JSON.stringify(energyProviders, null, 2));
        
        // Calculate current energy data
        const calculatedCurrentData = calculateCurrentEnergyData(meterReadings);
        setCurrentData(calculatedCurrentData);
        
        // These stats are actually redundant if detailed costs are used below,
        // but we keep them for now and calculate them correctly.
        const dailyStats = calculateEnergyStats(meterReadings, 'daily', devices, energyProviders);
        const weeklyStats = calculateEnergyStats(meterReadings, 'weekly', devices, energyProviders);
        const monthlyStats = calculateEnergyStats(meterReadings, 'monthly', devices, energyProviders);
        
        // Use detailed cost calculations with real energy providers
        const dailyCosts = calculateDetailedCosts(meterReadings, energyProviders, 'daily', devices);
        const weeklyCosts = calculateDetailedCosts(meterReadings, energyProviders, 'weekly', devices);
        const monthlyCosts = calculateDetailedCosts(meterReadings, energyProviders, 'monthly', devices);
        const totalProduction = calculateTotalProduction(meterReadings);
        
        const calculatedStats: EnergyStats = {
          daily: dailyCosts,
          weekly: weeklyCosts,
          monthly: monthlyCosts,
          totalProduction,
        };
        
        setStats(calculatedStats);
        setError(null);
        
        console.log('Energy calculations completed:', {
          currentData: calculatedCurrentData,
          dailyStats: calculatedStats.daily,
          weeklyStats: calculatedStats.weekly,
          monthlyStats: calculatedStats.monthly
        });
      } catch (err) {
        console.error('Error calculating energy data:', err);
        setError('Fehler bei der Berechnung der Energiedaten');
      }
    } else {
      // No meter readings available - set empty data
      setCurrentData({
        timestamp: new Date(),
        solarProduction: 0,
        consumption: 0,
        batteryLevel: 0,
        batteryCharging: false,
        gridFeedIn: 0,
        gridConsumption: 0,
      });
      
      setStats({
        daily: {
          production: 0,
          consumption: 0,
          savings: 0,
          co2Saved: 0,
          autarky: 0,
          selfConsumption: 0,
        },
        weekly: {
          production: 0,
          consumption: 0,
          savings: 0,
          co2Saved: 0,
          autarky: 0,
          selfConsumption: 0,
        },
        monthly: {
          production: 0,
          consumption: 0,
          savings: 0,
          co2Saved: 0,
          autarky: 0,
          selfConsumption: 0,
        },
      });
    }
  }, [meterReadings, energyProviders]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate data refresh - in real app this would fetch from connected devices
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recalculate with current meter readings
      if (meterReadings.length > 0) {
        const calculatedCurrentData = calculateCurrentEnergyData(meterReadings);
        setCurrentData({
          ...calculatedCurrentData,
          timestamp: new Date(),
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Fehler beim Aktualisieren der Energiedaten');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentData,
    stats,
    isLoading,
    error,
    refreshData,
  };
}