<template>
  <div>
    <h1>Update JSON File</h1>
    <form @submit.prevent="updateJson">
      <div>
        <label for="key">Key:</label>
        <input v-model="key" type="text" id="key" required />
      </div>
      <div>
        <label for="value">Value:</label>
        <input v-model="value" type="text" id="value" required />
      </div>
      <button type="submit">Update</button>
    </form>
    <p v-if="responseMessage">{{ responseMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['fileUrl']);
const key = ref('');
const value = ref('');
const responseMessage = ref('');
const emit = defineEmits(['update-json']);

const updateJson = async () => {
  try {
    const response = await fetch('/api/update-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [key.value]: value.value, file: props.fileUrl }),
    });
    const data = await response.json();
    responseMessage.value = data.message;

    if (data.success) {
      emit('update-json');
    }
  } catch (error) {
    responseMessage.value = 'Failed to update JSON file';
  }
};
</script>
