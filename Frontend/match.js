/* =========================================================
   MATCHING ENGINE — unchanged from the original build.
   Hard constraints -> preference derivation -> Gale-Shapley
   deferred acceptance, deterministic and order-independent.

   Loaded only by match.html. Depends on iconSvg() from shared.js,
   so shared.js must be loaded first.
   ========================================================= */
const ENERGY = { low:0, medium:1, high:2 };
const CITE = {
  behavioural: "Powell et al. 2021 — 35% of dog returns were behavioural incompatibility.",
  petConflict: "Powell et al. 2021 — 18% of dog returns involved conflict with an existing household pet."
};

const ANIMALS = [
  { id:"luna", name:"Luna", type:"dog", breed:"Golden Mix · 2 yrs", days:45, energy:"high",
    hard:{}, soft:{ prefersExperienced:true } },
  { id:"whiskers", name:"Whiskers", type:"cat", breed:"Shorthair · 3 yrs", days:60, energy:"low",
    hard:{ noOtherDogs:true }, soft:{ prefersQuietHome:true }, why:[["noOtherDogs","behavioural"]] },
  { id:"cinnamon", name:"Cinnamon", type:"small", breed:"Holland Lop · 1 yr", days:30, energy:"low",
    hard:{ noOtherDogs:true, noOtherCats:true, requireExperience:true }, soft:{ prefersQuietHome:true } },
  { id:"perro", name:"Perro", type:"dog", breed:"Schnauzer · 5 yrs", days:52, energy:"low",
    hard:{ requireExperience:true, noYoungKids:true }, soft:{ prefersQuietHome:true } },
  { id:"bella", name:"Bella", type:"cat", breed:"Longhair Calico · 2 yrs", days:25, energy:"low",
    hard:{}, soft:{} },
  { id:"bruno", name:"Bruno", type:"dog", breed:"Boxer Mix · 4 yrs", days:340, energy:"high",
    hard:{ requireYard:true }, soft:{} },
];

const BASE_APPLICANTS = [
  { id:"alvarez", label:"The Alvarez family", homeType:"yard", youngKids:true, otherPets:[], experience:"experienced", energyPref:"high", typePref:"dog", specificAnimal:null },
  { id:"mika", label:"Mika", homeType:"apartment", youngKids:false, otherPets:[], experience:"first-time", energyPref:"high", typePref:"dog", specificAnimal:null },
  { id:"osei", label:"The Osei family", homeType:"yard", youngKids:true, otherPets:["cat"], experience:"experienced", energyPref:"medium", typePref:"cat", specificAnimal:null },
  { id:"priyatom", label:"Priya & Tom", homeType:"apartment", youngKids:false, otherPets:["cat"], experience:"first-time", energyPref:"low", typePref:"cat", specificAnimal:null },
  { id:"deepa", label:"Deepa", homeType:"yard", youngKids:false, otherPets:[], experience:"experienced", energyPref:"low", typePref:"any", specificAnimal:null },
  { id:"chenreyes", label:"The Chen-Reyes household", homeType:"apartment", youngKids:false, otherPets:[], experience:"first-time", energyPref:"low", typePref:"small", specificAnimal:null },
];

function hardReasons(animal, applicant){
  const h = animal.hard, reasons = [];
  if(h.requireYard && applicant.homeType !== "yard")
    reasons.push({ text:`${animal.name} needs regular yard access to release energy safely; ${applicant.label || "you"} don't have a yard.`, cite:CITE.behavioural });
  if(h.noOtherDogs && applicant.otherPets.includes("dog"))
    reasons.push({ text:`${animal.name} can't be placed with a household that already has a dog.`, cite:CITE.petConflict });
  if(h.noOtherCats && applicant.otherPets.includes("cat"))
    reasons.push({ text:`${animal.name} can't be placed with a household that already has a cat.`, cite:CITE.petConflict });
  if(h.noYoungKids && applicant.youngKids)
    reasons.push({ text:`${animal.name}'s profile is not evaluated as safe around young children yet.`, cite:CITE.behavioural });
  if(h.requireExperience && applicant.experience !== "experienced")
    reasons.push({ text:`${animal.name} needs an experienced owner; first-time owners are excluded here.`, cite:CITE.behavioural });
  return reasons;
}
function feasible(animal, applicant){ return hardReasons(animal, applicant).length === 0; }

