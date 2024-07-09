<template>
  <div>
    <h1>Data</h1>
    <div v-if="active">
      <p v-if="user">{{ user }}</p>

      <table v-if="data && data.length">
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

      <p v-if="data">
        <form @submit.prevent="update">
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
      </p>

      <p v-if="current">{{ current }}</p>
    </div>
    <div v-else>
      <p>Active in another tab, browser or device</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useDataStore } from '~/stores/dataStore';

export default {
  setup() {
    const userId = 1;
    const userStore = useUserStore();
    const dataStore = useDataStore();

    const user = computed(() => userStore.data);
    const data = computed(() => dataStore.data);

    const current = ref(null);
    const counter = ref(null);
    const selected = ref(null);
    const uniqueKeyId = Date.now() + Math.random().toString(36).substring(2);
    const active = ref(true);

    const update = async () => {
      await userStore.fetchData(userId);
      if (user.value.key != uniqueKeyId) {
        active.value = false;
      } else {
        await dataStore.updateData(current.value.id, { counter: counter.value });
      }
    };

    onMounted(async () => {
      await userStore.updateData(userId, { key: uniqueKeyId });
      // await userStore.fetchData(userId);
      await dataStore.fetchData();

      current.value = data.value.find(item => item.active);
      if (!current.value) {
        current.value = data.value[0];
        await dataStore.updateData(current.value.id, { active: true });
      }

      counter.value = current.value.counter;
      selected.value = current.value.dim;

      localStorage.setItem('tabId', uniqueKeyId);

      window.addEventListener('storage', (event) => {
        if (event.key === 'tabId') {
          console.log('Another tab has opened to the same website.');
          active.value = false;
        }
      });

      window.addEventListener('unload', () => {
        localStorage.removeItem('tabId');
      });
    });

    watch(selected, async () => {
      await userStore.fetchData(userId);
      if (user.value.key != uniqueKeyId) {
        active.value = false;
      } else {
        const selectedItem = data.value.find(item => item.dim === selected.value);

        if (selectedItem.id != current.value.id) {
          data.value.forEach(async (item, index) => {
            if (item.active == true && selectedItem.id != item.id) {
              await dataStore.updateData(item.id, { active: false });
            }
          });
          await dataStore.updateData(selectedItem.id, { active: true });
          current.value = selectedItem;
        }
      }
    });

    return {
      user,
      data,
      current,
      counter,
      selected,
      update,
      active,
    };
  }
};
</script>
