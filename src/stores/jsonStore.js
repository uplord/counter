// stores/jsonStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useJsonStore = defineStore('jsonStore', () => {
  const jsonData = ref([]);
  const originalJsonData = ref([]);
  const errorMessage = ref('');
  const isLoading = ref(false);

  // Fetch JSON data from the API
  const fetchJsonData = async () => {
    isLoading.value = true;
    try {
      const response = await fetch('/api/read-json?file=data.json');
      const result = await response.json();
      if (result.success) {
        jsonData.value = result.data;
        originalJsonData.value = JSON.parse(JSON.stringify(result.data)); // Clone JSON data
        errorMessage.value = '';
      } else {
        errorMessage.value = result.message;
      }
    } catch (error) {
      errorMessage.value = 'Failed to fetch JSON data';
    } finally {
      isLoading.value = false;
    }
  };

  // Update JSON data through the API
  const updateJsonData = async (updatedData) => {
    try {
      const response = await fetch('/api/update-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (result.success) {
        // Update the jsonData in the store
        jsonData.value = updatedData;
        updateOriginalData(); // Update the original data in the store
      }
      return result; // Return response to handle in the component
    } catch (error) {
      return { success: false, message: 'Failed to update JSON data' };
    }
  };

  // Check if the data has changed compared to the original data
  const hasDataChanged = (newData) => {
    return JSON.stringify(newData) !== JSON.stringify(originalJsonData.value);
  };

  // Update the original data after a successful update
  const updateOriginalData = () => {
    originalJsonData.value = JSON.parse(JSON.stringify(jsonData.value));
  };

  // Computed properties for easy access
  const getJsonData = computed(() => jsonData.value);
  const getOriginalJsonData = computed(() => originalJsonData.value);
  const getErrorMessage = computed(() => errorMessage.value);
  const getIsLoading = computed(() => isLoading.value);

  return {
    jsonData,
    originalJsonData,
    errorMessage,
    isLoading,
    fetchJsonData,
    updateJsonData,
    hasDataChanged,
    updateOriginalData,
    getJsonData,
    getOriginalJsonData,
    getErrorMessage,
    getIsLoading,
  };
});
