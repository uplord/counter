<template>
  <div>
    <h1>Counter</h1>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  value: {
    required: true,
  },
})

const emits = defineEmits(['update-counter'])

let intervalId

const startUpdating = () => {
  intervalId = setInterval(() => {
    emits('update-counter', props.value + 1)
  }, 1000)
}

onMounted(() => {
  startUpdating()
})

onUnmounted(() => {
  clearInterval(intervalId)
})

</script>
