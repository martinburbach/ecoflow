import { 
  MeterReading, 
  Device, 
  Period, 
  DetailedCosts, 
  SustainabilityGoals,
  EnergyProvider,
  EnergyData
} from '@/types/energy';

// Helper function to calculate total consumption/production for a given period
export const calculateTotalForPeriod = (
  allReadings: MeterReading[],
  startDate: Date,
  endDate: Date,
  meterTypes: string[]
): { total: number; readingCount: number } => {
  const readingsForTypes = (allReadings || []).filter(r => meterTypes.includes(r.type as any));
  const meterIds = [...new Set(readingsForTypes.map(r => r.meterId))];
  let total = 0;
  let readingCount = 0;

  for (const meterId of meterIds) {
    const readingsForMeter = (allReadings || [])
      .filter(r => r.meterId === meterId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (readingsForMeter.length < 1) continue;

    const periodReadings = readingsForMeter.filter(r => {
      const readingDate = new Date(r.timestamp);
      return readingDate >= startDate && readingDate <= endDate;
    });

    if (periodReadings.length === 0) continue;

    readingCount += periodReadings.length;

    const isProductionMeter = meterTypes.includes('production') || meterTypes.includes('solar') || meterTypes.includes('grid_feed_in');

    if (isProductionMeter) {
        const lastReadingInPeriod = periodReadings[periodReadings.length - 1];
        const lastValue = lastReadingInPeriod.reading ?? (lastReadingInPeriod as any).value ?? 0;

        const previousReading = readingsForMeter
            .filter(r => new Date(r.timestamp) < startDate)
            .pop();

        if (previousReading) {
            const previousValue = previousReading.reading ?? (previousReading as any).value ?? 0;
            total += lastValue - previousValue;
        } else {
            // This is the first reading for this meter, so calculate the difference within the period.
            const firstReadingInPeriod = periodReadings[0];
            const firstValue = firstReadingInPeriod.reading ?? (firstReadingInPeriod as any).value ?? 0;
            total += lastValue - firstValue;
        }
    } else {
        // For consumption meters, calculate the delta between the last reading in the period
        // and the last reading before the period.
        const lastReadingInPeriod = periodReadings[periodReadings.length - 1];
        const lastValue = lastReadingInPeriod.reading ?? (lastReadingInPeriod as any).value ?? 0;

        const previousReading = readingsForMeter
            .filter(r => new Date(r.timestamp) < startDate)
            .pop();

        if (previousReading) {
            const previousValue = previousReading.reading ?? (previousReading as any).value ?? 0;
            total += lastValue - previousValue;
        } else {
            // No reading before the period, so calculate consumption within the period.
            const firstReadingInPeriod = periodReadings[0];
            const firstValue = firstReadingInPeriod.reading ?? (firstReadingInPeriod as any).value ?? 0;
            total += lastValue - firstValue;
        }
    }
  }

  return { total, readingCount };
};

export const calculateProduction = (
  readings: MeterReading[],
  devices: Device[],
  startDate: Date,
  endDate: Date
): number => {
  let totalProduction = 0;
  const solarDevices = (devices || []).filter(d =>
    (d.type === 'meter' && ((d as any).meterType === 'solar-pv' || (d as any).meterType === 'solar-pv-export')) ||
    d.type === 'solar-pv' ||
    d.type === 'solar-pv-export'
  );

  solarDevices.forEach(device => {
    const deviceReadings = (readings || [])
      .filter(r => r.deviceId === device.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (deviceReadings.length === 0) {
      return;
    }

    if (device.calculationType === 'sum') {
      const periodReadings = deviceReadings.filter(r => {
        const readingDate = new Date(r.timestamp);
        return readingDate >= startDate && readingDate <= endDate;
      });
      const deviceProduction = periodReadings.reduce((acc, r) => acc + r.reading, 0);
      totalProduction += deviceProduction;
    } else { // 'difference' or undefined
      const lastReadingInPeriod = deviceReadings.filter(r => new Date(r.timestamp) <= endDate).pop();
      
      if (!lastReadingInPeriod) return;

      const firstReadingForPeriod = deviceReadings.filter(r => new Date(r.timestamp) < startDate).pop();

      if (firstReadingForPeriod) {
        totalProduction += (lastReadingInPeriod.reading - firstReadingForPeriod.reading);
      } else {
        const firstReadingInPeriod = deviceReadings.filter(r => new Date(r.timestamp) >= startDate).shift();
        if (firstReadingInPeriod) {
            totalProduction += (lastReadingInPeriod.reading - firstReadingInPeriod.reading);
        }
      }
    }
  });

  return totalProduction;
}

export const calculateDailyStats = (meterReadings: MeterReading[]) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const consumptionResult = calculateTotalForPeriod(meterReadings, startOfDay, endOfDay, ['electricity', 'gas', 'water']);
  const productionResult = calculateTotalForPeriod(meterReadings, startOfDay, endOfDay, ['production', 'solar', 'grid_feed_in']);

  return {
    consumption: consumptionResult.total,
    production: productionResult.total,
    consumptionReadings: consumptionResult.readingCount,
    productionReadings: productionResult.readingCount,
    startDate: startOfDay,
  };
};

export const calculateWeeklyStats = (meterReadings: MeterReading[]) => {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const consumptionResult = calculateTotalForPeriod(meterReadings, startOfWeek, endOfWeek, ['electricity', 'gas', 'water']);
  const productionResult = calculateTotalForPeriod(meterReadings, startOfWeek, endOfWeek, ['production', 'solar', 'grid_feed_in']);

  return {
    consumption: consumptionResult.total,
    production: productionResult.total,
    consumptionReadings: consumptionResult.readingCount,
    productionReadings: productionResult.readingCount,
    startDate: startOfWeek,
  };
};

export const calculateMonthlyStats = (meterReadings: MeterReading[]) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const consumptionResult = calculateTotalForPeriod(meterReadings, startOfMonth, endOfMonth, ['electricity', 'gas', 'water']);
  const productionResult = calculateTotalForPeriod(meterReadings, startOfMonth, endOfMonth, ['production', 'solar', 'grid_feed_in']);

  return {
    consumption: consumptionResult.total,
    production: productionResult.total,
    consumptionReadings: consumptionResult.readingCount,
    productionReadings: productionResult.readingCount,
    startDate: startOfMonth,
  };
};

