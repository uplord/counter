<template>
  <div>
    <h1>Game</h1>
    <p v-if="selected">{{ selected }}</p>
    <p v-if="current">{{ current }}</p>
    <p v-if="stats">{{ stats }}</p>
    <p v-if="error">{{ error }}</p>
    <p v-if="current && !current.sleep && stats">
      <button @click="add('trophies')">Add Trophy</button>
      <button @click="add('win')">Add Win</button>
      <button @click="add('loss')">Add Loss</button>
    </p>
    <p>
      <button @click="reset">Reset</button>
    </p>
    <p v-if="current">
      <button @click="sleep">{{ !current.sleep ? 'Sleep' : 'Wake' }}</button>
    </p>
    <p>
      <button @click="prev">Prev</button>
      <button @click="next">Next</button>
    </p>
    <p>
      <button @click="save(current.id)">Save</button>
    </p>
    <p v-if="digimon">{{ digimon }}</p>
    <p>
      <label for="dim">Select Dim:</label>
      <select v-model="selected" id="dim">
        <option v-for="item in data" :key="item.dim" :value="item.dim">
          {{ item.dim }}
        </option>
      </select>
    </p>
    <p v-if="data">{{ data }}</p>
    <p v-if="dim">{{ dim }}</p>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useFetch } from '#app'

export default {
  setup() {
    const dims = ref(null);
    const data = ref(null);

    const selected = ref(null);
    const dim = ref(null);
    const currentId = ref(null);
    const digimon = ref(null);
    const current = ref(null);
    const stats = ref({});

    const stages = ["Egg", "I", "II", "III", "IV", "V", "VI"];

    const error = ref(null);
    const isTimerRunning = ref(false);

    /*
    store digimon
    active
    backup
    stored

    current digigmon form
    counter
    timer
    trophies
    battles
    wins
    losses
    if asleep
    injuries - reset each day
    last active date

    on timer we check if matchs evo time
    if matches check
    if evo
    reset timer, trophies, battle, wins, losses
    */

    onMounted(async () => {

      await getDims();
      await getData();
      await getDim();

      digimon.value = dim.value.find(item => item.id === currentId.value);
      if (!digimon.value) {
        digimon.value = dim.value.find(item => item.stage === 'Egg');
      }
      statsCalc();

      startUpdating();

      // load current
      // calculate stats
    });

    onUnmounted(() => {
      clearInterval(intervalId);
    })

    const getDims = async () => {
      try {
        const response = await fetch('/json/dims.json')
        dims.value = response;
      } catch (err) {
        error.value = err.message
      }
    }

    const getData = async () => {
      const config = useRuntimeConfig();
      try {
        const response = await fetch(`${config.public.apiBaseURL}/data/`);
        if (!response.ok) {
          console.error('Network response was not ok');
        }
        data.value = await response.json();
      } catch (err) {
        console.error(err.message || 'Failed to fetch data');
      }
      current.value = data.value.find(item => item.active);
      if (!current.value) {
        current.value = data.value[0];
        current.value.active = true;
        save(current.value.id);
      }
      selected.value = current.value.dim;
      currentId.value = current.value.current
    }


    const getDim = async () => {
      try {
        const response = await $fetch(`/json/dim/${selected.value}.json`)
        dim.value = response;
      } catch (err) {
        error.value = err.message
      }
    }

    const add = async (type) => {
      if (current.value.sleep !== true) {
        current.value[type]++;
        statsCalc();
      }
    }

    const reset = async () => {
      current.value.counter = 0;
      current.value.timer = 0;
      current.value.trophies = 0;
      current.value.win = 0;
      current.value.loss = 0;
      current.value.injuries = 0;
      statsCalc();
      save(current.value.id);
    }

    const sleep = async () => {
      if (current.value.sleep == true) {
        current.value.sleep = false;
      } else {
        current.value.sleep = true;
      }
    }

    const save = async (current_id) => {
      stopUpdating();
      const config = useRuntimeConfig();
      try {
        const response = await fetch(`${config.public.apiBaseURL}/data/${current_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(current.value),
        });
        if (!response.ok) {
          console.error('Network response was not ok');
        }
      } catch (err) {
        console.error(err.message || 'Failed to update data');
      }
      startUpdating();
    }

    const statsCalc = async () => {
      if (digimon.value.stats) {
        stats.value = digimon.value.stats;
        let totalGames = current.value.win + current.value.loss;
        let winPercentage = (current.value.win / totalGames) * 100;
        stats.value.win_percentage = winPercentage ? winPercentage.toFixed(0) + '%' : '0%';
        stats.value.evolve = false;
      } else {
        stats.value = {};
      }
    };

    let intervalId;
    const startUpdating = () => {
      if (isTimerRunning.value) {
        clearInterval(intervalId);
      }
      isTimerRunning.value = true;
      intervalId = setInterval(() => {
        if (current.value.sleep !== true) {
          current.value.timer++;
        }
      }, 1000);
    };

    const stopUpdating = () => {
      clearInterval(intervalId);
      isTimerRunning.value = false;
    };


    const next = async () => {
      let index = dim.value.findIndex(item => item.id === current.value.current);
      if (index < 0) {
        index = 0;
      }
      index++;
      if (index < dim.value.length) {
        current.value.current = dim.value[index].id;
        digimon.value = dim.value[index];
        current.value.counter = 0;
        current.value.timer = 0;
        current.value.trophies = 0;
        current.value.win = 0;
        current.value.loss = 0;
        current.value.injuries = 0;
        statsCalc();
      }
    }

    const prev = async () => {
      let index = dim.value.findIndex(item => item.id === current.value.current);
      index--;
      if (index >= 0) {
        current.value.current = dim.value[index].id ? dim.value[index].id : null;
        digimon.value = dim.value[index];
        current.value.counter = 0;
        current.value.timer = 0;
        current.value.trophies = 0;
        current.value.win = 0;
        current.value.loss = 0;
        current.value.injuries = 0;
        statsCalc();
      }

    }

    watch(selected, async () => {
      stopUpdating();

      const selectedItem = data.value.find(item => item.dim === selected.value);

      if (selectedItem.id != current.value.id) {
        data.value.forEach(async (item, index) => {
          if (item.active == true && selectedItem.id != item.id) {
            item.active = false;
            save(item.id);
          }
        });

        current.value = selectedItem;
        current.value.active = true;
        save(current.value.id);

        await getDim();
        currentId.value = current.value.current;
        digimon.value = dim.value.find(item => item.id === currentId.value);
        if (!digimon.value) {
          digimon.value = dim.value.find(item => item.stage === 'Egg');
        }
        statsCalc();

        startUpdating();
      }
    });

    return {
      data,
      dim,
      digimon,
      selected,
      current,
      stats,
      error,
      add,
      reset,
      sleep,
      save,
      next,
      prev
    };
  }
};
</script>
