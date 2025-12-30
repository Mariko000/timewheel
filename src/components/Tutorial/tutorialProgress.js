// 画面ごとの完了フラグ
const PREFIX = 'timewheel_tutorial_done_'

export function isTutorialDone(key) {
  return localStorage.getItem(PREFIX + key) === 'true'
}

export function markTutorialDoneFor(key) {
  localStorage.setItem(PREFIX + key, 'true')
}
