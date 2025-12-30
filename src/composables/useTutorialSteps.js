// src/composables/useTutorialSteps.js

export function getOpeningSteps() {
    return [
      {
        selector: '.next-button',
        message: 'このボタンをクリックしてスケジュールを作成しよう',
      },
      {
        selector: '.settings-btn',
        message: 'データ管理：過去のTodoリストの中身や削除ができます。',
      },
      {
        selector: '.btn-outline',
        message: '過去7日間の達成率を見てみよう！',
      },
    ]
  }
  
  export function getTimeSetupSteps() {
    return [
      {
        selector: 'label[for="wakeTime"]',
        message: '起床時間を設定しよう',
      },
      {
        selector: 'label[for="sleepTime"]',
        message: '就寝時間を設定しよう',
      },
      {
        selector: '#mainActivity',
        message: 'MAIN ACTIVITY（仕事・学校など）を選択しよう',
      },
      {
        selector: '.btn-outline',
        message: 'あなたの休憩の取り方を設定しよう',
      },
      {
        selector: '.btn-neon',
        message: '次は副活動を入力しよう！',
      },
    ]
  }

export function getActivityInputSteps() {
    return [
      {
        selector: '.tag.btn-outline',
        message: '今日やる作業・趣味をこの中から選んでね',
      },
      {
        selector: '.manual-input',
        message: 'この入力欄で手入力の作業を追加できるよ',
      },
      {
        selector: '.btn-neon',
        message: 'もしカスタムの作業があればここを押して追加してね',
      },
      {
        selector: '#save',
        message: '次でスケジュールが生成されるよ',
      },
    ]
  }
  
// src/composables/useTutorialSteps.js

export function getSchedulePreviewSteps() {
    return [
      {
        selector: '#wheel_schedule',
        message: '今日の作業の時間配分をホイール型で確認できるよ',
      },
      {
        selector: '#list_schedule',
        message: '今日の作業をリスト形式でも確認できるよ',
      },
      {
        selector: '.edit-toggle',
        message: 'ここから今日のスケジュールを再編集できるよ',
      },
      {
        selector: '.btn-outline.back-btn',
        message: 'Top画面に戻るよ',
      },
      {
        selector: '.btn-neon.confirm-btn',
        message: 'このボタンで確定。次のページでTodoリストを作成するよ',
      },
    ]
  }
  