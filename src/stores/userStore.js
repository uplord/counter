import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';

const endpoint = "/user/";

export const useUserStore = defineStore('userStore', () => {
  const config = useRuntimeConfig();

  const state = reactive({
    data: null,
  });

  const fetchData = async (id) => {
    try {
      const response = await fetch(`${config.public.apiBaseURL}${endpoint}${id}`);
      if (!response.ok) {
        console.error('Network response was not ok');
      }
      const fetchedData = await response.json();
      state.data = fetchedData;
    } catch (err) {
      console.error(err.message || 'Failed to fetch data');
    }
  };

  const updateData = async (id, newData) => {
    try {
      const response = await fetch(`${config.public.apiBaseURL}${endpoint}${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
      if (!response.ok) {
        console.error('Network response was not ok');
      }
      const updatedItem = await response.json();
      state.data = updatedItem;
    } catch (err) {
      console.error(err.message || 'Failed to update data');
    }
  };


  return {
    ...toRefs(state),
    fetchData,
    updateData,
  };
});