function wantScore(applicant, animal){
  let s = 0;
  if(applicant.typePref === animal.type) s += 2;
  else if(applicant.typePref === "any") s += 1;
  const diff = Math.abs(ENERGY[applicant.energyPref] - ENERGY[animal.energy]);
  s += diff === 0 ? 2 : diff === 1 ? 1 : 0;
  if(applicant.specificAnimal === animal.id) s += 100;
  return s;
}
function needFitScore(animal, applicant){
  let s = 0;
  if(applicant.experience === "experienced") s += 2;
  if(applicant.homeType === "yard") s += 1;
  if(animal.soft.prefersQuietHome){
    if(!applicant.youngKids) s += 1;
    if(applicant.otherPets.length === 0) s += 1;
  }
  if(animal.soft.prefersExperienced && applicant.experience === "experienced") s += 1;
  return s;
}

function applicantPrefList(applicant, dial, animals){
  const feas = animals.filter(a => feasible(a, applicant));
  const scored = feas.map(a => {
    const base = wantScore(applicant, a);
    const tieBonus = ((dial - 5) / 5) * (a.days / 340) * 0.45;
    return { id:a.id, base, score: base + tieBonus, days:a.days };
  });
  scored.sort((x, y) => y.score - x.score || (x.days - y.days));
  return scored.map(x => x.id);
}
function animalPrefList(animal, applicants){
  const feas = applicants.filter(ap => feasible(animal, ap));
  const scored = feas.map(ap => ({ id:ap.id, score:needFitScore(animal, ap) }));
  scored.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
  return scored.map(x => x.id);
}

function runDeferredAcceptance(animals, applicants, dial){
  const applicantPrefs = {}, animalPrefs = {};
  applicants.forEach(ap => applicantPrefs[ap.id] = applicantPrefList(ap, dial, animals));
  animals.forEach(a => animalPrefs[a.id] = animalPrefList(a, applicants));

  const nextIdx = {}; applicants.forEach(ap => nextIdx[ap.id] = 0);
  const held = {}, applicantMatch = {};
  applicants.forEach(ap => applicantMatch[ap.id] = null);
  let free = applicants.map(ap => ap.id).filter(id => applicantPrefs[id].length > 0);
  let checks = 0;

  while(free.length){
    const apId = free.shift();
    const prefs = applicantPrefs[apId];
    if(nextIdx[apId] >= prefs.length) continue;
    const animalId = prefs[nextIdx[apId]];
    nextIdx[apId]++;
    checks++;
    if(!held[animalId]){
      held[animalId] = apId; applicantMatch[apId] = animalId;
    } else {
      const rival = held[animalId];
      const order = animalPrefs[animalId];
      checks++;
      if(order.indexOf(apId) < order.indexOf(rival)){
        held[animalId] = apId; applicantMatch[apId] = animalId; applicantMatch[rival] = null;
        if(nextIdx[rival] < applicantPrefs[rival].length) free.push(rival);
      } else if(nextIdx[apId] < prefs.length){
        free.push(apId);
      }
    }
  }
  return { held, applicantMatch, applicantPrefs, animalPrefs, checks };
}

function findBlockingPair(animals, applicants, result){
  for(const a of animals){
    for(const ap of applicants){
      if(!feasible(a, ap)) continue;
      const apCurrentAnimal = result.applicantMatch[ap.id];
      const animalCurrentApp = result.held[a.id];
      if(apCurrentAnimal === a.id) continue;
      const apWantsA = wantScore(ap, a) > (apCurrentAnimal ? wantScore(ap, animals.find(x=>x.id===apCurrentAnimal)) : -1);
      const animalWantsAp = !animalCurrentApp || needFitScore(a, ap) > needFitScore(a, applicants.find(x=>x.id===animalCurrentApp));
      if(apWantsA && animalWantsAp) return { animal:a.id, applicant:ap.id };
    }
  }
  return null;
}

