import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type PickerItemProps = {
  label: string;
  value: any;
};

type CustomPickerProps = {
  selectedValue: any;
  onValueChange: (value: any) => void;
  items: PickerItemProps[];
  label: string;
};

const IOSPicker: React.FC<CustomPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  label,
}) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);

  const renderItem = ({ item }: { item: PickerItemProps }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { borderBottomColor: colors.border },
        selectedValue === item.value && { backgroundColor: colors.primary },
      ]}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
    >
      <Text
        style={[
          styles.itemText,
          { color: selectedValue === item.value ? '#FFFFFF' : colors.text },
        ]}
      >
        {item.label}
      </Text>
      {selectedValue === item.value && <Check color="#FFFFFF" size={20} />}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.pickerButtonText, { color: colors.text }]}>
            {selectedItem ? selectedItem.label : 'Alle'}
          </Text>
          <ChevronDown color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {label}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.value}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    pickerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
      },
      label: {
        color: '#374151',
        marginRight: 8,
      },
      pickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      },
      pickerButtonText: {
        fontSize: 16,
      },
      modalContainer: {
        flex: 1,
      },
      modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
      },
      itemText: {
        fontSize: 16,
      },
});

export default IOSPicker;
