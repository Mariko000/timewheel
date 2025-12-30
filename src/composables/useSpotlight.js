// src/composables/useSpotlight.js
//チュートリアル用
import { ref } from 'vue'

const rect = ref(null)

export function useSpotlight() {

  function highlight(selector) {
    const el = document.querySelector(selector)
    if (!el) {
      rect.value = null
      return
    }

    const r = el.getBoundingClientRect()
    rect.value = {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    }
  }

  function clear() {
    rect.value = null
  }

  return {
    rect,
    highlight,
    clear,
  }
}