// ---- UI state ----
let currentApplicants = BASE_APPLICANTS.slice();
let lastResult = null;
let currentDial = 0;
const you = { id:"you", label:"You", homeType:"yard", youngKids:false, otherPets:[], experience:"first-time", energyPref:"medium", typePref:"any", specificAnimal:null };

document.querySelectorAll(".pill-group").forEach(group => {
  group.addEventListener("click", e => {
    const btn = e.target.closest(".pill");
    if(!btn) return;
    group.querySelectorAll(".pill").forEach(p => p.classList.remove("selected"));
    btn.classList.add("selected");
  });
});
function pillValue(id){ return document.querySelector(`#${id} .pill.selected`).dataset.value; }

function animalById(id){ return ANIMALS.find(a => a.id === id); }
function applicantById(id, pool){ return (pool || currentApplicants).find(a => a.id === id) || (id === "you" ? you : null); }

function renderResults(result, animals, applicants, dial){
  const matched = animals.filter(a => result.held[a.id]).length;
  document.getElementById("statMatched").textContent = matched;
  document.getElementById("statUnmatched").textContent = animals.length - matched;
  document.getElementById("statChecks").textContent = result.checks;
  document.getElementById("impactChecks").textContent = animals.length * applicants.length;

  const list = document.getElementById("matchList");
  list.innerHTML = "";
  animals.forEach(a => {
    const apId = result.held[a.id];
    const row = document.createElement("div");
    row.className = "match-row" + (!apId ? " unmatched-row" : "") + (apId === "you" ? " is-you" : "");
    const applicant = apId ? applicantById(apId, applicants) : null;
    row.innerHTML = `
      <div class="match-avatar">${iconSvg(a.id, 22)}</div>
      <div class="match-info">
        <b>${a.name}</b>
        <p>${a.days} days waiting</p>
      </div>
      <div class="match-person">${applicant ? (applicant.id === "you" ? "You" : applicant.label) : "Unmatched"}${apId ? ' <span class="proof-stamp matched" style="margin-left:6px; vertical-align:middle;">Matched</span>' : ''}</div>
      <button class="why-btn" data-animal="${a.id}">Details</button>
    `;
    list.appendChild(row);
    const detail = document.createElement("div");
    detail.className = "why-detail";
    detail.id = `why-${a.id}`;
    list.appendChild(detail);
  });

  list.querySelectorAll(".why-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.animal;
      const detail = document.getElementById(`why-${id}`);
      const isOpen = detail.classList.contains("open");
      list.querySelectorAll(".why-detail").forEach(d => d.classList.remove("open"));
      if(isOpen) return;
      detail.innerHTML = buildWhyNot(id, result, applicants);
      detail.classList.add("open");
    });
  });

  // unmatched analysis
  const unmatchedBox = document.getElementById("unmatchedList");
  unmatchedBox.innerHTML = "";
  const unmatchedAnimals = animals.filter(a => !result.held[a.id]);
  if(unmatchedAnimals.length === 0){
    unmatchedBox.innerHTML = `<div class="unmatched-item">Every animal in the cohort matched this run.</div>`;
  } else {
    unmatchedAnimals.forEach(a => {
      const need = describeMissingProfile(a);
      const item = document.createElement("div");
      item.className = "unmatched-item";
      item.innerHTML = `<div class="ua">${iconSvg(a.id, 18)}</div><div><b>${a.name}</b>No applicant in this pool ${need}. That's the profile this shelter needs to recruit for ${a.name}.</div>`;
      unmatchedBox.appendChild(item);
    });
  }

  // impact panel
  updateImpact(animals, applicants, result);

  // swap selects
  const matchedAnimals = animals.filter(a => result.held[a.id]);
  [ "swapA", "swapB" ].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = matchedAnimals.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
  });
  if(matchedAnimals.length > 1) document.getElementById("swapB").selectedIndex = 1;
  document.getElementById("swapResult").classList.remove("show");
  document.getElementById("stabilityResult").classList.remove("show");

  document.getElementById("resultsEmpty").style.display = "none";
  document.getElementById("resultsBoard").classList.add("visible");
  // The tools area explains itself until a run exists; swap it for the real tools.
  document.getElementById("toolsEmpty").style.display = "none";
  document.getElementById("postMatchTools").style.display = "grid";
  document.getElementById("verifyStability").style.display = "";
}

