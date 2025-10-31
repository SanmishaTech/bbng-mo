import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { getPowerTeamById, updatePowerTeam, getAllCategories, getSubCategoriesByCategoryId, Category, SubCategorySummary } from '@/services/powerTeamService';
import Checkbox from 'expo-checkbox';

export default function EditPowerTeamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = useThemeColor({}, 'background');

  const [name, setName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedSubCategoriesMap, setSelectedSubCategoriesMap] = useState<Record<number, number[]>>({});
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<number, SubCategorySummary[]>>({});
  const [loadingSubCategories, setLoadingSubCategories] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [nameError, setNameError] = useState('');

  // Load power team and categories
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Load categories
      const categoriesData = await getAllCategories();
      setCategories(categoriesData || []);

      // Load power team
      if (id) {
        const powerTeam = await getPowerTeamById(id as string);
        setName(powerTeam.name);
        const categoryIds = powerTeam.categories.map(cat => cat.id);
        setSelectedCategoryIds(categoryIds);

        // Initialize subcategory map
        const initialSubCategoryMap: Record<number, number[]> = {};
        if (powerTeam.subCategories) {
          powerTeam.subCategories.forEach(subCat => {
            if (!initialSubCategoryMap[subCat.categoryId]) {
              initialSubCategoryMap[subCat.categoryId] = [];
            }
            initialSubCategoryMap[subCat.categoryId].push(subCat.id);
          });
        }
        setSelectedSubCategoriesMap(initialSubCategoryMap);

        // Load subcategories for each selected category
        for (const catId of categoryIds) {
          loadSubCategories(catId);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load power team',
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Load subcategories for a category
  const loadSubCategories = async (categoryId: number) => {
    if (subCategoriesMap[categoryId]) return; // Already loaded

    try {
      setLoadingSubCategories(prev => ({ ...prev, [categoryId]: true }));
      const subCategories = await getSubCategoriesByCategoryId(categoryId);
      setSubCategoriesMap(prev => ({ ...prev, [categoryId]: subCategories }));
    } catch (error: any) {
      console.error('Error loading subcategories:', error);
    } finally {
      setLoadingSubCategories(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Handle category selection
  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        // Deselecting - remove subcategory selections for this category
        setSelectedSubCategoriesMap(prevMap => {
          const newMap = { ...prevMap };
          delete newMap[categoryId];
          return newMap;
        });
        return prev.filter(cId => cId !== categoryId);
      } else {
        // Selecting - initialize subcategory map and load subcategories
        setSelectedSubCategoriesMap(prevMap => ({
          ...prevMap,
          [categoryId]: prevMap[categoryId] || [],
        }));
        loadSubCategories(categoryId);
        return [...prev, categoryId];
      }
    });
  };

  // Handle subcategory selection
  const toggleSubCategory = (categoryId: number, subCategoryId: number) => {
    setSelectedSubCategoriesMap(prev => {
      const current = prev[categoryId] || [];
      const newSelection = current.includes(subCategoryId)
        ? current.filter(id => id !== subCategoryId)
        : [...current, subCategoryId];
      return { ...prev, [categoryId]: newSelection };
    });
  };

  // Validate form
  const validate = () => {
    if (!name.trim()) {
      setNameError('Power team name is required');
      return false;
    } else if (name.trim().length < 2) {
      setNameError('Power team name must be at least 2 characters');
      return false;
    }
    setNameError('');

    if (selectedCategoryIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select at least one category',
      });
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      
      // Flatten all selected subcategories
      const allSubCategoryIds = Object.values(selectedSubCategoriesMap).flat();
      
      const formData = {
        name: name.trim(),
        categoryIds: selectedCategoryIds,
        subCategoryIds: allSubCategoryIds,
      };

      await updatePowerTeam(id as string, formData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Power team updated successfully',
      });

      router.replace('/modules/powerteams' as any);
    } catch (error: any) {
      console.error('Error updating power team:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to update power team',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <NavigationHeader title="Edit Power Team" backPath="/modules/powerteams" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <NavigationHeader title="Edit Power Team" backPath="/modules/powerteams" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Power Team Details</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: nameError ? '#ef4444' : colors.border,
                },
              ]}
              placeholder="Enter power team name"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError('');
              }}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>
        </View>

        {/* Categories Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Categories <Text style={styles.required}>*</Text>
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
            Choose one or more categories for this power team
          </Text>

          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: colors.background,
                    borderColor: selectedCategoryIds.includes(category.id)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Checkbox
                  value={selectedCategoryIds.includes(category.id)}
                  onValueChange={() => toggleCategory(category.id)}
                  color={selectedCategoryIds.includes(category.id) ? colors.primary : undefined}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selectedCategoryIds.includes(category.id)
                        ? colors.text
                        : colors.placeholder,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategoryIds.length > 0 && (
            <View style={[styles.selectedInfo, { backgroundColor: colors.background }]}>
              <Text style={[styles.selectedInfoText, { color: colors.text }]}>
                {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'category' : 'categories'} selected
              </Text>
            </View>
          )}
        </View>

        {/* Subcategories Selection for Each Category */}
        {selectedCategoryIds.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Subcategories</Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Choose subcategories for each selected category
            </Text>

            {selectedCategoryIds.map((categoryId) => {
              const category = categories.find(c => c.id === categoryId);
              if (!category) return null;

              const subCategories = subCategoriesMap[categoryId] || [];
              const isLoadingSubs = loadingSubCategories[categoryId];
              const selectedSubs = selectedSubCategoriesMap[categoryId] || [];

              return (
                <View key={categoryId} style={[styles.subCategorySection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.subCategoryTitle, { color: colors.text }]}>
                    {category.name} - Subcategories
                  </Text>

                  {isLoadingSubs ? (
                    <View style={styles.subCategoryLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.subCategoryLoadingText, { color: colors.placeholder }]}>
                        Loading subcategories...
                      </Text>
                    </View>
                  ) : subCategories.length === 0 ? (
                    <Text style={[styles.noSubCategoriesText, { color: colors.placeholder }]}>
                      No subcategories available
                    </Text>
                  ) : (
                    <View style={styles.subCategoryList}>
                      {subCategories.map((subCategory) => (
                        <TouchableOpacity
                          key={subCategory.id}
                          style={[
                            styles.subCategoryItem,
                            {
                              backgroundColor: colors.card,
                              borderColor: selectedSubs.includes(subCategory.id)
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                          onPress={() => toggleSubCategory(categoryId, subCategory.id)}
                        >
                          <Checkbox
                            value={selectedSubs.includes(subCategory.id)}
                            onValueChange={() => toggleSubCategory(categoryId, subCategory.id)}
                            color={selectedSubs.includes(subCategory.id) ? colors.primary : undefined}
                          />
                          <Text
                            style={[
                              styles.subCategoryLabel,
                              {
                                color: selectedSubs.includes(subCategory.id)
                                  ? colors.text
                                  : colors.placeholder,
                              },
                            ]}
                          >
                            {subCategory.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedSubs.length > 0 && (
                    <Text style={[styles.subCategoryCount, { color: colors.primary }]}>
                      {selectedSubs.length} selected
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Update Power Team</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  inputGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 12,
  },
  categoryLabel: {
    fontSize: 16,
    flex: 1,
  },
  selectedInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  selectedInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  subCategorySection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  subCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subCategoryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  subCategoryLoadingText: {
    fontSize: 14,
  },
  noSubCategoriesText: {
    fontSize: 14,
    fontStyle: 'italic',
    padding: 12,
  },
  subCategoryList: {
    gap: 8,
  },
  subCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 10,
  },
  subCategoryLabel: {
    fontSize: 14,
    flex: 1,
  },
  subCategoryCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
