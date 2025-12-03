//固定候補リストの値をTimeSetup.vueで出力して そのユーザーが保存した値をscheduleStore.jsに保存する

export const mainActivities = [
    { name: '学校', defaultStart: '08:00', defaultEnd: '18:00' },
    { name: '早番シフト', defaultStart: '07:00', defaultEnd: '15:00' },
    { name: '日勤帯', defaultStart: '08:30', defaultEnd: '17:30' },
    { name: '夜勤帯①', defaultStart: '16:00', defaultEnd: '09:00' },
    { name: '夜勤帯②', defaultStart: '22:00', defaultEnd: '06:00' },
    { name: '休日', defaultStart: '', defaultEnd: '' },
    { name: 'カスタム', defaultStart: '', defaultEnd: '' },
    { name: "なし", defaultStart: null, defaultEnd: null
    },
  ]
  