function describeMissingProfile(animal){
  const needs = [];
  if(animal.hard.requireYard) needs.push("has a yard");
  if(animal.hard.requireExperience) needs.push("is an experienced owner");
  if(animal.hard.noYoungKids) needs.push("has no young children");
  if(animal.hard.noOtherDogs) needs.push("has no dog already at home");
  if(animal.hard.noOtherCats) needs.push("has no cat already at home");
  if(needs.length === 0) return "wanted this profile more than a better-fitting animal already in the pool";
  return "combined " + needs.join(" and ");
}

function buildWhyNot(animalId, result, applicants){
  const animal = animalById(animalId);
  const matchedId = result.held[animalId];
  let html = "";
  applicants.forEach(ap => {
    if(ap.id === matchedId) return;
    const reasons = hardReasons(animal, ap);
    const label = ap.id === "you" ? "You" : ap.label;
    if(reasons.length){
      html += `<div><b>${label}:</b> ${reasons[0].text}<span class="cite">${reasons[0].cite}</span></div>`;
    } else {
      html += `<div><b>${label}:</b> feasible, but ${matchedId ? "ranked lower on fit than " + (applicantById(matchedId, applicants).id === "you" ? "you" : applicantById(matchedId, applicants).label) : "the animal had no proposals reach it this run"}.</div>`;
    }
  });
  return html || "No other applicants in this pool were considered.";
}

function updateImpact(animals, applicants, result, mode){
  mode = mode || (document.getElementById("btnOptimistic").classList.contains("active") ? "optimistic" : "conservative");
  const matched = animals.filter(a => result.held[a.id]).length;
  const rate = mode === "conservative" ? 0.163 : 0.163 + 0.35 * 0.3;
  const projected = (matched * rate).toFixed(1);
  document.getElementById("impactWelfare").textContent = `~${projected}`;
}

document.getElementById("btnConservative").addEventListener("click", function(){
  this.classList.add("active"); document.getElementById("btnOptimistic").classList.remove("active");
  if(lastResult) updateImpact(ANIMALS, currentApplicants, lastResult, "conservative");
});
document.getElementById("btnOptimistic").addEventListener("click", function(){
  this.classList.add("active"); document.getElementById("btnConservative").classList.remove("active");
  if(lastResult) updateImpact(ANIMALS, currentApplicants, lastResult, "optimistic");
});

document.getElementById("runMatch").addEventListener("click", () => {
  const specific = pillValue("specificGroup") || null;
  you.homeType = pillValue("homeGroup");
  you.youngKids = pillValue("kidsGroup") === "yes";
  you.otherPets = pillValue("petsGroup") ? [pillValue("petsGroup")] : [];
  you.experience = pillValue("expGroup");
  you.energyPref = pillValue("energyGroup");
  you.typePref = specific ? animalById(specific).type : "any";
  you.specificAnimal = specific;

  currentApplicants = BASE_APPLICANTS.concat([you]);
  currentDial = Number(document.getElementById("equityDial").value);
  lastResult = runDeferredAcceptance(ANIMALS, currentApplicants, currentDial);
  renderResults(lastResult, ANIMALS, currentApplicants, currentDial);
  document.getElementById("resultsBoard").scrollIntoView({behavior:"smooth", block:"nearest"});
});