export const calculateEnergyStats = (
  readings: MeterReading[], 
  period: Period,
  devices: Device[],
  providers: EnergyProvider[],
  goals?: SustainabilityGoals
) => {
  const { startDate, endDate } = getPeriodDates(period);

  const production = calculateTotalForPeriod(readings, startDate, endDate, ['production', 'solar']).total;
  const consumption = calculateTotalForPeriod(readings, startDate, endDate, ['electricity']).total;
  const gridFeedIn = calculateTotalForPeriod(readings, startDate, endDate, ['grid_feed_in', 'solar_pv_feed_in']).total;

  const { autarky, selfConsumption, savings, co2Saved } = calculateAutarkyAndSavings(
    consumption,
    production,
    gridFeedIn,
    (providers || []).find(p => p.type === 'electricity')
  );

  const stats = {
    production,
    consumption,
    savings,
    co2Saved,
    autarky,
    selfConsumption,
    kmEquivalent: co2Saved * 6, // 6 km pro kg CO2
    treesEquivalent: co2Saved * 0.05, // 1 Baum = 20kg CO2/Jahr
    avoidedEmissions: co2Saved,
    monthlyProgress: 0,
    energySaverProgress: 0,
    solarPioneerProgress: 0,
    sustainabilityProgress: 0
  };

  // Ziele berechnen wenn verfügbar
  if (goals) {
    const { monthlyCo2Goal, energySaverGoal, solarPioneerGoal, sustainabilityChampionGoal } = goals;
    stats.monthlyProgress = (stats.co2Saved / (monthlyCo2Goal || 150)) * 100;
    stats.energySaverProgress = (stats.co2Saved / (energySaverGoal || 100)) * 100;
    stats.solarPioneerProgress = (stats.production / (solarPioneerGoal || 1000)) * 100;
    stats.sustainabilityProgress = (stats.savings / (sustainabilityChampionGoal || 1000)) * 100;
  }

  return stats;
};

export const getPeriodDates = (period: Period, date: Date = new Date()): { startDate: Date, endDate: Date } => {
  const now = date;
  let startDate: Date;
  let endDate: Date = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      const currentDay = now.getDay();
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }
  return { startDate, endDate };
}

