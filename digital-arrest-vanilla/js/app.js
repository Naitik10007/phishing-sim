import * as S from "./scenario.js";
import { characterHTML } from "./character.js";
import { playLine, blip } from "./audio.js";

// ===========================================================================
// STATE
// ===========================================================================
function initialState() {
  return {
    view: "intro",
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    redFlagsFound: [], // array of flag ids
    lockedAnswers: {}, // decisionId -> optionId
    senderInspected: false,
    victimMood: "neutral",
    declined: false,
    finished: false,
  };
}

let state = initialState();

const root = document.getElementById("digital-arrest-game");

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(`digitalArrestGame:${name}`, { detail: detail || {} }));
}

function decisionsAnswered() {
  return Object.keys(state.lockedAnswers).length;
}

function goTo(view) {
  state.view = view;
  emit("stageComplete", { stageId: view });
  render();
}

function recordAnswer(stageId, optionId, correct, points) {
  const awarded = correct ? points : 0;
  state.score += awarded;
  if (correct) state.correctAnswers += 1;
  else state.incorrectAnswers += 1;
  state.lockedAnswers[stageId] = optionId;
  emit("answer", { stageId, optionId, correct, points: awarded });
}

function recordFlag(id, points) {
  if (state.redFlagsFound.includes(id)) return;
  state.redFlagsFound.push(id);
  state.score += points;
  emit("answer", { stageId: "pdf_investigation", optionId: id, correct: true, points });
}

/**
 * CHANGE 1: declining the call is treated as the single best possible
 * outcome in the whole scenario — not engaging with a scam call at all is
 * objectively safer than engaging and then having to recover from it. So
 * instead of scoring only what was earned so far, declining bumps the score
 * straight to the maximum possible, as though every decision had been
 * answered correctly and every red flag had been found.
 */
function awardMaxForDecline() {
  state.score = S.MAX_SCORE;
  state.correctAnswers = S.TOTAL_DECISIONS;
  state.incorrectAnswers = 0;
  state.redFlagsFound = S.pdfInvestigation.flags.map((f) => f.id);
  state.lockedAnswers = {
    [S.senderInspection.id]: state.lockedAnswers[S.senderInspection.id] || S.senderInspection.correctOptionId,
    [S.decision1.id]: state.lockedAnswers[S.decision1.id] || S.decision1.correctOptionId,
    [S.decision2.id]: S.decision2.correctOptionId,
    [S.decision3.id]: S.decision3.correctOptionId,
    [S.decisionFinal.id]: S.decisionFinal.correctOptionId,
  };
  state.declined = true;
}

function finishGame() {
  state.finished = true;
  const detail = {
    score: state.score,
    maxScore: S.MAX_SCORE,
    correctAnswers: state.correctAnswers,
    incorrectAnswers: state.incorrectAnswers,
    totalDecisions: S.TOTAL_DECISIONS,
    redFlagsFound: state.redFlagsFound.length,
    totalRedFlags: S.TOTAL_RED_FLAGS,
    category: S.scoreCategory(state.score, S.MAX_SCORE),
  };
  emit("complete", detail);
}

function fullReset() {
  state = initialState();
  render();
}

// ===========================================================================
// SMALL DOM HELPERS
// ===========================================================================
function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// ===========================================================================
// HUD
// ===========================================================================
function renderHUD() {
  const hudVisible = !["intro", "final_score", "learning"].includes(state.view);
  const existing = root.querySelector(".dag-hud");
  if (existing) existing.remove();
  if (!hudVisible) return;

  const hud = h(`
    <div class="dag-hud" role="status" aria-live="polite">
      <div class="dag-hud__item"><span class="dag-hud__label">SCORE</span><span class="dag-hud__value">${state.score}</span></div>
      <div class="dag-hud__item"><span class="dag-hud__label">RED FLAGS</span><span class="dag-hud__value">${state.redFlagsFound.length}/${S.TOTAL_RED_FLAGS}</span></div>
      <div class="dag-hud__item"><span class="dag-hud__label">DECISIONS</span><span class="dag-hud__value">${decisionsAnswered()}/${S.TOTAL_DECISIONS}</span></div>
    </div>
  `);
  root.querySelector(".dag-frame").insertBefore(hud, root.querySelector(".dag-stage"));
}

