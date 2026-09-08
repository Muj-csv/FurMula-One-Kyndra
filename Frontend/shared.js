/* =========================================================
   KYNDRA — shared shell.
   Loaded by every page. Builds the SVG sprite, the nav and the
   footer once, then wires up whatever page-level pieces happen
   to be present. Every block guards on its own elements, so the
   same file is safe on all four pages.
   ========================================================= */

/* ---- SVG sprite. Injected first so any <use href="#..."> in the
   nav and footer resolves the moment those are inserted. ---- */
const SPRITE_HTML = `
  <svg width="0" height="0" style="position:absolute">
    <defs>
      <symbol id="paw-icon" viewBox="0 0 32 32">
        <circle cx="16" cy="21" r="8" fill="#24231F"/>
        <circle cx="7" cy="12" r="4" fill="#24231F"/>
        <circle cx="16" cy="8" r="4.2" fill="#24231F"/>
        <circle cx="25" cy="12" r="4" fill="#24231F"/>
      </symbol>
      <symbol id="paw-icon-light" viewBox="0 0 32 32">
        <circle cx="16" cy="21" r="8" fill="#fff"/>
        <circle cx="7" cy="12" r="4" fill="#fff"/>
        <circle cx="16" cy="8" r="4.2" fill="#fff"/>
        <circle cx="25" cy="12" r="4" fill="#fff"/>
      </symbol>
      <symbol id="dog-a" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F7F0E5"/>
        <path d="M35 40c-4-8-12-10-14-4-2 5 3 10 8 11M65 40c4-8 12-10 14-4 2 5-3 10-8 11" fill="#24231F"/>
        <ellipse cx="50" cy="55" rx="22" ry="19" fill="#24231F"/>
        <circle cx="42" cy="50" r="3" fill="#F7F0E5"/>
        <circle cx="58" cy="50" r="3" fill="#F7F0E5"/>
        <ellipse cx="50" cy="60" rx="5" ry="4" fill="#F7F0E5"/>
        <path d="M46 64q4 4 8 0" stroke="#F7F0E5" stroke-width="2" fill="none" stroke-linecap="round"/>
      </symbol>
      <symbol id="dog-b" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F7F0E5"/>
        <path d="M30 35l6 18M70 35l-6 18" stroke="#24231F" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="50" cy="56" rx="24" ry="20" fill="#24231F"/>
        <circle cx="41" cy="50" r="3.2" fill="#F7F0E5"/>
        <circle cx="59" cy="50" r="3.2" fill="#F7F0E5"/>
        <ellipse cx="50" cy="61" rx="5" ry="4" fill="#F7F0E5"/>
      </symbol>
      <symbol id="cat-a" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F7F0E5"/>
        <path d="M33 38l4-14 10 11M67 38l-4-14-10 11" fill="#24231F"/>
        <ellipse cx="50" cy="56" rx="21" ry="18" fill="#24231F"/>
        <circle cx="42" cy="52" r="2.6" fill="#F7F0E5"/>
        <circle cx="58" cy="52" r="2.6" fill="#F7F0E5"/>
        <path d="M50 58l-3 3h6z" fill="#F7F0E5"/>
        <path d="M30 60h10M60 60h10M31 64h9M60 64h9" stroke="#24231F" stroke-width="1.5"/>
      </symbol>
      <symbol id="cat-b" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F7F0E5"/>
        <path d="M35 36l3-13 9 10M65 36l-3-13-9 10" fill="#24231F"/>
        <ellipse cx="50" cy="58" rx="19" ry="17" fill="#24231F"/>
        <circle cx="43" cy="54" r="2.4" fill="#F7F0E5"/>
        <circle cx="57" cy="54" r="2.4" fill="#F7F0E5"/>
        <path d="M50 60l-2.5 2.5h5z" fill="#F7F0E5"/>
      </symbol>
      <symbol id="rabbit-a" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#F7F0E5"/>
        <path d="M38 42c-2-14-1-24 4-24s5 11 4 23M58 42c2-14 1-24-4-24s-5 11-4 23" fill="#24231F"/>
        <ellipse cx="50" cy="58" rx="20" ry="17" fill="#24231F"/>
        <circle cx="43" cy="55" r="2.6" fill="#F7F0E5"/>
        <circle cx="57" cy="55" r="2.6" fill="#F7F0E5"/>
        <ellipse cx="50" cy="62" rx="4" ry="3" fill="#F7F0E5"/>
      </symbol>
    </defs>
  </svg>
`;

