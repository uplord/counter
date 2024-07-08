<template>
  <div>
    <h1>JSON Data</h1>
    <input v-model="fileUrl" type="text" placeholder="Enter JSON file URL" />
    <button @click="fetchJsonData">Load JSON Data</button>
    <pre>{{ jsonData }}</pre>
    <UpdateJsonForm @update-json="fetchJsonData" :file-url="fileUrl" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UpdateJsonForm from '~/components/UpdateJsonForm.vue';

const jsonData = ref(null);
const errorMessage = ref('');
const fileUrl = ref('data.json');

const fetchJsonData = async () => {
  try {
    const response = await fetch(`/api/read-json?file=${fileUrl.value}`);
    const data = await response.json();
    if (data.success) {
      jsonData.value = data.data;
    } else {
      errorMessage.value = data.message;
    }
  } catch (error) {
    errorMessage.value = 'Failed to fetch JSON data';
  }
};

onMounted(() => {
  fetchJsonData();
});
</script>