// ===========================================================================
// GENERIC DECISION DIALOG
// ===========================================================================
function renderDecisionDialog(stage, container, onResolved, onContinue) {
  let selected = null;
  let locked = false;
  let wasCorrect = null;

  function draw() {
    clear(container);
    const wrap = h(`<div class="dag-dialog"></div>`);
    wrap.appendChild(h(`<h3 class="dag-dialog__prompt">${stage.prompt}</h3>`));

    const fieldset = h(`<fieldset class="dag-dialog__options"><legend class="dag-sr-only">Choose one option</legend></fieldset>`);
    if (locked) fieldset.disabled = true;

    stage.options.forEach((opt) => {
      const isSelected = selected === opt.id;
      const isCorrectOpt = locked && opt.id === stage.correctOptionId;
      const isWrongSelected = locked && isSelected && opt.id !== stage.correctOptionId;
      const label = h(`
        <label class="dag-option${isSelected ? " dag-option--selected" : ""}${isCorrectOpt ? " dag-option--correct" : ""}${isWrongSelected ? " dag-option--wrong" : ""}">
          <input type="radio" name="dag-decision-${stage.id}" value="${opt.id}" ${isSelected ? "checked" : ""} ${locked ? "disabled" : ""}>
          <span class="dag-option__letter">${opt.id}.</span>
          <span class="dag-option__text">${opt.text}</span>
        </label>
      `);
      label.querySelector("input").addEventListener("change", () => {
        selected = opt.id;
        draw();
      });
      fieldset.appendChild(label);
    });
    wrap.appendChild(fieldset);

    if (!locked) {
      const submitBtn = h(`<button type="button" class="dag-btn dag-btn--primary" ${!selected ? "disabled" : ""}>SUBMIT</button>`);
      submitBtn.addEventListener("click", () => {
        if (!selected) return;
        locked = true;
        wasCorrect = selected === stage.correctOptionId;
        blip(wasCorrect ? "success" : "warning");
        onResolved(selected, wasCorrect);
        draw();
      });
      wrap.appendChild(submitBtn);
    } else {
      const explanation = wasCorrect
        ? stage.correctExplanation
        : stage.incorrectExplanations[selected] || stage.incorrectDefault;
      const fb = h(`
        <div class="dag-feedback ${wasCorrect ? "dag-feedback--correct" : "dag-feedback--wrong"}" role="alert">
          <div class="dag-feedback__title">${wasCorrect ? "✓ " + stage.correctTitle : "⚠ " + stage.incorrectTitle}</div>
          ${wasCorrect ? `<div class="dag-feedback__points">+${stage.points} POINTS</div>` : ""}
          <p class="dag-feedback__text">${explanation}</p>
          ${!wasCorrect ? `<p class="dag-feedback__safer"><strong>Safer response:</strong> ${stage.saferAction}</p>` : ""}
        </div>
      `);
      const contBtn = h(`<button type="button" class="dag-btn dag-btn--primary">CONTINUE</button>`);
      contBtn.addEventListener("click", onContinue);
      fb.appendChild(contBtn);
      wrap.appendChild(fb);
      renderHUD();
    }

    clear(container);
    container.appendChild(wrap);
  }

  draw();
}

// ===========================================================================
// VIEWS
// ===========================================================================
const stage = () => root.querySelector(".dag-stage");

