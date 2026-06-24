const FPS = 30;
const MAX_FRAMES = 90;
const FORWARD_SPEED = 1.5;
const REVERSE_SPEED = 2.25;

export function bindAvatar(source) {
  const profile = document.querySelector(".profile");
  const video = document.getElementById("avatarVideo");
  const canvas = document.getElementById("avatarCanvas");
  if (!profile || !(video instanceof HTMLVideoElement) || !(canvas instanceof HTMLCanvasElement)) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  video.src = source;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const frames = [];
  let captureId = 0;
  let reverseId = 0;
  let reverseIndex = 0;
  let lastReverseStep = 0;

  const showVideo = () => {
    video.classList.remove("is-hidden");
    canvas.classList.add("is-hidden");
  };

  const showCanvas = () => {
    canvas.classList.remove("is-hidden");
    video.classList.add("is-hidden");
  };

  const drawCover = (sourceElement, targetContext = context) => {
    const sourceWidth = sourceElement.videoWidth || sourceElement.width;
    const sourceHeight = sourceElement.videoHeight || sourceElement.height;
    if (!sourceWidth || !sourceHeight) return false;

    const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;

    targetContext.clearRect(0, 0, canvas.width, canvas.height);
    targetContext.drawImage(sourceElement, x, y, width, height);
    return true;
  };

  const captureFrame = () => {
    const frame = document.createElement("canvas");
    frame.width = canvas.width;
    frame.height = canvas.height;
    const frameContext = frame.getContext("2d");
    if (!frameContext) return;

    if (!drawCover(video, frameContext)) return;
    frames.push(frame);
    if (frames.length > MAX_FRAMES) frames.shift();
  };

  const stopCapture = () => {
    if (!captureId) return;
    cancelAnimationFrame(captureId);
    captureId = 0;
  };

  const stopReverse = () => {
    if (!reverseId) return;
    cancelAnimationFrame(reverseId);
    reverseId = 0;
    lastReverseStep = 0;
  };

  const captureLoop = () => {
    if (video.paused || video.ended) {
      captureId = 0;
      return;
    }

    captureFrame();
    captureId = requestAnimationFrame(captureLoop);
  };

  const reverseLoop = (time) => {
    if (!lastReverseStep || time - lastReverseStep >= 1000 / FPS) {
      const frame = frames[Math.floor(reverseIndex)];
      if (frame) context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      reverseIndex -= REVERSE_SPEED;
      lastReverseStep = time;
    }

    if (reverseIndex < 0) {
      reverseId = 0;
      lastReverseStep = 0;
      video.currentTime = 0;
      return;
    }

    reverseId = requestAnimationFrame(reverseLoop);
  };

  const playForward = () => {
    stopReverse();
    stopCapture();
    showVideo();

    if (video.ended || video.currentTime >= video.duration) video.currentTime = 0;
    video.playbackRate = FORWARD_SPEED;
    frames.length = 0;
    captureFrame();
    video.play().then(() => {
      captureId = requestAnimationFrame(captureLoop);
    }).catch(() => {
      showCanvas();
    });
  };

  const playBackward = () => {
    stopCapture();
    stopReverse();
    video.pause();
    captureFrame();
    showCanvas();
    reverseIndex = frames.length - 1;
    reverseId = requestAnimationFrame(reverseLoop);
  };

  video.addEventListener("loadeddata", () => {
    drawCover(video);
    showCanvas();
  }, { once: true });

  video.addEventListener("ended", () => {
    stopCapture();
    captureFrame();
  });

  video.load();
  showCanvas();
  profile.addEventListener("pointerenter", playForward);
  profile.addEventListener("pointerleave", playBackward);
}