export const calculateDetailedCosts = (
  meterReadings: MeterReading[],
  providers: EnergyProvider[],
  period: Period,
  devices: Device[],
  date: Date = new Date()
): DetailedCosts => {
  const { startDate, endDate } = getPeriodDates(period, date);

  const electricityConsumption = calculateTotalForPeriod(meterReadings, startDate, endDate, ['electricity']).total;
  const gasConsumption = calculateTotalForPeriod(meterReadings, startDate, endDate, ['gas']).total;
  const waterConsumption = calculateTotalForPeriod(meterReadings, startDate, endDate, ['water']).total;
  
  // Correctly calculate production and grid feed-in based on specific meter types
  const production = calculateTotalForPeriod(meterReadings, startDate, endDate, ['solar']).total;
  const gridFeedIn = calculateTotalForPeriod(meterReadings, startDate, endDate, ['grid_feed_in', 'solar_pv_feed_in']).total;

  const realConsumption = {
    electricity: electricityConsumption,
    gas: gasConsumption,
    water: waterConsumption,
  };

  const costs = {
    electricity: 0,
    gas: 0,
    water: 0,
    total: 0,
  };

  for (const type of ['electricity', 'gas', 'water'] as const) {
    const provider = (providers || []).find(p => p.type === type);
    if (provider) {
      const typeCost = realConsumption[type] * (provider.pricePerUnit || 0) + (provider.basicFee || 0);
      costs[type] = typeCost;
      costs.total += typeCost;
    }
  }

  const { autarky, selfConsumption, savings, co2Saved } = calculateAutarkyAndSavings(
    realConsumption.electricity,
    production,
    gridFeedIn,
    (providers || []).find(p => p.type === 'electricity')
  );

  return {
    costs,
    realConsumption,
    production,
    consumption: realConsumption.electricity + realConsumption.gas + realConsumption.water,
    autarky,
    selfConsumption,
    savings,
    co2Saved,
    gridFeedIn,
  };
};

