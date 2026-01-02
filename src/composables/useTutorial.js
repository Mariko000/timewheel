// src/composables/useTutorial.js
import { ref, nextTick } from 'vue'
import { useSpotlight } from './useSpotlight'

const active = ref(false)
const currentMessage = ref('')
let steps = []
let index = 0
let timer = null
let onFinish = null

export function useTutorial(interval = 3000) {
  const { highlight, clear } = useSpotlight()

  async function waitForElement(selector, timeout = 3000) {
    const start = Date.now()
    return new Promise((resolve) => {
      const check = () => {
        const el = document.querySelector(selector)
        if (el) return resolve(true)
        if (Date.now() - start > timeout) return resolve(false)
        requestAnimationFrame(check)
      }
      check()
    })
  }

  async function start(passedSteps, options = {}) {
    if (!passedSteps?.length) return

    stop(false)
    steps = passedSteps
    index = 0
    onFinish = options.onFinish || null

    await nextTick()
    active.value = true

    const showStep = async (idx) => {
      const step = steps[idx]
      if (!step) {
        stop(true)
        return
      }

      const exists = await waitForElement(step.selector)
      if (!exists) {
        index++
        showStep(index)
        return
      }

      highlight(step.selector)
      currentMessage.value = step.message
    }

    await showStep(index)

    timer = setInterval(async () => {
      index++
      await showStep(index)
    }, interval)
  }

  function stop(natural = false) {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    clear()
    active.value = false
    currentMessage.value = ''
    index = 0
  
    if (natural && typeof onFinish === 'function') {
      onFinish()
    }
  }
  
  return {
    active,
    currentMessage,
    start,
    stop,
    setOnFinish(fn) {
      onFinish = fn
    }
  }
}