function renderIntro() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-intro">
      <div class="dag-intro__badge">CYBERSECURITY AWARENESS SIMULATION</div>
      <h1 class="dag-intro__title">${S.introCopy.title}</h1>
      <h2 class="dag-intro__subtitle">${S.introCopy.subtitle}</h2>
      ${S.introCopy.bodyLines.map((l) => `<p class="dag-intro__body">${l}</p>`).join("")}
      <button type="button" class="dag-btn dag-btn--primary dag-intro__cta">${S.introCopy.buttonLabel}</button>
      <p class="dag-intro__disclaimer">${S.introCopy.disclaimer}</p>
    </div>
  `);
  node.querySelector(".dag-intro__cta").addEventListener("click", () => {
    emit("start", {});
    goTo("whatsapp");
  });
  el.appendChild(node);
}

function renderWhatsApp() {
  const el = stage();
  clear(el);
  const chat = h(`
    <div class="dag-chat">
      <div class="dag-chat__disclaimer">Simulated messaging interface — fictional training content</div>
      <div class="dag-chat__body-slot"></div>
    </div>
  `);
  el.appendChild(chat);
  const slot = chat.querySelector(".dag-chat__body-slot");

  function showList() {
    clear(slot);
    const item = h(`
      <button type="button" class="dag-chat__list-item">
        <span class="dag-chat__list-avatar"></span>
        <span class="dag-chat__list-meta">
          <span class="dag-chat__list-name">${S.whatsappMessage.senderName}</span>
          <span class="dag-chat__list-preview">${S.whatsappMessage.preview}</span>
        </span>
        <span class="dag-chat__list-badge">1</span>
      </button>
    `);
    item.style.margin = "10px";
    item.addEventListener("click", () => {
      blip("click");
      showThread();
    });
    slot.appendChild(item);
  }

  function showThread() {
    clear(slot);
    const headerBtn = h(`
      <button type="button" class="dag-chat__header" ${state.senderInspected ? "disabled" : ""}>
        <span class="dag-chat__avatar"></span>
        <span class="dag-chat__header-meta">
          <span class="dag-chat__sender">${S.whatsappMessage.senderName}</span>
          <span class="dag-chat__number">${S.whatsappMessage.senderNumber} ${!state.senderInspected ? "· tap to inspect" : ""}</span>
        </span>
        <span class="dag-chat__urgent-badge">URGENT</span>
      </button>
    `);
    if (!state.senderInspected) {
      headerBtn.addEventListener("click", () => goTo("sender_inspection"));
    }
    slot.appendChild(headerBtn);

    const body = h(`<div class="dag-chat__body"></div>`);
    slot.appendChild(body);

    // Returning here after the sender has already been inspected: show the
    // full thread instantly instead of replaying the typing animation.
    if (state.senderInspected) {
      S.whatsappMessage.messages.forEach((msg, idx) => {
        body.appendChild(
          h(`
            <div class="dag-bubble dag-bubble--in">
              ${idx === 0 ? `<strong>${msg}</strong>` : msg}
              <span class="dag-bubble__time">10:4${idx} AM</span>
            </div>
          `)
        );
      });
      showAttachment();
      return;
    }

    let i = 0;
    function revealNext() {
      const typingEl = h(`<div class="dag-typing" aria-label="Contact is typing"><span></span><span></span><span></span></div>`);
      body.appendChild(typingEl);
      body.scrollTop = body.scrollHeight;
      window.setTimeout(() => {
        typingEl.remove();
        const msg = S.whatsappMessage.messages[i];
        const bubble = h(`
          <div class="dag-bubble dag-bubble--in">
            ${i === 0 ? `<strong>${msg}</strong>` : msg}
            <span class="dag-bubble__time">10:4${i} AM</span>
          </div>
        `);
        body.appendChild(bubble);
        i += 1;
        if (i < S.whatsappMessage.messages.length) {
          window.setTimeout(revealNext, 500);
        } else {
          showAttachment();
        }
      }, 850);
    }

    function showAttachment() {
      const att = h(`
        <button type="button" class="dag-attachment" ${!state.senderInspected ? "disabled" : ""}>
          <span class="dag-attachment__icon">PDF</span>
          <span class="dag-attachment__name">${S.whatsappMessage.attachmentName}</span>
          <span class="dag-attachment__hint">${state.senderInspected ? "Tap to open" : "Inspect the sender first"}</span>
        </button>
      `);
      att.addEventListener("click", () => {
        if (!state.senderInspected) return;
        goTo("pdf");
      });
      body.appendChild(att);
    }

    revealNext();
  }

  // Resume straight into the thread (with attachment visible) once the
  // sender has already been inspected and we're returning here.
  if (state.senderInspected) {
    showThread();
  } else {
    showList();
  }
}

function renderSenderInspection() {
  const el = stage();
  clear(el);
  const wrap = h(`
    <div class="dag-sender-card">
      <div class="dag-sender-card__profile">
        <span class="dag-sender-card__avatar"></span>
        <div>
          <div class="dag-sender-card__name">${S.whatsappMessage.senderName}</div>
          <div class="dag-sender-card__row"><span>Number</span><strong>${S.whatsappMessage.senderNumber}</strong></div>
          <div class="dag-sender-card__row"><span>Account type</span><strong>${S.whatsappMessage.accountType}</strong></div>
        </div>
      </div>
      <div class="dag-dialog-slot"></div>
    </div>
  `);
  el.appendChild(wrap);
  renderDecisionDialog(
    S.senderInspection,
    wrap.querySelector(".dag-dialog-slot"),
    (optionId, correct) => recordAnswer(S.senderInspection.id, optionId, correct, S.senderInspection.points),
    () => {
      state.senderInspected = true;
      goTo("whatsapp");
    }
  );
}

function renderPdf() {
  const el = stage();
  clear(el);

  const flagById = Object.fromEntries(S.pdfInvestigation.flags.map((f) => [f.id, f]));
  let activeExplain = null;

  const container = h(`
    <div class="dag-pdf">
      <div class="dag-pdf__toolbar">
        <span>${S.pdfNotice.subLabel}</span>
        <span class="dag-pdf__count-slot"></span>
      </div>
      <div class="dag-pdf__page">
        <div class="dag-pdf__watermark">${S.pdfNotice.watermark}</div>
        <div class="dag-pdf__header">
          ${S.pdfNotice.header.map((l) => `<div class="dag-pdf__header-line">${l}</div>`).join("")}
        </div>
        <div class="dag-pdf__fields-slot"></div>
        <div class="dag-pdf__field dag-pdf__field--static"><strong>Regarding:</strong> ${S.pdfNotice.recipientName} (fictional placeholder name)</div>
        <ul class="dag-pdf__claims"></ul>
      </div>
      <button type="button" class="dag-btn dag-btn--primary dag-pdf__continue"></button>
    </div>
  `);
  el.appendChild(container);
  window.setTimeout(() => container.classList.add("dag-pdf--open"), 50);
  blip("click");

  const countSlot = container.querySelector(".dag-pdf__count-slot");
  const fieldsSlot = container.querySelector(".dag-pdf__fields-slot");
  const claimsList = container.querySelector(".dag-pdf__claims");
  const continueBtn = container.querySelector(".dag-pdf__continue");

  function makeFlagField(id, innerHtml, isClaim) {
    const found = state.redFlagsFound.includes(id);
    const btn = h(`
      <button type="button" class="dag-pdf__field dag-pdf__field--clickable${isClaim ? " dag-pdf__field--claim" : ""}${found ? " dag-pdf__field--found" : ""}">
        ${innerHtml}${found ? `<span class="dag-flag-tag">RED FLAG</span>` : ""}
      </button>
    `);
    btn.addEventListener("click", () => {
      if (!state.redFlagsFound.includes(id)) {
        recordFlag(id, S.pdfInvestigation.pointsPerFlag);
        blip("warning");
      }
      activeExplain = activeExplain === id ? null : id;
      redraw();
    });
    return btn;
  }

  function maybeExplain(id) {
    if (activeExplain !== id) return null;
    return h(`<div class="dag-pdf__explain" role="status"><strong>RED FLAG</strong><p>${flagById[id].explanation}</p></div>`);
  }

  function redraw() {
    clear(fieldsSlot);
    const issuerWrap = h(`<span class="dag-pdf__flagwrap"></span>`);
    issuerWrap.appendChild(makeFlagField("issuer", `<strong>Issuing Authority:</strong> ${S.pdfNotice.issuer}`));
    const issuerExp = maybeExplain("issuer");
    if (issuerExp) issuerWrap.appendChild(issuerExp);
    fieldsSlot.appendChild(issuerWrap);

    const contactWrap = h(`<span class="dag-pdf__flagwrap"></span>`);
    contactWrap.appendChild(
      makeFlagField(
        "contact",
        `<strong>Contact Number:</strong> ${S.pdfNotice.caseNumber.replace(/\d/g, "X")}-HELP &nbsp;·&nbsp; Case ${S.pdfNotice.caseNumber} · Ref ${S.pdfNotice.idNumber}`
      )
    );
    const contactExp = maybeExplain("contact");
    if (contactExp) contactWrap.appendChild(contactExp);
    fieldsSlot.appendChild(contactWrap);

    clear(claimsList);
    const idMap = { 2: "payment", 3: "urgency", 4: "arrest_threat", 5: "secrecy" };
    S.pdfNotice.claims.forEach((c, i) => {
      const flagId = idMap[i];
      const li = document.createElement("li");
      li.className = "dag-pdf__claim-li";
      if (!flagId) {
        li.textContent = c;
      } else {
        li.appendChild(makeFlagField(flagId, c, true));
        const exp = maybeExplain(flagId);
        if (exp) li.appendChild(exp);
      }
      claimsList.appendChild(li);
    });

    const total = S.pdfInvestigation.flags.length;
    countSlot.textContent = `Red flags found: ${state.redFlagsFound.length} / ${total}`;
    const allFound = state.redFlagsFound.length === total;
    continueBtn.disabled = !allFound;
    continueBtn.textContent = allFound ? "Continue" : `Tap every red flag to continue (${state.redFlagsFound.length}/${total})`;
    renderHUD();
  }

  continueBtn.addEventListener("click", () => goTo("decision_1"));
  redraw();
}

function renderDecision1() {
  const el = stage();
  clear(el);
  const slot = h(`<div></div>`);
  el.appendChild(slot);
  renderDecisionDialog(
    S.decision1,
    slot,
    (optionId, correct) => recordAnswer(S.decision1.id, optionId, correct, S.decision1.points),
    () => goTo("incoming_call")
  );
}

function renderIncomingCall() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-call-incoming" role="dialog" aria-label="Incoming call">
      <div class="dag-call-incoming__tag">${S.incomingCall.simulationTag}</div>
      <div class="dag-call-incoming__rings"><span></span><span></span><span></span></div>
      <div class="dag-call-incoming__name">${S.incomingCall.callerLabel}</div>
      <div class="dag-call-incoming__sub">Incoming video call…</div>
      <div class="dag-call-incoming__actions">
        <button type="button" class="dag-call-btn dag-call-btn--decline">Decline</button>
        <button type="button" class="dag-call-btn dag-call-btn--answer">Answer</button>
      </div>
    </div>
  `);
  node.querySelector(".dag-call-btn--decline").addEventListener("click", () => {
    awardMaxForDecline();
    goTo("decline_path");
  });
  node.querySelector(".dag-call-btn--answer").addEventListener("click", () => goTo("scammer_intro"));
  el.appendChild(node);
}

