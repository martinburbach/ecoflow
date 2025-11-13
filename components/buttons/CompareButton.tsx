import { TouchableOpacity, Text } from 'react-native';
import { ChartBarIcon } from 'lucide-react-native';

export const CompareButton = () => {
  return (
    <TouchableOpacity className="flex flex-row items-center justify-center space-x-2 bg-primary-600 px-4 py-3 rounded-lg w-full">
      <ChartBarIcon size={20} color="white" />
      <Text className="text-white font-medium">Mit anderen vergleichen</Text>
    </TouchableOpacity>
  );
};
