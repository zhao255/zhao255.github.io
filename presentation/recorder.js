// Screen recorder for the presenter view: the entire screen, the computer's
// audio output and the microphone, mixed into one video file, or the audio alone.
//
// Chrome and Edge only give system audio when an entire screen is shared with
// "Also share system audio" ticked. In the Windows presentation app the screen
// and system audio are captured without asking.
//
// Recordings go to a chosen folder: the app writes them with Node, and Chrome
// and Edge through the File System Access API, with the folder remembered in
// IndexedDB. Each chunk is written as it arrives. With no folder, the browser
// asks where to save (or downloads) when the recording stops.
(()=>{
  "use strict";

  const $ = selector => document.querySelector(selector);
  const startButton = $("#rec-start");
  const pauseButton = $("#rec-pause");
  const stopButton = $("#rec-stop");
  const live = $("#rec-live");
  const timeLabel = $("#rec-time");
  const level = $("#rec-level");
  const note = $("#rec-note");
  const micBox = $("#rec-mic");
  const systemBox = $("#rec-system");
  const modeSelect = $("#rec-mode");
  const folderGroup = $("#rec-folder-group");
  const folderButton = $("#rec-folder");
  const folderName = $("#rec-folder-name");
  const folderClear = $("#rec-folder-clear");
  const app = window.presentationApp?.recordings || null;
  const audioOnly = () => modeSelect.value === "audio";
  const startLabel = startButton.lastChild;
  modeSelect.addEventListener("change", () => {
    startLabel.textContent = audioOnly() ? "Record audio" : "Record screen";
  });
  const clock = seconds => {
    const whole = Math.floor(seconds);
    const hours = Math.floor(whole / 3600);
    const rest = Math.floor(whole % 3600 / 60) + ":" + String(whole % 60).padStart(2, "0");
    return hours ? hours + ":" + rest.padStart(5, "0") : rest;
  };

  let session = null;

  function say(text, tone = "info", action = null) {
    note.textContent = text;
    note.dataset.tone = tone;
    note.hidden = !text;
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", action.run);
      note.append(button);
    }
  }

  /* ---------- Save folder ---------- */

  // {name, path?, handle?}: path in the app, a directory handle in the browser.
  let folder = null;
  const browserFolders = !app && "showDirectoryPicker" in window && "indexedDB" in window;

  function store(mode, action) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open("jack-presentation", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("handles");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const request = action(open.result.transaction("handles", mode).objectStore("handles"));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      };
    });
  }
  const saveHandle = handle => store("readwrite", objects => handle ? objects.put(handle, "recording-folder") : objects.delete("recording-folder"));
  const loadHandle = () => store("readonly", objects => objects.get("recording-folder"));

  function showFolder() {
    folderGroup.hidden = !app && !browserFolders;
    folderName.textContent = folder ? "Save to: " + folder.name : "Choose save folder";
    folderButton.title = folder
      ? "Recordings are saved to " + (folder.path || "the folder “" + folder.name + "”") + ". Click to change."
      : "Choose a folder so recordings save there without asking";
    folderClear.hidden = !folder || Boolean(app);
  }

  async function loadFolder() {
    try {
      if (app) folder = await app.folder();
      else if (browserFolders) {
        const handle = await loadHandle();
        folder = handle ? { name: handle.name, handle } : null;
      }
    } catch {
      folder = null;
    }
    showFolder();
  }

  async function chooseFolder() {
    try {
      if (app) {
        folder = await app.choose() || folder;
      } else {
        const handle = await window.showDirectoryPicker({ id: "presentation-recordings", mode: "readwrite", startIn: folder?.handle || "videos" });
        folder = { name: handle.name, handle };
        await saveHandle(handle).catch(() => {});
      }
      showFolder();
      if (folder) say("New recordings will be saved to " + (folder.path || "“" + folder.name + "”") + ".", "done");
    } catch (error) {
      if (error.name !== "AbortError") say("That folder couldn’t be used: " + error.message, "warn");
    }
  }

  async function clearFolder() {
    folder = null;
    await saveHandle(null).catch(() => {});
    showFolder();
    say("Recordings will ask where to save when they stop.");
  }

  // The browser asks again for write access after a restart. That prompt needs
  // the click that started the recording, so it is asked before anything else.
  async function folderReady() {
    if (!folder?.handle) return Boolean(folder);
    try {
      const options = { mode: "readwrite" };
      if (await folder.handle.queryPermission(options) === "granted") return true;
      return await folder.handle.requestPermission(options) === "granted";
    } catch {
      return false;
    }
  }

  // A sink writes the recording into the folder chunk by chunk.
  async function openSink(name) {
    if (app) {
      const file = await app.open(name);
      return {
        name: file.name,
        where: folder.path,
        write: async blob => app.write(file.id, await blob.arrayBuffer()),
        close: () => app.close(file.id),
        reveal: () => app.reveal(file.path)
      };
    }
    const handle = await folder.handle.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    return {
      name,
      where: "“" + folder.name + "”",
      write: blob => writable.write(blob),
      close: () => writable.close(),
      abort: () => writable.abort().catch(() => {})
    };
  }

  /* ---------- Recording ---------- */

  function pickType(audio) {
    const candidates = audio
      ? ["audio/mp4;codecs=mp4a.40.2", "audio/mp4;codecs=opus", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
      : ["video/mp4;codecs=avc1.640028,opus", "video/mp4;codecs=avc1,opus", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
  }

  function fileName(type) {
    const now = new Date();
    const two = value => String(value).padStart(2, "0");
    const stamp = now.getFullYear() + "-" + two(now.getMonth() + 1) + "-" + two(now.getDate())
      + "-" + two(now.getHours()) + two(now.getMinutes()) + two(now.getSeconds());
    const extension = type.startsWith("audio/mp4") ? ".m4a" : type.startsWith("audio/") ? ".webm" : type.startsWith("video/mp4") ? ".mp4" : ".webm";
    return "presentation-" + (type.startsWith("audio/") ? "audio-" : "recording-") + stamp + extension;
  }

  function setRecordingUi(recording) {
    startButton.hidden = recording;
    modeSelect.disabled = recording;
    micBox.disabled = recording;
    systemBox.disabled = recording;
    folderButton.disabled = recording;
    folderClear.disabled = recording;
    live.hidden = !recording;
    pauseButton.hidden = !recording;
    stopButton.hidden = !recording;
    document.body.dataset.recording = String(recording);
  }

  function elapsed() {
    if (!session) return 0;
    const running = session.pausedAt ?? performance.now();
    return (running - session.startedAt - session.pausedTotal) / 1000;
  }

  function tick() {
    if (!session) return;
    timeLabel.textContent = clock(elapsed());
    if (session.analyser) {
      const data = new Uint8Array(session.analyser.fftSize);
      session.analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const sample of data) peak = Math.max(peak, Math.abs(sample - 128));
      level.style.transform = "scaleX(" + Math.min(1, peak / 64).toFixed(3) + ")";
    }
    requestAnimationFrame(tick);
  }

  async function start() {
    if (!window.MediaRecorder || !navigator.mediaDevices) {
      say("This browser can’t record. Use Chrome or Edge.", "warn");
      return;
    }
    const audio = audioOnly();
    const wantMic = micBox.checked;
    const wantSystem = systemBox.checked;
    if (audio && !wantMic && !wantSystem) {
      say("Tick Microphone, System audio or both to record audio.", "warn");
      return;
    }
    const warnings = [];
    const toFolder = folder ? await folderReady() : false;
    if (folder && !toFolder) warnings.push("No permission to save in “" + folder.name + "”, so you’ll be asked where to save.");

    // Screen capture: the picture for a screen recording, and the only way a
    // page can get the computer's sound. In audio-only mode the picture is dropped.
    let display = null;
    if (!audio || wantSystem) {
      if (!navigator.mediaDevices.getDisplayMedia) {
        say("This browser can’t capture the screen or system audio. Use Chrome or Edge.", "warn");
        return;
      }
      if (!app) say(audio
        ? "Chrome needs a screen to share the computer’s sound: choose “Entire screen” and tick “Also share system audio”. Only the sound is kept."
        : wantSystem
          ? "Choose “Entire screen” and tick “Also share system audio” to include the computer’s sound."
          : "Choose “Entire screen” to record everything.");
      try {
        display = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor", frameRate: { ideal: audio ? 1 : 30 }, width: { ideal: audio ? 640 : 1920 }, height: { ideal: audio ? 360 : 1080 } },
          audio: wantSystem ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: false } : false,
          systemAudio: wantSystem ? "include" : "exclude",
          selfBrowserSurface: "include",
          monitorTypeSurfaces: "include",
          surfaceSwitching: "exclude"
        });
      } catch (error) {
        say(error.name === "NotAllowedError" ? "Recording cancelled." : "The screen couldn’t be captured: " + error.message, "warn");
        return;
      }
    }

    const surface = display?.getVideoTracks()[0]?.getSettings().displaySurface;
    if (!audio && surface && surface !== "monitor") warnings.push("You picked a " + surface + ", not the entire screen.");
    if (wantSystem && display && !display.getAudioTracks().length) warnings.push(app ? "No system audio was available." : "No system audio: share an entire screen and tick “Also share system audio”.");
    // Keep a stopped video track around only as the signal for "Stop sharing".
    const shareEnded = display ? (display.getAudioTracks()[0] || display.getVideoTracks()[0]) : null;
    if (audio && display) display.getVideoTracks().forEach(track => { if (track !== shareEnded) track.stop(); });

    let mic = null;
    if (wantMic) {
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch {
        warnings.push("The microphone is blocked, so it isn’t being recorded.");
      }
    }

    // Mix system audio and the microphone into one track.
    const context = new AudioContext();
    const mix = context.createMediaStreamDestination();
    let analyser = null;
    let audioSources = 0;
    if (display?.getAudioTracks().length) {
      context.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(mix);
      audioSources += 1;
    }
    if (mic) {
      const source = context.createMediaStreamSource(mic);
      source.connect(mix);
      analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioSources += 1;
    }
    const release = () => {
      display?.getTracks().forEach(track => track.stop());
      mic?.getTracks().forEach(track => track.stop());
      context.close().catch(() => {});
    };
    if (audio && !audioSources) {
      release();
      say("No audio source was available, so nothing is being recorded. " + warnings.join(" "), "warn");
      return;
    }

    const tracks = [...(audio ? [] : display.getVideoTracks()), ...(audioSources ? mix.stream.getAudioTracks() : [])];
    const type = pickType(audio);
    let recorder;
    try {
      recorder = new MediaRecorder(new MediaStream(tracks), {
        ...(type ? { mimeType: type } : {}),
        ...(audio ? {} : { videoBitsPerSecond: 6_000_000 }),
        audioBitsPerSecond: 192_000
      });
    } catch (error) {
      release();
      say("The recorder couldn’t start: " + error.message, "warn");
      return;
    }

    const mimeType = recorder.mimeType || type || (audio ? "audio/webm" : "video/webm");
    let sink = null;
    if (toFolder) {
      try {
        sink = await openSink(fileName(mimeType));
      } catch (error) {
        warnings.push("The file couldn’t be created in “" + folder.name + "” (" + error.message + "), so you’ll be asked where to save.");
      }
    }

    // Chunks are also kept in memory, so the recording can still be saved
    // another way if writing to the folder fails part way.
    session = { recorder, display, mic, context, analyser, sink, writing: Promise.resolve(), writeError: null, chunks: [], type: mimeType, startedAt: performance.now(), pausedAt: null, pausedTotal: 0 };
    const current = session;
    recorder.addEventListener("dataavailable", event => {
      if (!event.data.size) return;
      current.chunks.push(event.data);
      if (current.sink && !current.writeError) {
        current.writing = current.writing.then(() => current.sink.write(event.data)).catch(error => { current.writeError ||= error; });
      }
    });
    recorder.addEventListener("stop", () => void finish());
    shareEnded?.addEventListener("ended", () => stop());
    recorder.start(1000);
    setRecordingUi(true);
    pauseButton.textContent = "Pause";
    const sources = [audio ? "" : "screen", display?.getAudioTracks().length ? "system audio" : "", mic ? "microphone" : ""].filter(Boolean).join(", ");
    const destination = sink ? " Saving to " + sink.where + " as " + sink.name + "." : "";
    say((warnings.length ? warnings.join(" ") + " " : "") + "Recording " + (audio ? "audio only: " : "") + sources + "." + destination, warnings.length ? "warn" : "live");
    requestAnimationFrame(tick);
  }

  function togglePause() {
    if (!session) return;
    const { recorder } = session;
    if (recorder.state === "recording") {
      recorder.pause();
      session.pausedAt = performance.now();
      pauseButton.textContent = "Resume";
      document.body.dataset.recording = "paused";
    } else if (recorder.state === "paused") {
      recorder.resume();
      session.pausedTotal += performance.now() - session.pausedAt;
      session.pausedAt = null;
      pauseButton.textContent = "Pause";
      document.body.dataset.recording = "true";
    }
  }

  function stop() {
    if (!session || session.stopping) return;
    session.stopping = true;
    session.saveWithPicker = navigator.userActivation?.isActive && "showSaveFilePicker" in window;
    if (session.recorder.state !== "inactive") session.recorder.stop();
    else void finish();
  }

  async function finish() {
    if (!session || session.finished) return;
    const done = session;
    done.finished = true;
    const { display, mic, context, chunks, type, sink, saveWithPicker } = done;
    const seconds = elapsed();
    display?.getTracks().forEach(track => track.stop());
    mic?.getTracks().forEach(track => track.stop());
    context.close().catch(() => {});
    session = null;
    setRecordingUi(false);
    const blob = new Blob(chunks, { type: type.split(";")[0] });
    const name = fileName(type);
    const size = (blob.size / 1048576).toFixed(blob.size > 1048576 * 100 ? 0 : 1) + " MB";
    const summary = " (" + clock(seconds) + ", " + size + ").";

    if (sink) {
      say("Finishing the file…");
      await done.writing;
      if (!done.writeError) {
        try {
          await sink.close();
          say("Saved " + sink.name + " to " + sink.where + summary, "done", sink.reveal ? { label: "Show in folder", run: () => sink.reveal() } : null);
          return;
        } catch (error) {
          done.writeError = error;
        }
      }
      await sink.abort?.();
      say("Writing to the folder failed (" + done.writeError.message + "), so the recording is downloading instead.", "warn");
    } else if (saveWithPicker) {
      try {
        const extension = name.slice(name.lastIndexOf("."));
        const handle = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: type.startsWith("audio/") ? "Audio" : "Video", accept: { [type.split(";")[0]]: [extension] } }] });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        say("Saved " + handle.name + summary, "done");
        return;
      } catch (error) {
        if (error.name !== "AbortError") say("Saving in place failed, so the file is downloading instead.", "warn");
      }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
    if (!sink) say("Downloaded " + name + summary, "done");
  }

  startButton.addEventListener("click", () => void start());
  pauseButton.addEventListener("click", togglePause);
  stopButton.addEventListener("click", stop);
  folderButton.addEventListener("click", () => void chooseFolder());
  folderClear.addEventListener("click", () => void clearFolder());
  window.addEventListener("beforeunload", event => {
    if (!session) return;
    event.preventDefault();
    event.returnValue = "";
  });
  void loadFolder();
})();
