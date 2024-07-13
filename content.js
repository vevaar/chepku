// content.js
(function () {
  let startPointer, endPointer, progressBar, infoDisplay, shareButton;
  let activeDragPointer = null;

  function initializePointers() {
    progressBar = document.querySelector(".ytp-progress-bar");
    if (!progressBar) return;

    startPointer = createPointer("start");
    endPointer = createPointer("end");
    infoDisplay = createInfoDisplay();
    shareButton = createShareButton();

    progressBar.appendChild(startPointer);
    progressBar.appendChild(endPointer);
    document.querySelector(".ytp-chrome-bottom").appendChild(infoDisplay);
    infoDisplay.appendChild(shareButton);

    makeDraggable(startPointer);
    makeDraggable(endPointer);
  }

  function createPointer(type) {
    const pointer = document.createElement("div");
    pointer.className = `custom-pointer ${type}-pointer`;
    pointer.style.left = type === "start" ? "0%" : "100%";
    return pointer;
  }

  function createInfoDisplay() {
    const display = document.createElement("div");
    display.className = "custom-info-display";
    display.innerHTML =
      '<span class="start-time"></span> | <span class="end-time"></span>';
    return display;
  }

  function createShareButton() {
    const button = document.createElement("button");
    button.textContent = "Trim Video";
    button.className = "custom-share-button";
    button.disabled = true;
    button.addEventListener("click", sendVideoInfoToBackend);
    return button;
  }

  function makeDraggable(pointer) {
    pointer.addEventListener("mousedown", startDragging);
  }

  function startDragging(e) {
    e.preventDefault();
    activeDragPointer = e.target;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDragging);
  }

  function drag(e) {
    if (!activeDragPointer) return;

    const rect = progressBar.getBoundingClientRect();
    let position = (e.clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(position, 1));

    activeDragPointer.style.left = `${position * 100}%`;

    updateDisplay();
  }

  function stopDragging() {
    activeDragPointer = null;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", stopDragging);
  }

  function updateDisplay() {
    const video = document.querySelector("video");
    if (!video) return;

    const duration = video.duration;
    const startTime = (parseFloat(startPointer.style.left) / 100) * duration;
    const endTime = (parseFloat(endPointer.style.left) / 100) * duration;

    infoDisplay.querySelector(".start-time").textContent = `Start: ${formatTime(
      startTime
    )}`;
    infoDisplay.querySelector(".end-time").textContent = `End: ${formatTime(
      endTime
    )}`;

    // Enable the share button if both start and end times are set
    shareButton.disabled = startTime === 0 && endTime === duration;
  }

  function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getSeconds();
    const ms = date.getMilliseconds();

    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${mm}:${ss.toString().padStart(2, "0")}.${ms
        .toString()
        .padStart(3, "0")}`;
    }
  }

  let progressEventSource;

  function createProgressDisplay() {
    const display = document.createElement("div");
    display.className = "custom-progress-display";
    display.style.display = "none";
    document.querySelector(".ytp-chrome-bottom").appendChild(display);
    return display;
  }

  const progressDisplay = createProgressDisplay();

  function updateProgressDisplay(message) {
    progressDisplay.textContent = message;
    progressDisplay.style.display = "block";
  }

  async function sendVideoInfoToBackend() {
    const video = document.querySelector("video");
    if (!video) return;

    const duration = video.duration;
    const startTime = Math.floor(
      (parseFloat(startPointer.style.left) / 100) * duration
    );
    const endTime = Math.floor(
      (parseFloat(endPointer.style.left) / 100) * duration
    );

    const videoUrl = window.location.href;

    try {
      shareButton.disabled = true;
      shareButton.textContent = "Processing...";

      // Start listening for progress updates
      startProgressListener();

      const response = await fetch("http://localhost:3000/trim-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Server response was not ok");
      }

      const result = await response.json();
      console.log("Trim request sent:", result);
    } catch (error) {
      console.error("Error sending trimming request:", error);
      updateProgressDisplay(
        "An error occurred while sending the trimming request. Please try again."
      );
      stopProgressListener();
    }
  }

  function startProgressListener() {
    progressEventSource = new EventSource("http://localhost:3000/progress");

    progressEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        updateProgressDisplay(data.message);
        if (data.message === "Video trimming completed" && data.filePath) {
          downloadTrimmedVideo(data.filePath);
          stopProgressListener();
        }
      } else if (data.error) {
        updateProgressDisplay(data.error);
        stopProgressListener();
      }
    };

    progressEventSource.onerror = () => {
      console.error("EventSource failed.");
      stopProgressListener();
    };
  }

  function stopProgressListener() {
    if (progressEventSource) {
      progressEventSource.close();
    }
    shareButton.disabled = false;
    shareButton.textContent = "Trim Video";
  }

  function downloadTrimmedVideo(filePath) {
    const downloadUrl = `http://localhost:3000/download/${filePath}`;

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    a.download = filePath;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);

    updateProgressDisplay(
      "Download started. If it doesn't begin automatically, click here to download."
    );
    progressDisplay.onclick = () => {
      a.click();
    };
  }

  // Add this to your existing styles
  const style = document.createElement("style");
  style.textContent = `
  .custom-progress-display {
    position: absolute;
    bottom: 70px;
    left: 12px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
  }
`;
  document.head.appendChild(style);

  // Initialize pointers when the video player is ready
  const observer = new MutationObserver(() => {
    if (document.querySelector(".ytp-progress-bar")) {
      initializePointers();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
