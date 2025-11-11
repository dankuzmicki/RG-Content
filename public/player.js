(() => {
  const START_TIME = 10;
  const END_TIME = 15;

  function setStatus(message, isError = false) {
    const statusElement = document.getElementById('player-status');
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.classList.toggle('error', isError);
  }

  async function requestOtp() {
    const response = await fetch('/api/otp', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to obtain OTP (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  function attachRangeGuards(player) {
    let skipGuard = false;

    const clampToRange = (targetTime) => {
      const bounded = Math.min(Math.max(targetTime, START_TIME), END_TIME);
      skipGuard = true;
      player.currentTime(bounded);
    };

    player.on('load', function onLoad() {
      clampToRange(START_TIME);
      player.play();
      setStatus('Playing authorised segment (10s - 15s).');
    });

    player.on('timeupdate', () => {
      if (skipGuard) {
        skipGuard = false;
        return;
      }
      if (player.currentTime() >= END_TIME) {
        player.pause();
        player.currentTime(START_TIME);
        setStatus('Playback finished. Rewinded to 10s.');
      }
    });

    player.on('seeking', () => {
      if (skipGuard) {
        skipGuard = false;
        return;
      }
      const current = player.currentTime();
      if (current < START_TIME || current > END_TIME) {
        clampToRange(current);
      }
    });
  }

  async function initialisePlayer() {
    const container = document.getElementById('vdocipher-player');
    if (!container) {
      return;
    }

    try {
      setStatus('Requesting VdoCipher OTP…');
      const { otp, playbackInfo } = await requestOtp();
      if (!otp || !playbackInfo) {
        throw new Error('OTP response missing required fields.');
      }

      const player = new VdoPlayer({
        otp,
        playbackInfo,
        container,
      });

      attachRangeGuards(player);
    } catch (error) {
      console.error('Player setup failed:', error);
      setStatus('Unable to start playback. See console for details.', true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisePlayer);
  } else {
    initialisePlayer();
  }
})();
