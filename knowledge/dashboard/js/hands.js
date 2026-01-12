/**
 * CYNIC Hand Tracking Module
 * MediaPipe Hands integration for gesture control
 */

import * as state from './state.js';
import { updateVisibility } from './scene.js';
import { updateCategoryUI } from './hud.js';
import { triggerJudgment, updateFromLiveData } from './api.js';

/**
 * Count extended fingers from hand landmarks
 */
export function countFingers(landmarks) {
  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [6, 10, 14, 18];
  let count = 0;

  // Thumb (different logic - horizontal)
  if (landmarks[4].x < landmarks[3].x) count++;

  // Other fingers (vertical)
  for (let i = 0; i < 4; i++) {
    if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
      count++;
    }
  }

  return count;
}

/**
 * Handle MediaPipe Hands results
 */
export function onHandsResults(results) {
  state.setLeftFingers(0);
  state.setRightFingers(0);
  state.setLeftHandPos(null);
  state.setRightHandPos(null);

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label;
      const fingers = countFingers(landmarks);

      // Mirror: Right in camera = Left hand
      if (handedness === 'Right') {
        state.setLeftFingers(fingers);
        state.setLeftHandPos(landmarks[9]); // Palm center
        document.getElementById('left-fingers').textContent = fingers + ' fingers';
      } else {
        state.setRightFingers(fingers);
        state.setRightHandPos(landmarks[9]);
        document.getElementById('right-fingers').textContent = fingers + ' fingers';
      }
    }
  } else {
    document.getElementById('left-fingers').textContent = '--';
    document.getElementById('right-fingers').textContent = '--';
  }

  // Process gestures with debounce
  processHandGestures();
}

/**
 * Process hand gestures for interaction
 */
export function processHandGestures() {
  const now = Date.now();
  if (now - state.gestureDebounce < 500) return; // 500ms debounce

  // Left hand: 1-5 fingers = filter categories
  if (state.leftFingers !== state.lastLeftFingers && state.leftFingers >= 1 && state.leftFingers <= 5) {
    const categories = ['PRIMARY', 'SECONDARY', 'META', 'HUMAN_LLM', 'DISCOVERY'];
    const newCategory = categories[state.leftFingers - 1];

    updateCategoryUI(newCategory);
    state.setGestureDebounce(now);
    console.log('[Hands] Filter:', newCategory);
  }

  // Right hand: 5 fingers = trigger judgment
  if (state.rightFingers === 5 && state.lastRightFingers !== 5) {
    console.log('[Hands] Judgment gesture detected');
    triggerJudgment().then(result => {
      if (result && result.scores) {
        updateFromLiveData(result);
      }
    });
    state.setGestureDebounce(now);
  }

  // Both hands open (5+5) = reset to ALL
  if (state.leftFingers === 5 && state.rightFingers === 5) {
    updateCategoryUI('ALL');
    state.setGestureDebounce(now);
  }

  // Right hand position controls camera rotation
  if (state.rightHandPos && state.controls) {
    const rotX = (state.rightHandPos.x - 0.5) * Math.PI * 0.5;
    // Subtle influence on auto-rotation
    state.controls.autoRotate = true;
    state.controls.autoRotateSpeed = rotX * 5;
  } else if (state.controls) {
    state.controls.autoRotate = false;
  }

  state.setLastLeftFingers(state.leftFingers);
  state.setLastRightFingers(state.rightFingers);
}

/**
 * Initialize MediaPipe hand tracking
 */
export async function initHandTracking() {
  const video = document.getElementById('video');

  // Use global Hands from MediaPipe CDN
  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onHandsResults);
  state.setHandsInstance(hands);

  // Use global Camera from MediaPipe CDN
  const cam = new window.Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  state.setCameraInstance(cam);
  await cam.start();
  console.log('[Hands] Camera started');
}

/**
 * Toggle hand tracking on/off
 */
export async function toggleHandTracking() {
  state.setHandTrackingEnabled(!state.handTrackingEnabled);

  const video = document.getElementById('video');
  const handHud = document.getElementById('hand-hud');

  if (state.handTrackingEnabled) {
    video.style.display = 'block';
    handHud.style.display = 'block';

    if (!state.handsInstance) {
      try {
        await initHandTracking();
        console.log('[Hands] Tracking enabled');
      } catch (e) {
        console.error('[Hands] Failed to init:', e.message);
        state.setHandTrackingEnabled(false);
        video.style.display = 'none';
        handHud.style.display = 'none';
        alert('Camera not available: ' + e.message);
      }
    } else {
      await state.cameraInstance.start();
    }
  } else {
    video.style.display = 'none';
    handHud.style.display = 'none';
    if (state.cameraInstance) {
      state.cameraInstance.stop();
    }
    console.log('[Hands] Tracking disabled');
  }
}
