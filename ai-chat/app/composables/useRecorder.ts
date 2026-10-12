export function useRecorder() {
  const recording = ref(false);
  const requesting = ref(false);
  const duration = ref(0);
  const error = ref("");
  const blob = shallowRef<Blob>();
  const url = ref("");
  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let disposed = false;
  function release() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    clearInterval(timer);
  }
  function clear() {
    if (url.value) URL.revokeObjectURL(url.value);
    url.value = "";
    blob.value = undefined;
  }
  async function start() {
    if (requesting.value || recording.value) return;
    error.value = "";
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      error.value = "Recording isn't supported here. You can still explore with the sample audio.";
      return;
    }
    requesting.value = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) {
        release();
        return;
      }
      clear();
      duration.value = 0;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(
        (type) => MediaRecorder.isTypeSupported(type)
      );
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        if (!disposed) {
          blob.value = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
          url.value = URL.createObjectURL(blob.value);
        }
        release();
        recording.value = false;
      };
      recorder.onerror = () => {
        error.value = "Recording failed. Try again or use the sample.";
        stop();
      };
      recorder.start();
      recording.value = true;
      timer = setInterval(() => {
        duration.value++;
        if (duration.value >= 60) stop();
      }, 1000);
    } catch {
      release();
      error.value =
        "Microphone access wasn't available. Check your permission or try the sample audio.";
    } finally {
      requesting.value = false;
    }
  }
  function stop() {
    if (recorder?.state === "recording") recorder.stop();
    release();
    recording.value = false;
  }
  onBeforeRouteLeave(() => {
    disposed = true;
    stop();
    clear();
  });
  onBeforeUnmount(() => {
    disposed = true;
    stop();
    clear();
  });
  return { recording, requesting, duration, error, blob, url, start, stop, clear };
}
