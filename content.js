(function() {
    let startPointer, endPointer, progressBar;
    let activeDragPointer = null;
  
    function initializePointers() {
      progressBar = document.querySelector('.ytp-progress-bar');
      if (!progressBar) return;
  
      startPointer = createPointer('start');
      endPointer = createPointer('end');
  
      progressBar.appendChild(startPointer);
      progressBar.appendChild(endPointer);
  
      makeDraggable(startPointer);
      makeDraggable(endPointer);
    }
  
    function createPointer(type) {
      const pointer = document.createElement('div');
      pointer.className = `custom-pointer ${type}-pointer`;
      pointer.style.left = type === 'start' ? '0%' : '100%';
      return pointer;
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
  
      updateConsole();
    }
  
    function stopDragging() {
      activeDragPointer = null;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDragging);
    }
  
    function updateConsole() {
      const video = document.querySelector('video');
      if (!video) return;
  
      const duration = video.duration;
      const startTime = parseFloat(startPointer.style.left) / 100 * duration;
      const endTime = parseFloat(endPointer.style.left) / 100 * duration;
  
      console.log(`Start: ${startTime.toFixed(2)}s, End: ${endTime.toFixed(2)}s`);
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
  