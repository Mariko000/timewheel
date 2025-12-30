// src/components/Tutorial/tutorialFirstLaunch.js

const KEY = 'timewheel_tutorial_done'

export function isFirstLaunch() {
  return localStorage.getItem(KEY) !== 'done'
}

export function markTutorialDone() {
  localStorage.setItem(KEY, 'done')
}