function renderDeclinePath() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-decline">
      ${characterHTML("victim", "calm", false, false, "You")}
      <h3 class="dag-decline__title">You declined the call — and that's the best possible move.</h3>
      <p class="dag-decline__text">
        Not engaging at all with an unsolicited "arrest" video call is objectively safer than
        answering and then having to recover from the pressure, so this run is scored as a perfect
        outcome: full marks, as though every remaining decision had been answered correctly.
      </p>
      <p class="dag-decline__text">
        The red flags and decisions you already made before this point are the same ones that
        matter in a real "digital arrest" call. The next screen covers what to do if a call like
        this ever reaches you for real.
      </p>
      <button type="button" class="dag-btn dag-btn--primary">Continue</button>
    </div>
  `);
  node.querySelector(".dag-btn").addEventListener("click", () => goTo("final_action"));
  el.appendChild(node);
  renderHUD();
}

// Generic click-driven dialogue stepper shared by scammer_intro / pressure /
// money_dialogue / reveal. `withCharacters` true shows the victim/scammer
// busts with the CHANGE 2 "speaking" bar above whichever one is talking.
function renderDialogueScene(lines, { pressureMode, withCharacters, onDone, tag }) {
  const el = stage();
  clear(el);
  let index = 0;
  let talking = false;
  let talkTimer = null;

  const wrap = h(`
    <div class="dag-videocall ${pressureMode ? "dag-videocall--pressure" : ""}">
      ${tag ? `<div class="dag-videocall__tag">${tag}</div>` : ""}
      ${pressureMode ? `<div class="dag-videocall__banners"><span class="dag-videocall__banner">DO NOT DISCONNECT</span><span class="dag-videocall__banner">KEEP CAMERA ON</span></div>` : ""}
      <div class="dag-videocall__stage-slot"></div>
      <div class="dag-videocall__caption-box">
        <div class="dag-videocall__speaker"></div>
        <p class="dag-videocall__caption-text"></p>
      </div>
      <div class="dag-videocall__controls">
        <span class="dag-videocall__step"></span>
        <button type="button" class="dag-btn dag-btn--primary"></button>
      </div>
    </div>
  `);
  el.appendChild(wrap);

  const stageSlot = wrap.querySelector(".dag-videocall__stage-slot");
  const speakerEl = wrap.querySelector(".dag-videocall__speaker");
  const textEl = wrap.querySelector(".dag-videocall__caption-text");
  const stepEl = wrap.querySelector(".dag-videocall__step");
  const nextBtn = wrap.querySelector(".dag-btn");

  // Re-renders just the character busts + their speaking bars — called on
  // every talking-state tick without touching caption/step/button text.
  function drawCharacters() {
    if (!withCharacters) return;
    const line = lines[index];
    const scammerSpeaking = line.speaker === "scammer";
    const victimSpeaking = line.speaker === "victim";
    stageSlot.className = "dag-videocall__stage-slot dag-videocall__stage";
    stageSlot.innerHTML = `
      <div class="dag-videocall__pane">${characterHTML("scammer", scammerSpeaking ? line.mood || "serious" : "neutral", talking && scammerSpeaking, scammerSpeaking, "Fictional Scammer")}</div>
      <div class="dag-videocall__pane dag-videocall__pane--self">${characterHTML("victim", victimSpeaking ? line.mood || "neutral" : state.victimMood, talking && victimSpeaking, victimSpeaking, "You")}</div>
    `;
  }

  function draw() {
    const line = lines[index];
    const isLast = index >= lines.length - 1;

    speakerEl.textContent = line.speaker === "scammer" ? "Fictional Scammer" : line.speaker === "victim" ? "You" : "Narrator";
    textEl.textContent = line.text;
    stepEl.textContent = `Line ${index + 1} / ${lines.length}`;
    nextBtn.textContent = isLast ? "Continue" : "Next";

    // Talking animation + audio, timer-driven but never auto-advances.
    talking = true;
    drawCharacters();
    playLine(line.speaker, line.clipId);
    if (talkTimer) window.clearTimeout(talkTimer);
    const words = line.text.split(/\s+/).length;
    const estMs = Math.min(4200, Math.max(900, (words / 2.4) * 1000));
    talkTimer = window.setTimeout(() => {
      talking = false;
      drawCharacters();
    }, estMs);
  }

  nextBtn.addEventListener("click", () => {
    const isLast = index >= lines.length - 1;
    blip("click");
    if (isLast) {
      if (talkTimer) window.clearTimeout(talkTimer);
      onDone();
      return;
    }
    index += 1;
    draw();
  });

  draw();
  return wrap;
}

function renderScammerIntro() {
  renderDialogueScene(S.scammerIntroLines, {
    withCharacters: true,
    tag: "SIMULATED VIDEO CALL — FICTIONAL SCAMMER, NOT A REAL OFFICER",
    onDone: () => goTo("decision_2"),
  });
}

function renderDecision2() {
  const el = stage();
  clear(el);
  const slot = h(`<div></div>`);
  el.appendChild(slot);
  renderDecisionDialog(
    S.decision2,
    slot,
    (optionId, correct) => {
      state.victimMood = correct ? "calm" : "worried";
      recordAnswer(S.decision2.id, optionId, correct, S.decision2.points);
    },
    () => goTo("pressure")
  );
}

function renderPressure() {
  renderDialogueScene(S.pressureLines, {
    withCharacters: true,
    pressureMode: true,
    tag: "SIMULATED VIDEO CALL — FICTIONAL SCAMMER, NOT A REAL OFFICER",
    onDone: () => goTo("money_dialogue"),
  });
}

function renderMoneyDialogue() {
  renderDialogueScene(S.moneyDemandLines, {
    withCharacters: true,
    pressureMode: true,
    tag: "SIMULATED VIDEO CALL — FICTIONAL SCAMMER, NOT A REAL OFFICER",
    onDone: () => goTo("money_screen"),
  });
}

function renderMoneyScreen() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-money">
      <div class="dag-money__tag">FICTIONAL PAYMENT SCREEN — SIMULATION ONLY</div>
      <div class="dag-money__label">Amount requested</div>
      <div class="dag-money__amount">${S.moneyDemand.amount}</div>
      <div class="dag-money__payee">Payee: <strong>${S.moneyDemand.payee}</strong></div>
      <p class="dag-money__note">No real agency ever asks you to pay a "security" or "verification" amount to prove you are innocent. This screen exists only to show what that pressure looks like.</p>
      <button type="button" class="dag-btn dag-btn--primary">Continue</button>
    </div>
  `);
  node.querySelector(".dag-btn").addEventListener("click", () => goTo("decision_3"));
  el.appendChild(node);
}

