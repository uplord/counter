<!-- components/UpdateJsonForm.vue -->

<template>
  <div>
    <h1>Update JSON Data</h1>
    <div v-if="isLoading">Loading...</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <table v-if="!isLoading && !errorMessage">
      <thead>
        <tr>
          <th>ID</th>
          <th>Dim</th>
          <th>Counter</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in jsonData" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dim }}</td>
          <td>{{ item.counter }}</td>
          <td>{{ item.active ? 'Yes' : 'No' }}</td>
        </tr>
      </tbody>
    </table>

    <form @submit.prevent="updateCounter">
      <div>
        <label for="dim">Select Dim:</label>
        <select v-model="selectedDim" id="dim">
          <option v-for="item in jsonData" :key="item.dim" :value="item.dim">
            {{ item.dim }}
          </option>
        </select>
      </div>
      <div>
        <label for="counter">New Counter Value:</label>
        <input v-model.number="counter" type="number" id="counter" required />
      </div>
      <button type="submit">Update Counter</button>
    </form>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useJsonStore } from '~/stores/jsonStore';

// Initialize Pinia store
const jsonStore = useJsonStore();

// Local component state
const counter = ref(0);
const selectedDim = ref('');
const successMessage = ref('');
const errorMessage = ref('');

// Computed properties to access store data
const jsonData = computed(() => jsonStore.getJsonData);
const isLoading = computed(() => jsonStore.getIsLoading);
const storeErrorMessage = computed(() => jsonStore.getErrorMessage);
const originalJsonData = computed(() => jsonStore.getOriginalJsonData);

// Fetch data when the component is mounted
onMounted(async () => {
  await jsonStore.fetchJsonData();
});

// Watch for changes in jsonData to update selectedDim and counter
watch(jsonData, (newData) => {
  if (newData.length > 0) {
    const activeItem = newData.find(item => item.active);
    if (activeItem) {
      selectedDim.value = activeItem.dim;
      counter.value = activeItem.counter;
    } else {
      selectedDim.value = '';
      counter.value = 0;
    }
  }
}, { immediate: true });

// Compare data to check if there are changes
const hasDataChanged = (newData) => {
  return jsonStore.hasDataChanged(newData);
};

// Watch selectedDim to update the active status
watch(selectedDim, async (newDim) => {
  if (newDim) {
    const updatedData = jsonData.value.map(item => ({
      ...item,
      active: item.dim === newDim
    }));

    if (hasDataChanged(updatedData)) {
      const response = await jsonStore.updateJsonData(updatedData);
      if (response.success) {
        const newActiveItem = updatedData.find(item => item.active);
        if (newActiveItem) {
          counter.value = newActiveItem.counter;
        }
        successMessage.value = 'Active status updated successfully!';
      } else {
        errorMessage.value = response.message || 'Failed to update active status';
      }
    } else {
      successMessage.value = 'No changes detected.';
    }
  }
});

// Update the counter value for the selected dimension
const updateCounter = async () => {
  const updatedData = jsonData.value.map(item => {
    if (item.dim === selectedDim.value) {
      return { ...item, counter: counter.value };
    }
    return item;
  });

  if (hasDataChanged(updatedData)) {
    const response = await jsonStore.updateJsonData(updatedData);
    if (response.success) {
      successMessage.value = 'Counter value updated successfully!';
    } else {
      errorMessage.value = response.message || 'Failed to update counter value';
    }
  } else {
    successMessage.value = 'No changes detected.';
  }

  // Clear the success message after a short delay
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};
</script>

<style scoped>
.error {
  color: red;
}
.success {
  color: green;
}
</style>
