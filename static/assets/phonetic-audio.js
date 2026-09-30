const buttons = [...document.querySelectorAll('.ipa-play')];
const note = document.querySelector('.phonetic-audio-status');
const player = document.getElementById('phonetic-audio-player');
player.preload = 'none';
let current;
const reset = () => {
  if (current) {
    current.setAttribute('aria-pressed', 'false');
    current.querySelector('span').textContent = '▶';
  }
  current = undefined;
};
player.addEventListener('ended', () => {
  reset();
  if (note) note.textContent = '合成示范播放结束。';
});
player.addEventListener('error', () => {
  reset();
  if (note) note.textContent = '音频暂时无法加载，请稍后重试。';
});
for (const button of buttons) {
  button.addEventListener('click', async () => {
    player.pause();
    const previous = current;
    reset();
    if (previous === button) {
      if (note) note.textContent = '已停止播放。';
      return;
    }
    current = button;
    const source = new URL(button.dataset.audio, location.href);
    if (source.origin !== location.origin || !source.pathname.startsWith('/audio/hainan-toponymy/')) return reset();
    player.src = source.href;
    button.setAttribute('aria-pressed', 'true');
    button.querySelector('span').textContent = '■';
    if (note) note.textContent = button.getAttribute('aria-label') + '（非母语录音）。';
    try {
      await player.play();
    } catch {
      // A later click may replace a still-loading clip; do not reset its button.
      if (current === button) {
        reset();
        if (note) note.textContent = '未能播放，请再次点击试听按钮。';
      }
    }
  });
}
