import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';

const endpoint = "/data/";

export const useDataStore = defineStore('dataStore', () => {
  const config = useRuntimeConfig();

  const state = reactive({
    data: [],
    loading: false,
    error: null,
  });

  const fetchData = async () => {
    state.loading = true;
    state.error = null;
    try {
      const response = await fetch(config.public.apiBaseURL + endpoint);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      state.data = data;
    } catch (err) {
      state.error = 'Failed to fetch data';
    } finally {
      state.loading = false;
    }
  };

  const updateData = async (id, newData) => {
    state.loading = true;
    state.error = null;
    try {
      const response = await fetch(config.public.apiBaseURL + endpoint + id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const updatedItem = await response.json();
      const index = state.data.findIndex(item => item.id === id);
      if (index !== -1) {
        state.data[index] = updatedItem;
      }
    } catch (err) {
      state.error = 'Failed to update data';
    } finally {
      state.loading = false;
    }
  };

  return {
    ...toRefs(state),
    fetchData,
    updateData
  };
});
