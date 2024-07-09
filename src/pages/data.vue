<template>
  <div>
    <h1>Data</h1>
    <table v-if="data.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Dim</th>
          <th>Counter</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dim }}</td>
          <td>{{ item.counter }}</td>
          <td>{{ item.active ? 'Yes' : 'No' }}</td>
        </tr>
      </tbody>
    </table>

    <form @submit.prevent="updateItem">
      <div>
        <label for="dim">Select Dim:</label>
        <select v-model="selected" id="dim">
          <option v-for="item in data" :key="item.dim" :value="item.dim">
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

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useDataStore } from '~/stores/dataStore';

export default {
  setup() {
    const dataStore = useDataStore();
    const counter = ref(null);
    const selected = ref(null);
    const id = ref(null);

    const data = computed(() => dataStore.data);
    const loading = computed(() => dataStore.loading);
    const error = computed(() => dataStore.error);

    const updateItem = async () => {
      const newData = { counter: counter.value };
      await dataStore.updateData(id.value, newData);
    };

    const fetchData = async () => {
      await dataStore.fetchData();
      const activeItem = data.value.find(item => item.active);
      if (activeItem) {
        counter.value = activeItem.counter;
        selected.value = activeItem.dim;
        id.value = activeItem.id;
      }
    };

    onMounted(fetchData);

    watch(selected, async (dim) => {
      const activeItem = data.value.find(item => item.active);
      if (dim !== activeItem.dim) {
        const selectedItem = data.value.find(item => item.dim === dim);
        counter.value = selectedItem.counter;
        id.value = selectedItem.id;

        await dataStore.updateData(activeItem.id, { active: false });
        await dataStore.updateData(selectedItem.id, { active: true });
      }
    });

    return {
      counter,
      selected,
      data,
      loading,
      error,
      updateItem
    };
  }
};
</script>
