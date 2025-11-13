export const RankingWidget = () => {
  return (
    <View className="relative">
      <Widget title="Ihr Ranking" value="..." />
      <View className="absolute inset-0 flex items-center justify-center bg-black/10">
        <Text className="text-lg font-medium text-gray-500 rotate-[-30deg]">
          Coming soon
        </Text>
      </View>
    </View>
  );
};