/* ---- Nav and footer. Edited here, once, for all four pages. ---- */
const NAV_HTML = `
  <nav class="top-nav" aria-label="Primary navigation">
    <a class="nav-logo" href="index.html"><svg class="logo-mark" viewBox="0 0 32 32"><use href="#paw-icon"/></svg>Kyndra</a>
    <div class="nav-links">
      <a href="cohort.html" class="nav-link" data-page="cohort.html">Explore Cohort</a>
      <a href="match.html" class="nav-link" data-page="match.html">Try Matching</a>
      <a href="index.html#how" class="nav-link" data-page="index.html">How It Works</a>
      <a href="evidence.html" class="nav-link" data-page="evidence.html">Evidence</a>
    </div>
    <div class="nav-actions">
      <a href="match.html" class="nav-link quiz-link">Try Matching</a>
    </div>
  </nav>
`;

const FOOTER_HTML = `
  <footer class="site-footer" id="shelter">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="nav-logo"><svg class="logo-mark" viewBox="0 0 32 32"><use href="#paw-icon-light"/></svg>Kyndra</div>
        <p>Transparent, explainable allocation for animal shelters. The system proposes; shelter staff decide.</p>
      </div>
      <div class="footer-links">
        <div class="link-column">
          <h4>Explore</h4>
          <a href="cohort.html">Browse Cohort</a>
          <a href="index.html#how">How It Works</a>
          <a href="match.html">Run the Engine</a>
        </div>
        <div class="link-column">
          <h4>Transparency</h4>
          <a href="match.html">Attempt a Swap</a>
          <a href="match.html">Constraint Logic</a>
          <a href="match.html">Equity Guardrail</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Kyndra. Simulated animals; real applicants. Prototype interface.</p>
      <div class="legal-links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Accessibility</a></div>
    </div>
  </footer>
`;

/* A directory URL ("/" or "/foo/") is served by index.html. */
function currentPage(){
  const last = window.location.pathname.split("/").pop();
  return last === "" ? "index.html" : last;
}

document.body.insertAdjacentHTML("afterbegin", SPRITE_HTML);
document.body.insertAdjacentHTML("afterbegin", NAV_HTML);
document.body.insertAdjacentHTML("beforeend", FOOTER_HTML);

(function markActiveNavLink(){
  const page = currentPage();
  document.querySelectorAll(".nav-links .nav-link").forEach(link => {
    if(link.dataset.page === page) link.classList.add("active");
  });
})();

/* =========================================================
   Photo lookup — each simulated profile is paired with a real,
   freely-licensed stock photo of the breed (not a specific
   shelter's animal). Credited inline on the cohort cards.
   Used by the cohort modal and by the match results board, so
   it lives here rather than in match.js.
   ========================================================= */
const PHOTOS = {
  bruno:     "https://images.unsplash.com/photo-1571404569825-8c3b2c7dea9a",
  luna:      "https://images.unsplash.com/photo-1596949995396-ed85d653faa0",
  whiskers:  "https://images.unsplash.com/photo-1544076350-465637ebdf5a",
  cinnamon:  "https://images.unsplash.com/photo-1668791627301-23690de58952",
  perro:     "https://images.unsplash.com/photo-1580467277788-c6e040296602",
  bella:     "https://images.unsplash.com/photo-1503777119540-ce54b422baff"
};
function photoUrl(id, size){
  const src = PHOTOS[id] || PHOTOS.bruno;
  return `${src}?auto=format&fit=crop&w=${size}&h=${size}&q=80`;
}
function iconSvg(id, size){
  return `<img class="pet-thumb" src="${photoUrl(id, size*3)}" width="${size}" height="${size}" alt="" loading="lazy" style="border-radius:50%;object-fit:cover;display:block">`;
}

/* ---- Pet detail modal. Present on cohort.html only. ---- */
const petData = {
  Bruno: { id:"bruno", text:"Long-stay example: Bruno has waited 340 days. The equity control can help surface him when fit is otherwise tied, but it can never override a hard constraint." },
  Luna: { id:"luna", text:"Luna is a simulated young dog profile. Her final assignment depends on the household requirements and the shelter-side needs profile." },
  Whiskers: { id:"whiskers", text:"Whiskers is a simulated cat profile. Compatibility is checked against the household before any preference ranking is applied." },
  Cinnamon: { id:"cinnamon", text:"Cinnamon is a simulated small-pet profile. The same constraint-first logic applies across the cohort." },
  Perro: { id:"perro", text:"Perro is a simulated dog profile. Kyndra derives applicant and shelter preferences independently rather than using one generic score." },
  Bella: { id:"bella", text:"Bella is a simulated cat profile. The matching engine is designed to explain both successful pairings and eliminated alternatives." }
};

