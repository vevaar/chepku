(function() {
    let startPointer, endPointer, progressBar, infoDisplay, shareButton;
    let activeDragPointer = null;
  
    function initializePointers() {
      progressBar = document.querySelector('.ytp-progress-bar');
      if (!progressBar) return;
  
      startPointer = createPointer('start');
      endPointer = createPointer('end');
      infoDisplay = createInfoDisplay();
      shareButton = createShareButton();
  
      progressBar.appendChild(startPointer);
      progressBar.appendChild(endPointer);
      document.querySelector('.ytp-chrome-bottom').appendChild(infoDisplay);
      infoDisplay.appendChild(shareButton);
  
      makeDraggable(startPointer);
      makeDraggable(endPointer);
    }
  
    function createPointer(type) {
      const pointer = document.createElement('div');
      pointer.className = `custom-pointer ${type}-pointer`;
      pointer.style.left = type === 'start' ? '0%' : '100%';
      return pointer;
    }
  
    function createInfoDisplay() {
      const display = document.createElement('div');
      display.className = 'custom-info-display';
      display.innerHTML = '<span class="start-time"></span> | <span class="end-time"></span>';
      return display;
    }
  
    function createShareButton() {
      const button = document.createElement('button');
      button.textContent = 'Share';
      button.className = 'custom-share-button';
      button.disabled = true;
      button.addEventListener('click', shareVideoSection);
      return button;
    }
  
    function makeDraggable(pointer) {
      pointer.addEventListener('mousedown', startDragging);
    }
  
    function startDragging(e) {
      e.preventDefault();
      activeDragPointer = e.target;
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDragging);
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
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDragging);
    }
  
    function updateDisplay() {
      const video = document.querySelector('video');
      if (!video) return;
  
      const duration = video.duration;
      const startTime = parseFloat(startPointer.style.left) / 100 * duration;
      const endTime = parseFloat(endPointer.style.left) / 100 * duration;
  
      infoDisplay.querySelector('.start-time').textContent = `Start: ${formatTime(startTime)}`;
      infoDisplay.querySelector('.end-time').textContent = `End: ${formatTime(endTime)}`;
  
      // Enable the share button if both start and end times are set
      shareButton.disabled = (startTime === 0 && endTime === duration);
    }
  
    function formatTime(seconds) {
      const date = new Date(seconds * 1000);
      const hh = date.getUTCHours();
      const mm = date.getUTCMinutes();
      const ss = date.getSeconds();
      const ms = date.getMilliseconds();
  
      if (hh) {
        return `${hh}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
      } else {
        return `${mm}:${ss.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      }
    }
  
    function shareVideoSection() {
      const video = document.querySelector('video');
      if (!video) return;
  
      const duration = video.duration;
      const startTime = Math.floor(parseFloat(startPointer.style.left) / 100 * duration);
      const endTime = Math.floor(parseFloat(endPointer.style.left) / 100 * duration);
  
      const videoUrl = new URL(window.location.href);
      videoUrl.searchParams.set('t', startTime);
  
      console.log('Video Section Share:');
      console.log(`URL: ${videoUrl.toString()}`);
      console.log(`Start Time: ${startTime} seconds`);
      console.log(`End Time: ${endTime} seconds`);
    }
  
    // Initialize pointers when the video player is ready
    const observer = new MutationObserver(() => {
      if (document.querySelector('.ytp-progress-bar')) {
        initializePointers();
        observer.disconnect();
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  