export const calculateCurrentEnergyData = (readings: MeterReading[]): EnergyData => {
    if (!readings || readings.length === 0) {
        return {
            timestamp: new Date(),
            solarProduction: 0,
            consumption: 0,
            batteryLevel: 0,
            batteryCharging: false,
            gridFeedIn: 0,
            gridConsumption: 0,
        };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const calculateRate = (types: string[]): number => {
        const relevantReadings = (readings || [])
            .filter(r => types.includes(r.type as any) && new Date(r.timestamp) >= twentyFourHoursAgo)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (relevantReadings.length < 2) return 0;

        const first = relevantReadings[0];
        const last = relevantReadings[relevantReadings.length - 1];
        const valueDiff = ((last as any).value ?? last.reading ?? 0) - ((first as any).value ?? first.reading ?? 0);
        const timeDiffHours = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / (1000 * 60 * 60);

        if (timeDiffHours === 0) return 0;
        return valueDiff / timeDiffHours; // This gives an average power value (e.g., in kW if unit is kWh)
    };

    const consumption = calculateRate(['electricity']);
    const solarProduction = calculateRate(['production', 'solar', 'grid_feed_in']);
    const gridFeedIn = calculateRate(['grid_feed_in']);
    const gridConsumption = calculateRate(['grid_consumption']);

    return {
        timestamp: new Date(Math.max(...readings.map(r => new Date(r.timestamp).getTime()))),
        solarProduction,
        consumption,
        gridFeedIn,
        gridConsumption,
        // These are not available from meter readings
        batteryLevel: 0,
        batteryCharging: false,
    };
};

export const calculateAutarkyAndSavings = (
  consumption: number,
  production: number,
  gridFeedIn: number,
  electricityProvider?: EnergyProvider
) => {
  // directConsumption is the amount of solar energy that was used directly by the household
  const directConsumption = Math.max(0, production - gridFeedIn);
  
  const savings = directConsumption * (electricityProvider?.pricePerUnit || 0.3); // Savings from not buying this energy from the grid

  // Autarky: How much of your consumption was covered by your own production
  const autarky = consumption > 0 ? (directConsumption / consumption) * 100 : (production > 0 ? 100 : 0);

  // Self-consumption: How much of your production you consumed yourself
  const selfConsumption = production > 0 ? (directConsumption / production) * 100 : 0;

  const co2Factor = 0.4; // kg CO2 per kWh of produced energy
  const co2Saved = production * co2Factor;

  return {
    autarky: isNaN(autarky) ? 0 : autarky,
    selfConsumption: isNaN(selfConsumption) ? 0 : selfConsumption,
    savings,
    co2Saved,
  };
};

export const processEnergyData = (data: any): EnergyData => {
  return {
    timestamp: data.ts,
    solarProduction: data.power.total,
    gridFeedIn: data.power.toGrid,
    gridConsumption: data.power.fromGrid,
    batteryLevel: data.battery.soc,
    batteryCharging: data.battery.charge > 0,
    consumption: data.power.load,
  };
};

export const formatNumber = (num: number | null | undefined, decimalPlaces: number): string => {
  if (num === null || num === undefined || isNaN(num)) {
    const zero = 0;
    return zero.toFixed(decimalPlaces);
  }
  return num.toFixed(decimalPlaces);
};

export const parseGermanNumber = (str: string): number => {
    if (typeof str !== 'string') return NaN;
    // To handle cases like "1.234,56" and "1234,56"
    const cleanedStr = str.replace(/\./g, '').replace(',', '.');
    return Number(cleanedStr);
};

export const validateMeterReading = (reading: MeterReading, allReadings: MeterReading[]): { valid: boolean; error?: string; warning?: string } => {
    const value = (reading as any).value ?? reading.reading;
    if (value === null || value === undefined || isNaN(value)) {
        return { valid: false, error: 'Ungültiger Wert' };
    }

    // Find the reading immediately before the one being validated
    const previousReading = (allReadings || [])
        .filter(r => r.meterId === reading.meterId && new Date(r.timestamp) < new Date(reading.timestamp))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (previousReading) {
        const lastReadingValue = (previousReading as any).value ?? previousReading.reading ?? 0;
        if (value < lastReadingValue) {
            return { valid: false, error: 'Der Zählerstand darf nicht niedriger sein als der vorherige Stand.' };
        }
    }

    // Find the reading immediately after the one being validated
    const nextReading = (allReadings || [])
        .filter(r => r.meterId === reading.meterId && new Date(r.timestamp) > new Date(reading.timestamp))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

    if (nextReading) {
        const nextReadingValue = (nextReading as any).value ?? nextReading.reading ?? 0;
        if (value > nextReadingValue) {
            return { valid: false, error: 'Der Zählerstand darf nicht höher sein als der nächste erfasste Stand.' };
        }
    }

    if (previousReading) {
        // High consumption warning logic
        const daysSince = (new Date(reading.timestamp).getTime() - new Date(previousReading.timestamp).getTime()) / (1000 * 3600 * 24);
        if (daysSince > 0.1) { // check after a few hours to avoid division by zero or tiny intervals
            const consumptionPerDay = (value - ((previousReading as any).value ?? previousReading.reading ?? 0)) / daysSince;
            
            let threshold = 50; // kWh for electricity
            let unit = reading.unit || 'kWh';

            switch (reading.type) {
                case 'gas':
                    threshold = 20; // m³ for gas
                    break;
                case 'water':
                    threshold = 1; // m³ for water
                    break;
            }

            if (consumptionPerDay > threshold) {
                return { valid: true, warning: `Der Verbrauch von ${consumptionPerDay.toFixed(1)} ${unit}/Tag ist sehr hoch. Sind Sie sicher?` };
            }
        }
    }

    return { valid: true };
};

export const calculateMeterDifferences = (readings: MeterReading[], devices?: Device[]): MeterReading[] => {
    const readingsByMeter = new Map<string, MeterReading[]>();

    // Deep copy readings to avoid mutating original state
    const safeReadings = JSON.parse(JSON.stringify(readings || []));

    // Group readings by meterId
    safeReadings.forEach((r: any) => {
        if (!readingsByMeter.has(r.meterId)) {
            readingsByMeter.set(r.meterId, []);
        }
        readingsByMeter.get(r.meterId)!.push(r);
    });

    const result: MeterReading[] = [];
    readingsByMeter.forEach((meterReadings, meterId) => {
        // Convert timestamp strings back to Date objects and sort ascending
        meterReadings.forEach(r => r.timestamp = new Date(r.timestamp));
        meterReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const device = devices?.find(d => d.id === meterReadings[0]?.deviceId);
        const calculationType = device?.calculationType;

        if (meterReadings.length > 0) {
            const firstEverValue = meterReadings[0].reading ?? (meterReadings[0] as any).value ?? 0;

            for (let i = 0; i < meterReadings.length; i++) {
                const current = meterReadings[i];
                const currentValue = current.reading ?? (current as any).value ?? 0;
                
                if (calculationType === 'sum') {
                    (current as any).difference = currentValue;
                } else if (i > 0) {
                    const previous = meterReadings[i - 1];
                    const previousValue = previous.reading ?? (previous as any).value ?? 0;
                    (current as any).difference = currentValue - previousValue;
                } else {
                    (current as any).difference = 0;
                }
                (current as any).totalConsumption = currentValue - firstEverValue;
                result.push(current);
            }
        }
    });

    // Sort the final combined result descending by date for display
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};


export const formatEnergyValue = (value: number | null | undefined, unit: string = 'kWh'): string => {
    return `${formatNumber(value, 1)} ${unit}`;
}

export const formatCurrency = (value: number | null | undefined, currency: string = '€'): string => {
    return `${formatNumber(value, 2)} ${currency}`;
}

export const calculateTotalProduction = (allReadings: MeterReading[]): number => {
  const productionReadings = (allReadings || []).filter(r => 
    r.type === 'solar' || r.type === 'production' || r.type === 'solar-pv'
  );

  if (productionReadings.length === 0) {
    return 0;
  }

  // Find the latest reading among all production meters
  const latestReading = productionReadings.reduce((latest, current) => {
    const latestDate = new Date(latest.timestamp);
    const currentDate = new Date(current.timestamp);
    return currentDate > latestDate ? current : latest;
  });

  return latestReading.reading ?? (latestReading as any).value ?? 0;
};