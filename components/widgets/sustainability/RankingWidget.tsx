import { View, Text } from 'react-native';
import { Widget } from '@/components/ui/Widget';

export const RankingWidget = () => {
  return (
    <View style={{ position: 'relative' }}>
      <Widget title="Ihr Ranking" value="..." />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <Text style={{ fontSize: 18, fontWeight: '500', color: '#666', transform: [{ rotate: '-30deg' }] }}>
          Coming soon
        </Text>
      </View>
    </View>
  );
};
