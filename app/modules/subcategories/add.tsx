import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { createSubCategory, fetchAllCategories, CategoryOption } from '@/services/subCategoryService';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function AddSubCategoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [subcategoryName, setSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [nameError, setNameError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load categories',
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const validate = () => {
    let isValid = true;

    if (!subcategoryName.trim()) {
      setNameError('Sub-category name is required');
      isValid = false;
    } else if (subcategoryName.trim().length < 2) {
      setNameError('Sub-category name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!selectedCategoryId) {
      setCategoryError('Please select a category');
      isValid = false;
    } else {
      setCategoryError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: subcategoryName.trim(),
        categoryId: Number(selectedCategoryId),
      };
      
      console.log('Creating subcategory with payload:', payload);
      console.log('categoryId type:', typeof payload.categoryId);
      await createSubCategory(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Sub-category created successfully',
      });
      router.push('/modules/subcategories' as any);
    } catch (error) {
      console.error('Error creating subcategory:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create sub-category',
      });
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Add Sub-Category" backPath="/modules/subcategories" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Sub-Category Details
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Sub-Category Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: nameError ? '#F44336' : colors.border,
                  },
                ]}
                placeholder="Enter sub-category name"
                placeholderTextColor={colors.placeholder}
                value={subcategoryName}
                onChangeText={(text) => {
                  setSubcategoryName(text);
                  if (nameError) setNameError('');
                }}
                editable={!loading}
                autoCapitalize="words"
              />
              {nameError && (
                <Text style={styles.errorText}>{nameError}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              {loadingCategories ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading categories...
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: categoryError ? '#F44336' : colors.border }]}>
                  <Picker
                    selectedValue={selectedCategoryId}
                    onValueChange={(value) => {
                      setSelectedCategoryId(value);
                      if (categoryError) setCategoryError('');
                    }}
                    style={[styles.picker, { color: colors.text }]}
                    enabled={!loading}
                  >
                    <Picker.Item label="-- Select a Category --" value={null} />
                    {categories.map((category) => (
                      <Picker.Item
                        key={category.id}
                        label={category.name}
                        value={category.id}
                      />
                    ))}
                  </Picker>
                </View>
              )}
              {categoryError && (
                <Text style={styles.errorText}>{categoryError}</Text>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => router.push('/modules/subcategories' as any)}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    color: '#F44336',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