const modal = document.getElementById("modal");
if(modal){
  const modalTitle = document.getElementById("modal-title");
  const modalCopy = document.getElementById("modal-copy");
  const modalPet = document.getElementById("modalPet");

  document.querySelectorAll(".view-details-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pet = btn.dataset.pet;
      const data = petData[pet];
      modalTitle.textContent = pet;
      modalCopy.textContent = data.text;
      modalPet.innerHTML = `<img src="${photoUrl(data.id, 220)}" alt="" loading="lazy">`;
      modal.classList.add("open");
    });
  });

  const closeModal = () => modal.classList.remove("open");
  document.getElementById("closeModal").onclick = closeModal;
  document.getElementById("closeModal2").onclick = closeModal;
  modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });

  // Was a smooth scroll to #demo; the intake now lives on its own page.
  document.getElementById("startMatch").onclick = () => {
    window.location.href = "match.html";
  };
}

/* =========================================================
   HERO DOG SCRUB — mouse X position maps directly to the video's
   timeline. The video is never played continuously; requestAnimationFrame
   coalesces rapid mousemove events so seeking stays smooth.
   Present on index.html only.
   ========================================================= */
const heroDog = document.getElementById("heroDog");
const heroDogVideo = document.getElementById("heroDogVideo");

if(heroDog && heroDogVideo){
  // Timestamp (in seconds) where the left-to-right pan ends. One value,
  // shared by the pointer path and the touch path.
  const horizontalPanEndTime = 2.0;

  let heroTargetTime = 0;
  let heroSeekFrame = null;
  let heroVideoReady = false;
  let heroLastTime = -1;

  const seekHeroDog = () => {
    heroSeekFrame = null;
    if(!heroVideoReady || !Number.isFinite(heroDogVideo.duration) || heroDogVideo.duration <= 0) return;

    const nextTime = Math.max(0, Math.min(heroDogVideo.duration - 0.001, heroTargetTime));

    // Avoid redundant seeks when the pointer moves within the same video frame.
    if(Math.abs(nextTime - heroLastTime) < 0.003) return;

    heroLastTime = nextTime;
    if(typeof heroDogVideo.fastSeek === "function"){
      try {
        heroDogVideo.fastSeek(nextTime);
        return;
      } catch(e) {}
    }
    heroDogVideo.currentTime = nextTime;
  };

  const queueHeroSeek = (time) => {
    heroTargetTime = time;
    if(heroSeekFrame === null) heroSeekFrame = requestAnimationFrame(seekHeroDog);
  };

  const scrubHeroDog = (clientX) => {
    if(!heroVideoReady || !Number.isFinite(heroDogVideo.duration) || heroDogVideo.duration <= 0) return;
    const progress = Math.max(0, Math.min(1, clientX / Math.max(1, window.innerWidth)));
    // If the dog looks away from the cursor instead of toward it, use: (1 - progress) * horizontalPanEndTime
    queueHeroSeek(progress * horizontalPanEndTime);
  };

  heroDogVideo.addEventListener("loadedmetadata", () => {
    heroVideoReady = Number.isFinite(heroDogVideo.duration) && heroDogVideo.duration > 0;
    if(heroVideoReady){
      heroDogVideo.currentTime = 0;
      heroLastTime = 0;
    }
  });

  heroDogVideo.addEventListener("error", () => {
    heroVideoReady = false;
  });

  if (window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("mousemove", e => scrubHeroDog(e.clientX), {passive:true});
  } else {
    // Touch devices do not have a cursor, so show a calm middle frame.
    heroDog.addEventListener("pointermove", e => {
      if(e.pointerType === "touch" && heroVideoReady){
        const rect = heroDog.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        queueHeroSeek(progress * horizontalPanEndTime);
      }
    }, {passive:true});
  }
}

/* ---- Cohort filters. Present on cohort.html only. ---- */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    document.querySelectorAll(".companion-card").forEach(card => {
      const matches = filter === "all" ||
        card.dataset.type === filter ||
        (filter === "long" && Number(card.dataset.days) >= 100);
      card.style.display = matches ? "" : "none";
    });
  });
});
