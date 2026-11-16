const tracks = {
  forest: {start: 0, loop: true},
  beach: {start: 0, loop: true},
  house: {start: 145, loop: false},
  finale: {start: 117, loop: false}
};

const houseLyrics = [
  [145, 'her sweet caress'],
  [147.50, 'With a stare so pure, a gaze so fine'],
  [151.66, "I'll be hers alone 'til the end of time"],
  [155.54, "Oh, the city's alive, but I'm in a trance"],
  [160.28, "Darling, I'm frozen just by your glance"],
  [163.78, "I'm the stone that's been turned, it's too late to flee"],
  [168.36, 'Darling, just one look is Medusa to me']
];
const endOfLyrics = 172.55;

export function createMusic(player, caption) {
  let active, paused = false, blobUrl;
  player.volume = .68;

  function updateLyrics() {
    const time = player.currentTime;
    const cue = active === 'house' && !paused && !player.paused && time < endOfLyrics
      ? houseLyrics.findLast(([start]) => time >= start)
      : undefined;
    const text = cue?.[1] ?? '';
    if (caption.textContent === text) return;
    caption.textContent = text;
    caption.hidden = !text;
  }

  function resume() {
    if (active && !paused && player.paused && !player.ended) {
      player.play().catch(() => {
        // A later click can resume playback if the browser blocks autoplay.
      });
    }
  }

  function start(name) {
    player.pause();
    if (blobUrl) {
      player.removeAttribute('src');
      URL.revokeObjectURL(blobUrl);
      blobUrl = undefined;
    }
    active = name;
    if (name) {
      const data = atob(document.getElementById('music-' + name).textContent);
      const bytes = new Uint8Array(data.length);
      for(let i=0;i<data.length;i++) bytes[i]=data.charCodeAt(i);
      blobUrl = URL.createObjectURL(new Blob([bytes], {type: 'audio/mpeg'}));
      player.src = blobUrl;
      player.loop = tracks[name].loop;
      player.currentTime = tracks[name].start;
      resume();
    } else {
      player.load();
    }
    updateLyrics();
  }

  player.addEventListener('ended', () => {
    if (active === 'house' && player.ended) start('finale');
    updateLyrics();
  });
  for (const event of ['playing', 'pause', 'seeked', 'timeupdate']) {
    player.addEventListener(event, updateLyrics);
  }

  return {
    start,
    resume,
    updateLyrics,
    setPaused(value) {
      if (paused === value) return;
      paused = value;
      if (paused) player.pause();
      else resume();
      updateLyrics();
    },
    setMuted(value) {
      player.muted = value;
      resume();
    }
  };
}

