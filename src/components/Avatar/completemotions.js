// 風船の動作（浮く／揺れる／消える） を制御するCanvas描画用関数
// アバタージャンプのアニメーションもここで制御
// TimeWheel/src/components/Avatar/JS/completemotions.js
// 風船の動作（浮く／揺れる／消える） を制御するCanvas描画用関数
// TimeWheel/src/components/Avatar/JS/completemotions.js
// 完全な DOM 版バルーンアニメーション
export function launchBalloonAnimation({
  count = 10,
  baseSize = 80,
  randomSize = true,
  sway = true
} = {}) {

  const balloonImages = [
    '/src/components/Avatar/CompleteMotions/BalloonRed.png',
    '/src/components/Avatar/CompleteMotions/BalloonBlue.png',
    '/src/components/Avatar/CompleteMotions/BalloonYellow.png',
    '/src/components/Avatar/CompleteMotions/BalloonGreen.png',
    '/src/components/Avatar/CompleteMotions/BalloonOrange.png',
    '/src/components/Avatar/CompleteMotions/BalloonPink.png'
  ];

  for (let i = 0; i < count; i++) {
    const img = document.createElement('img');
    img.src = balloonImages[Math.floor(Math.random() * balloonImages.length)];
    img.classList.add('floating-balloon');

    const size = randomSize
      ? baseSize * (0.6 + Math.random() * 0.6)
      : baseSize;

    img.style.width = `${size}px`;
    img.style.position = 'fixed';
    img.style.left = Math.random() * 80 + 10 + '%';
    img.style.bottom = '-150px';
    img.style.zIndex = 9999;
    img.style.pointerEvents = 'none';

    document.body.appendChild(img);

    const duration = 6 + Math.random() * 4;

    img.animate(
      [
        {
          transform: `translate(0, 0)`
        },
        {
          transform: `translate(${sway ? (Math.random() * 50 - 25) : 0}px, -120vh)`
        }
      ],
      {
        duration: duration * 1000,
        easing: 'ease-out'
      }
    );

    setTimeout(() => img.remove(), duration * 1000);
  }
}