document.getElementById("runSwap").addEventListener("click", () => {
  if(!lastResult) return;
  const idA = document.getElementById("swapA").value, idB = document.getElementById("swapB").value;
  const box = document.getElementById("swapResult");
  const stampHtml = (label) => `<span class="proof-stamp blocked" style="margin-bottom:8px;">${label}</span><br>`;
  if(idA === idB){
    box.className = "swap-result show fail"; box.innerHTML = "Pick two different animals to attempt a swap.";
    return;
  }
  const animalA = animalById(idA), animalB = animalById(idB);
  const apA = applicantById(lastResult.held[idA], currentApplicants);
  const apB = applicantById(lastResult.held[idB], currentApplicants);
  const nameA = apA.id === "you" ? "you" : apA.label, nameB = apB.id === "you" ? "you" : apB.label;

  const aToB = hardReasons(animalB, apA);
  const bToA = hardReasons(animalA, apB);
  if(aToB.length || bToA.length){
    const reason = (aToB[0] || bToA[0]).text;
    box.className = "swap-result show fail";
    box.innerHTML = stampHtml("Blocked") + `It's not even feasible. ${reason}`;
    return;
  }
  const aPrefersB = wantScore(apA, animalB) > wantScore(apA, animalA);
  const bPrefersA = wantScore(apB, animalA) > wantScore(apB, animalB);
  const animalBPrefersA = needFitScore(animalB, apA) > needFitScore(animalB, apB);
  const animalAPrefersB = needFitScore(animalA, apB) > needFitScore(animalA, apA);
  if(aPrefersB && animalBPrefersA){
    box.className = "swap-result show fail";
    box.innerHTML = stampHtml("Check failed") + `Swap would actually improve things for ${nameA} and ${animalB.name} — that would mean the current match wasn't stable. (If you see this, tell us — it's a bug.)`;
  } else if(bPrefersA && animalAPrefersB){
    box.className = "swap-result show fail";
    box.innerHTML = stampHtml("Check failed") + `Swap would actually improve things for ${nameB} and ${animalA.name} — that would mean the current match wasn't stable. (If you see this, tell us — it's a bug.)`;
  } else {
    box.className = "swap-result show fail";
    box.innerHTML = stampHtml("Blocked") + `At least one side would be worse off. ${nameA} ↔ ${animalB.name} and ${nameB} ↔ ${animalA.name} — neither pair prefers the swap enough to abandon their current match. No blocking pair, no incentive to defect.`;
  }
  box.classList.add("show");
});

document.getElementById("verifyStability").addEventListener("click", () => {
  const box = document.getElementById("stabilityResult");
  if(!lastResult){
    box.className = "swap-result show fail"; box.textContent = "Run the matching engine first.";
    return;
  }
  const blocking = findBlockingPair(ANIMALS, currentApplicants, lastResult);
  if(blocking){
    box.className = "swap-result show fail";
    box.innerHTML = `<span class="proof-stamp blocked" style="margin-bottom:8px;">Check failed</span><br>Blocking pair found: ${blocking.applicant} and ${blocking.animal} would rather match each other. (Report this — it shouldn't happen.)`;
  } else {
    box.className = "swap-result show pass";
    box.innerHTML = `<span class="proof-stamp stable" style="margin-bottom:8px;">Stable</span><br>No blocking pair exists across the full cohort. Every unmatched pair is unmatched because at least one side prefers their current assignment — or the pair was never feasible.`;
  }
  box.classList.add("show");
});

const dialInput = document.getElementById("equityDial");
dialInput.addEventListener("input", () => {
  document.getElementById("dialValue").textContent = dialInput.value;
  if(!lastResult) return;
  currentDial = Number(dialInput.value);
  const before = lastResult;
  const after = runDeferredAcceptance(ANIMALS, currentApplicants, currentDial);
  lastResult = after;
  renderResults(after, ANIMALS, currentApplicants, currentDial);

  const changed = ANIMALS.filter(a => before.held[a.id] !== after.held[a.id]);
  const outcome = document.getElementById("dialOutcome");
  if(changed.length === 0){
    outcome.textContent = "No change at this setting — nobody in the current pool is tied closely enough for the dial to matter.";
  } else {
    outcome.innerHTML = changed.map(a => {
      const now = after.held[a.id] ? (applicantById(after.held[a.id], currentApplicants).id === "you" ? "you" : applicantById(after.held[a.id], currentApplicants).label) : "unmatched";
      return `<b>${a.name}</b> (${a.days} days waiting) → now ${now}`;
    }).join("<br>");
  }
});