function renderDecision3() {
  const el = stage();
  clear(el);
  const slot = h(`<div></div>`);
  el.appendChild(slot);
  renderDecisionDialog(
    S.decision3,
    slot,
    (optionId, correct) => {
      state.victimMood = correct ? "calm" : "worried";
      recordAnswer(S.decision3.id, optionId, correct, S.decision3.points);
    },
    () => goTo("reveal")
  );
}

function renderReveal() {
  const el = stage();
  clear(el);
  let index = 0;
  const wrap = h(`
    <div class="dag-reveal">
      <div class="dag-reveal__frozen">Call ended. Screen frozen.</div>
      <div class="dag-reveal__line-slot"></div>
      <div class="dag-reveal__controls">
        <span class="dag-reveal__step-slot"></span>
        <button type="button" class="dag-btn dag-btn--primary"></button>
      </div>
    </div>
  `);
  el.appendChild(wrap);
  const lineSlot = wrap.querySelector(".dag-reveal__line-slot");
  const stepSlot = wrap.querySelector(".dag-reveal__step-slot");
  const btn = wrap.querySelector(".dag-btn");

  function draw() {
    const line = S.revealLines[index];
    const isLast = index >= S.revealLines.length - 1;
    lineSlot.innerHTML = `<div class="dag-reveal__line">${line.text}</div>`;
    stepSlot.textContent = `${index + 1} / ${S.revealLines.length}`;
    btn.textContent = isLast ? "Continue" : "Next";
    playLine(line.speaker, line.clipId);
  }
  btn.addEventListener("click", () => {
    blip("click");
    const isLast = index >= S.revealLines.length - 1;
    if (isLast) {
      goTo("decision_final");
      return;
    }
    index += 1;
    draw();
  });
  draw();
}

