document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const storyList = document.getElementById("storyList");
  const storyViewer = document.getElementById("storyViewer");
  const storyImage = document.getElementById("storyImage");
  const progressContainer = document.getElementById("progressContainer");
  const prevStory = document.getElementById("prevStory");
  const nextStory = document.getElementById("nextStory");
  const closeBtn = document.getElementById("closeBtn");
  const loader = document.getElementById("loader");

  let stories = [];
  let currentIndex = 0;
  let timer = null;
  const storyDuration = 5000;

  // Helper UI
  function showLoader() { loader.classList.remove("hidden"); storyImage.style.opacity = "0"; }
  function hideLoader() { loader.classList.add("hidden"); storyImage.style.opacity = "1"; }

  // Fetch stories.json (with fallback)
  async function loadStories() {
    try {
      const res = await fetch("stories.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      stories = Array.isArray(data.stories) ? data.stories : [];
    } catch (err) {
      console.warn("Failed to load stories.json — using fallback images:", err);
      // fallback sample images (hosted online)
      stories = [
        { id: 1, image: "https://picsum.photos/seed/1/800/1400" },
        { id: 2, image: "https://picsum.photos/seed/2/800/1400" },
        { id: 3, image: "https://picsum.photos/seed/3/800/1400" }
      ];
    }
    renderStoryList();
  }

  function renderStoryList() {
    storyList.innerHTML = "";
    stories.forEach((s, i) => {
      const thumb = document.createElement("img");
      thumb.src = s.image;
      thumb.alt = `Story ${i+1}`;
      thumb.loading = "lazy";
      thumb.addEventListener("click", () => openStory(i));
      storyList.appendChild(thumb);
    });
  }

  function renderProgressBars() {
    progressContainer.innerHTML = "";
    stories.forEach(() => {
      const bar = document.createElement("div");
      bar.className = "progress-bar";
      const fill = document.createElement("div");
      fill.className = "progress-bar-fill";
      bar.appendChild(fill);
      progressContainer.appendChild(bar);
    });
  }

  function resetProgressInstant() {
    const fills = progressContainer.querySelectorAll(".progress-bar-fill");
    fills.forEach(fill => {
      fill.style.transition = "none";
      fill.style.width = "0%";
    });
    // force reflow so next transition works
    void progressContainer.offsetWidth;
  }

  function fillCompletedBars() {
    const fills = progressContainer.querySelectorAll(".progress-bar-fill");
    fills.forEach((fill, idx) => {
      if (idx < currentIndex) {
        fill.style.transition = "none";
        fill.style.width = "100%";
      } else {
        fill.style.transition = "none";
        fill.style.width = "0%";
      }
    });
    void progressContainer.offsetWidth;
  }

  function startProgress() {
    clearTimeout(timer);
    const fills = progressContainer.querySelectorAll(".progress-bar-fill");
    const currentFill = fills[currentIndex];
    if (!currentFill) return;

    // mark previous as full
    fills.forEach((f, idx) => {
      if (idx < currentIndex) f.style.width = "100%";
      else f.style.width = "0%";
    });

    // animate current
    requestAnimationFrame(() => {
      // Ensure transition is set
      currentFill.style.transition = `width ${storyDuration}ms linear`;
      currentFill.style.width = "100%";
    });

    timer = setTimeout(() => {
      goNext();
    }, storyDuration);
  }

  function showStoryImage(index) {
    const imageUrl = stories[index].image;
    showLoader();
    // stop any running timer while new image loads
    clearTimeout(timer);

    // load image
    storyImage.onload = () => {
      hideLoader();
      // reset progress but keep previous bars filled
      fillCompletedBars();
      // start animating the current fill
      startProgress();
    };
    storyImage.onerror = () => {
      console.error("Image failed to load:", imageUrl);
      hideLoader();
      // skip to next to avoid getting stuck
      setTimeout(goNext, 800);
    };
    // set src AFTER handlers assigned
    storyImage.src = imageUrl;
  }

  // Open viewer
  function openStory(index) {
    if (!stories.length) return;
    currentIndex = index;
    storyViewer.classList.remove("hidden");
    renderProgressBars();
    resetProgressInstant();
    showStoryImage(currentIndex);
    // prevent background scroll on open
    document.body.style.overflow = "hidden";
  }

  // Close viewer
  function closeViewer() {
    clearTimeout(timer);
    storyViewer.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function goPrev() {
    clearTimeout(timer);
    if (currentIndex > 0) {
      currentIndex--;
      // set progress bars appropriately and show image
      fillCompletedBars();
      showStoryImage(currentIndex);
    } else {
      // at first story: close viewer (Instagram closes to feed)
      closeViewer();
    }
  }

  function goNext() {
    clearTimeout(timer);
    if (currentIndex < stories.length - 1) {
      currentIndex++;
      showStoryImage(currentIndex);
    } else {
      closeViewer();
    }
  }

  // Click/tap handlers
  prevStory.addEventListener("click", (e) => { e.stopPropagation(); goPrev(); });
  nextStory.addEventListener("click", (e) => { e.stopPropagation(); goNext(); });
  closeBtn.addEventListener("click", closeViewer);

  // also allow tapping left/right by checking X coordinate on the image (for some devices)
  storyViewer.addEventListener("click", (e) => {
    // if viewers open and clicked directly on viewer (not nav), decide based on x
    if (e.target === storyImage || e.target === storyViewer) {
      const w = storyViewer.clientWidth;
      const x = e.clientX;
      if (x < w * 0.4) goPrev(); else goNext();
    }
  });

  // keyboard for debugging on desktop
  document.addEventListener("keydown", (ev) => {
    if (storyViewer.classList.contains("hidden")) return;
    if (ev.key === "ArrowLeft") goPrev();
    if (ev.key === "ArrowRight") goNext();
    if (ev.key === "Escape") closeViewer();
  });

  // start
  loadStories();
});
