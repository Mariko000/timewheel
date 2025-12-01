// 風船の動作（浮く／揺れる／消える） を制御するCanvas描画用関数
// 風船の URL を public/balloons から参照
//常に最新の画像が読み込まれるようにURL にキャッシュバスターを追加
const balloonImages = [
  '/balloons/BalloonRed.png?v=' + Date.now(),
  '/balloons/BalloonBlue.png?v=' + Date.now(),
  '/balloons/BalloonYellow.png?v=' + Date.now(),
  '/balloons/BalloonGreen.png?v=' + Date.now(),
  '/balloons/BalloonOrange.png?v=' + Date.now(),
  '/balloons/BalloonPink.png?v=' + Date.now()
]

export function launchBalloonAnimation({
  count = 10,
  baseSize = 80,
  randomSize = true,
  sway = true
} = {}) {

  for (let i = 0; i < count; i++) {
    const img = document.createElement('img')
    img.src = balloonImages[Math.floor(Math.random() * balloonImages.length)]
    img.classList.add('floating-balloon')

    const size = randomSize
      ? baseSize * (0.6 + Math.random() * 0.6)
      : baseSize

    img.style.width = `${size}px`
    img.style.position = 'fixed'
    img.style.left = Math.random() * 80 + 10 + '%'
    img.style.bottom = '-150px'
    img.style.zIndex = 9999
    img.style.pointerEvents = 'none'

    document.body.appendChild(img)

    const duration = 6 + Math.random() * 4

    img.animate(
      [
        { transform: `translate(0, 0)` },
        { transform: `translate(${sway ? (Math.random() * 50 - 25) : 0}px, -120vh)` }
      ],
      {
        duration: duration * 1000,
        easing: 'ease-out'
      }
    )

    setTimeout(() => img.remove(), duration * 1000)
  }
}