function renderDecisionFinal() {
  const el = stage();
  clear(el);
  const slot = h(`<div></div>`);
  el.appendChild(slot);
  renderDecisionDialog(
    S.decisionFinal,
    slot,
    (optionId, correct) => {
      state.victimMood = correct ? "calm" : "worried";
      recordAnswer(S.decisionFinal.id, optionId, correct, S.decisionFinal.points);
    },
    () => goTo("final_action")
  );
}

function renderFinalAction() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-finalaction">
      ${characterHTML("victim", "relieved", false, false, "You")}
      <p class="dag-finalaction__text">He ends the call, blocks the number, contacts someone he trusts, verifies independently, and reports the incident.</p>
      <div class="dag-finalaction__steps">
        ${S.finalActionSteps.map((s) => `<span class="dag-finalaction__step">${s}</span>`).join("")}
      </div>
      <div class="dag-finalaction__report">
        <div class="dag-finalaction__report-title">IF YOU SUSPECT CYBER FRAUD</div>
        <p>${S.reportingInfo.helpline}</p>
        <p>${S.reportingInfo.portal}</p>
        <p>${S.reportingInfo.talk}</p>
        <p>${S.reportingInfo.noShare}</p>
      </div>
      <button type="button" class="dag-btn dag-btn--primary">See my score</button>
    </div>
  `);
  node.querySelector(".dag-btn").addEventListener("click", () => {
    finishGame();
    goTo("final_score");
  });
  el.appendChild(node);
}

function renderFinalScore() {
  const el = stage();
  clear(el);
  const category = S.scoreCategory(state.score, S.MAX_SCORE);
  const normalized = Math.round((state.score / S.MAX_SCORE) * 1000);
  const node = h(`
    <div class="dag-final">
      <h2 class="dag-final__title">SIMULATION COMPLETE</h2>
      <div class="dag-final__score">${normalized} <span>/ 1000</span></div>
      <div class="dag-final__category">${category}</div>
      <div class="dag-final__statgrid">
        <div class="dag-final__stat"><span>SCORE</span><strong>${state.score}</strong></div>
        <div class="dag-final__stat"><span>RED FLAGS</span><strong>${state.redFlagsFound.length}/${S.TOTAL_RED_FLAGS}</strong></div>
        <div class="dag-final__stat"><span>DECISIONS</span><strong>${state.correctAnswers}/${decisionsAnswered() || S.TOTAL_DECISIONS}</strong></div>
      </div>
      <p class="dag-final__note">
        This score reflects practice, not judgment — the goal was to learn to recognize the pattern, and you just did.
        ${!state.declined ? `(${state.incorrectAnswers} decision${state.incorrectAnswers === 1 ? "" : "s"} missed the safer option — each one came with an explanation along the way.)` : ""}
      </p>
      <div class="dag-final__actions">
        <button type="button" class="dag-btn dag-btn--primary" data-action="learn">REVIEW RED FLAGS</button>
        <button type="button" class="dag-btn dag-btn--secondary" data-action="learn">LEARN MORE</button>
        <button type="button" class="dag-btn dag-btn--secondary" data-action="restart">PLAY AGAIN</button>
      </div>
    </div>
  `);
  node.querySelectorAll('[data-action="learn"]').forEach((b) => b.addEventListener("click", () => goTo("learning")));
  node.querySelector('[data-action="restart"]').addEventListener("click", fullReset);
  el.appendChild(node);
}

function renderLearning() {
  const el = stage();
  clear(el);
  const node = h(`
    <div class="dag-learning">
      <h2 class="dag-learning__title">DIGITAL ARREST RED FLAGS</h2>
      <ul class="dag-learning__list">${S.redFlagSummary.map((r) => `<li>${r}</li>`).join("")}</ul>
      <div class="dag-learning__remember">
        <div class="dag-learning__remember-title">REMEMBER</div>
        <div class="dag-learning__remember-words">${S.rememberWords.map((w) => `<span>${w}</span>`).join("")}</div>
      </div>
      <div class="dag-learning__report-card">
        <p>If you suspect cyber fraud, report it through official channels.</p>
        <p class="dag-learning__report-line">${S.reportingInfo.helpline}</p>
        <p class="dag-learning__report-line">${S.reportingInfo.portal}</p>
        <p class="dag-learning__report-line">${S.reportingInfo.talk}</p>
        <p class="dag-learning__report-line">${S.reportingInfo.noShare}</p>
      </div>
      <button type="button" class="dag-btn dag-btn--primary">PLAY AGAIN</button>
    </div>
  `);
  node.querySelector(".dag-btn").addEventListener("click", fullReset);
  el.appendChild(node);
}

// ===========================================================================
// RENDER DISPATCH
// ===========================================================================
function render() {
  const renderers = {
    intro: renderIntro,
    whatsapp: renderWhatsApp,
    sender_inspection: renderSenderInspection,
    pdf: renderPdf,
    decision_1: renderDecision1,
    incoming_call: renderIncomingCall,
    decline_path: renderDeclinePath,
    scammer_intro: renderScammerIntro,
    decision_2: renderDecision2,
    pressure: renderPressure,
    money_dialogue: renderMoneyDialogue,
    money_screen: renderMoneyScreen,
    decision_3: renderDecision3,
    reveal: renderReveal,
    decision_final: renderDecisionFinal,
    final_action: renderFinalAction,
    final_score: renderFinalScore,
    learning: renderLearning,
  };
  renderHUD();
  (renderers[state.view] || renderIntro)();
}

// ===========================================================================
// MINIMAL HOST API (parity with the embeddable build)
// ===========================================================================
window.DigitalArrestGame = {
  reset: fullReset,
  getScore: () => state.score,
  getProgress: () => ({
    score: state.score,
    maxScore: S.MAX_SCORE,
    correctAnswers: state.correctAnswers,
    incorrectAnswers: state.incorrectAnswers,
    totalDecisions: S.TOTAL_DECISIONS,
    redFlagsFound: state.redFlagsFound.length,
    totalRedFlags: S.TOTAL_RED_FLAGS,
    finished: state.finished,
  }),
};

render();
