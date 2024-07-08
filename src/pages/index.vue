<template>
  <div>
      <p id="speed">{{ speedDisplay }}</p>
      <p id="error">{{ errorDisplay }}</p>
      <!-- Removed the estimated steps display -->
      <p id="walkingCounter">Walking Counter: {{ walkingCounter }}</p> <!-- Updated counter display -->
      <p id="shakeCounter">Shake Counter: {{ shakeCounter }}</p>
      <p id="timeCounter">Time Counter: {{ timeCounter }}</p> <!-- Updated counter display -->
      <p id="status">{{ statusDisplay }}</p> <!-- Display walking or shake status -->

      <button v-if="!deviceMotionStarted" @click="requestPermissionAndStartDeviceMotion">Start Device Motion</button>
      <button v-if="deviceMotionStarted" @click="stopDeviceMotion">Stop Device Motion</button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

// Helper function to calculate distance between two GPS coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default {
  setup() {
      const speedDisplay = ref('Speed: Stationary');
      const errorDisplay = ref('');
      const totalSteps = ref(0);
      const walkingCounter = ref(0); // Renamed from speedCounter
      const shakeCounter = ref(0);
      const timeCounter = ref(0); // Renamed from extraCounter
      const statusDisplay = ref('Status: Stationary'); // Display walking or shaking status
      const isWalking = ref(false); // Flag to track if the user is walking
      const shakingDetected = ref(false); // Flag to track if shaking is detected
      const walkingDelayTimer = ref(null); // Timer for the delay after shaking
      const averageWalkingSpeed = 5; // Average walking speed in km/h
      const minMovementThreshold = 0.001; // Minimal distance to consider movement (in km)
      const stationaryThreshold = 5000; // Time in milliseconds to reset the counter when stationary
      const shakeThreshold = 15; // Threshold for detecting shakes (in m/s^2)
      const shakeCooldown = 1000; // Cooldown period for shake detection (in milliseconds)
      const delayAfterShake = 5000; // Delay duration after shaking before detecting walking (in milliseconds)
      let prevPosition = null;
      let prevTime = null;
      let watchId = null;
      let distanceAccumulator = 0;
      let walkingInterval = null; // Variable to hold setInterval reference for walkingCounter
      let stationaryTimer = null; // Variable to hold setTimeout reference
      let deviceMotionListenerAdded = false; // Flag to track if device motion listener is added
      let lastShakeTime = 0; // Timestamp of the last detected shake
      let timeCounterInterval = null; // Variable to hold setInterval reference for timeCounter

      const deviceMotionStarted = ref(false); // Flag to indicate if device motion tracking has started

      // Function to handle position updates
      function handlePositionUpdate(position) {
          const { latitude, longitude } = position.coords;
          const currentTime = Date.now();

          if (prevPosition) {
              const distance = getDistanceFromLatLonInKm(
                  prevPosition.latitude,
                  prevPosition.longitude,
                  latitude,
                  longitude
              );

              if (distance > minMovementThreshold) {
                  distanceAccumulator += distance;

                  // Calculate steps incrementally based on the new distance
                  const stepsIncrement = distance * 1250; // Approximate number of steps per kilometer
                  totalSteps.value += Math.round(stepsIncrement); // Update total steps display incrementally

                  const timeElapsed = (currentTime - prevTime) / 1000; // time in seconds
                  const speed = distance / timeElapsed; // speed in km/s

                  // Convert speed to km/h
                  const speedInKmPerHour = speed * 3600;

                  // Update speed display regardless of walking status
                  speedDisplay.value = `Speed: ${speedInKmPerHour.toFixed(2)} km/h`;

                  if (speedInKmPerHour > averageWalkingSpeed) {
                      // Start walking detection after a delay
                      if (walkingDelayTimer.value === null) {
                          walkingDelayTimer.value = setTimeout(() => {
                              if (!shakingDetected.value) {
                                  isWalking.value = true; // Set walking status
                                  statusDisplay.value = 'Status: Walking'; // Update status display
                                  startWalkingCounter();
                                  resetStationaryTimer();
                              }
                              walkingDelayTimer.value = null; // Clear the timer
                          }, delayAfterShake);
                      }
                  } else {
                      if (distanceAccumulator > 0) {
                          // If there's movement but below average speed
                          isWalking.value = false; // Set not walking status
                          statusDisplay.value = 'Status: Below average walking speed'; // Update status display
                      }
                      resetStationaryTimer();
                  }
              } else {
                  // No significant movement detected
                  if (distanceAccumulator === 0) {
                      speedDisplay.value = `Speed: ${speedDisplay.value.split(' ')[1]}`; // Keep the speed display but update the text
                      isWalking.value = false; // Ensure walking status is false
                      statusDisplay.value = 'Status: Stationary'; // Update status display
                  }
              }
          }

          prevPosition = { latitude, longitude };
          prevTime = currentTime;
      }

      // Function to handle errors
      function handleError(error) {
          console.error('Error obtaining position', error);
          errorDisplay.value = `Error: ${error.message}`;
      }

      // Function to start or reset the walking counter
      function startWalkingCounter() {
          if (walkingInterval === null) {
              walkingInterval = setInterval(() => {
                  walkingCounter.value += 1; // Increment counter every second
              }, 1000);
          }
      }

      // Function to stop the walking counter
      function stopWalkingCounter() {
          if (walkingInterval !== null) {
              clearInterval(walkingInterval);
              walkingInterval = null;
          }
      }

      // Function to start or reset the time counter
      function startTimeCounter() {
          if (timeCounterInterval === null) {
              timeCounterInterval = setInterval(() => {
                  timeCounter.value += 1; // Increment time counter every second
              }, 1000);
          }
      }

      // Function to stop the time counter
      function stopTimeCounter() {
          if (timeCounterInterval !== null) {
              clearInterval(timeCounterInterval);
              timeCounterInterval = null;
          }
      }

      // Function to reset the stationary timer
      function resetStationaryTimer() {
          if (stationaryTimer !== null) {
              clearTimeout(stationaryTimer);
          }

          stationaryTimer = setTimeout(() => {
              // Reset speed if stationary for the defined period but do not reset steps
              speedDisplay.value = 'Speed: Stationary';
              stopWalkingCounter(); // Stop the counter if stationary for the defined period
              if (!shakingDetected.value) { // Only reset status if not shaking
                  statusDisplay.value = 'Status: Stationary'; // Update status display
              }
          }, stationaryThreshold);
      }

      // Function to handle shake detection
      function handleDeviceMotion(event) {
          const { accelerationIncludingGravity } = event;
          const { x, y, z } = accelerationIncludingGravity;
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const currentTime = Date.now();

          if (acceleration > shakeThreshold) {
              // Check if enough time has passed since the last shake
              if (currentTime - lastShakeTime > shakeCooldown) {
                  shakeCounter.value += 1; // Increment shake counter
                  lastShakeTime = currentTime; // Update the timestamp of the last shake
                  shakingDetected.value = true; // Set shaking detected flag
                  statusDisplay.value = 'Status: Shaking'; // Update status display

                  // Clear any existing walking delay timer if shaking is detected
                  if (walkingDelayTimer.value !== null) {
                      clearTimeout(walkingDelayTimer.value);
                      walkingDelayTimer.value = null;
                  }
              }
          } else {
              shakingDetected.value = false; // Reset shaking detected flag
              if (isWalking.value) {
                  statusDisplay.value = 'Status: Walking'; // Update status display if walking
              }
          }
      }

      // Function to request permission and start device motion detection
      function requestPermissionAndStartDeviceMotion() {
          if (typeof DeviceMotionEvent.requestPermission === 'function') {
              DeviceMotionEvent.requestPermission()
                  .then(permissionState => {
                      if (permissionState === 'granted') {
                          errorDisplay.value = '';
                          startDeviceMotion();
                      } else {
                          errorDisplay.value = 'Permission to access device motion was denied.';
                      }
                  })
                  .catch(error => {
                      console.error('Error requesting permission for device motion:', error);
                      errorDisplay.value = `Error requesting permission: ${error.message}`;
                  });
          } else {
              // For non-iOS devices, start device motion detection directly
              startDeviceMotion();
          }
      }

      // Function to start device motion detection
      function startDeviceMotion() {
          if (!deviceMotionListenerAdded) {
              window.addEventListener('devicemotion', handleDeviceMotion);
              deviceMotionListenerAdded = true; // Update flag to indicate listener is active
              deviceMotionStarted.value = true; // Mark device motion as started
              startTimeCounter(); // Start time counter when device motion starts
          }
      }

      // Function to stop device motion detection
      function stopDeviceMotion() {
          if (deviceMotionListenerAdded) {
              window.removeEventListener('devicemotion', handleDeviceMotion);
              deviceMotionListenerAdded = false; // Update flag to indicate listener is inactive
              deviceMotionStarted.value = false; // Mark device motion as stopped
              stopTimeCounter(); // Stop time counter when device motion stops
          }
      }

      // Function to handle page visibility changes
      function handleVisibilityChange() {
          if (document.visibilityState === 'visible') {
              if (prevPosition === null) {
                  // If no previous position, reset display to stationary
                  speedDisplay.value = 'Speed: Stationary';
                  statusDisplay.value = 'Status: Stationary';
              }
              // Initialize or reinitialize position tracking
              prevTime = null; // Reset previous time
              // Do not reset totalSteps and distanceAccumulator
          } else {
              // Page is not visible, stop the walking counter if the page is not visible
              stopWalkingCounter(); // Stop the walking counter if the page is not visible
              // distanceAccumulator = 0; // Do not reset distanceAccumulator to preserve totalSteps
          }
      }

      // Function to check if DeviceMotionEvent permission is granted
      function checkDeviceMotionPermission() {
          if (typeof DeviceMotionEvent.requestPermission === 'function') {
              DeviceMotionEvent.requestPermission()
                  .then(permissionState => {
                      if (permissionState === 'granted') {
                          startDeviceMotion();
                      } else {
                          errorDisplay.value = 'Permission to access device motion was denied.';
                      }
                  })
                  .catch(error => {
                      console.error('Error checking permission for device motion:', error);
                      errorDisplay.value = `Error checking permission: ${error.message}`;
                  });
          } else {
              // For non-iOS devices, start device motion detection directly
              startDeviceMotion();
          }
      }

      // Initialize geolocation watch and event listeners
      onMounted(() => {
          if (navigator.geolocation) {
              watchId = navigator.geolocation.watchPosition(
                  handlePositionUpdate,
                  handleError,
                  {
                      enableHighAccuracy: true,
                      maximumAge: 0,
                      timeout: 5000
                  }
              );
          } else {
              errorDisplay.value = 'Geolocation is not available on this device.';
          }

          // Add event listener for page visibility change
          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Check for device motion permission and start tracking if already granted
          checkDeviceMotionPermission();
      });

      // Cleanup on component unmount
      onUnmounted(() => {
          // Clean up the geolocation watch on component unmount
          if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
          }

          // Stop the walking counter if it is running
          stopWalkingCounter();
          if (stationaryTimer !== null) {
              clearTimeout(stationaryTimer);
          }

          // Stop the time counter if it is running
          stopTimeCounter();

          // Remove event listener for page visibility change
          document.removeEventListener('visibilitychange', handleVisibilityChange);

          // Remove event listener for device motion if active
          stopDeviceMotion();
      });

      return {
          speedDisplay,
          errorDisplay,
          totalSteps,
          walkingCounter, // Expose walkingCounter to template
          shakeCounter,
          timeCounter, // Expose timeCounter to template
          statusDisplay, // Expose statusDisplay to template
          requestPermissionAndStartDeviceMotion, // Expose method to request permission and start device motion
          stopDeviceMotion, // Expose stopDeviceMotion method to template
          deviceMotionStarted // Expose deviceMotionStarted flag to template
      };
  }
}
</script>
