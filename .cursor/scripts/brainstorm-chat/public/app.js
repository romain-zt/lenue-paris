const chatEl = document.getElementById("chat");
const participantsEl = document.getElementById("participants");
const activityFeedEl = document.getElementById("activity-feed");
const assetsAccordion = document.getElementById("assets-accordion");
const assetsListEl = document.getElementById("assets-list");
const activityCountEl = document.getElementById("activity-count");
const assetsCountEl = document.getElementById("assets-count");
const statusEl = document.getElementById("status");
const liveBar = document.getElementById("live-bar");
const liveLabel = document.getElementById("live-label");
const liveElapsed = document.getElementById("live-elapsed");
const form = document.getElementById("form");
const input = document.getElementById("input");
const topicInput = document.getElementById("topic");
const sendBtn = document.getElementById("send");
const pauseBtn = document.getElementById("pause");
const forceStopBtn = document.getElementById("force-stop");
const goalBar = document.getElementById("goal-bar");
const goalText = document.getElementById("goal-text");
const hintEl = document.getElementById("hint");
const liveMonitorEl = document.getElementById("live-monitor");
const lmWhoEl = document.getElementById("lm-who");
const lmPhaseEl = document.getElementById("lm-phase");
const lmElapsedEl = document.getElementById("lm-elapsed");
const lmBodyEl = document.getElementById("lm-body");

/** @type {Record<string, { name: string; label: string; color: string }>} */
let participants = {};
/** @type {Record<string, string>} */
let agentBindings = {};
/** @type {Set<string>} */
const typing = new Set();
/** @type {Array<{ id: string; author: string; phase: string; detail: string; ts: number; tool?: string }>} */
const activityLog = [];
const MAX_ACTIVITY = 40;
const STREAMING_PHASES = new Set(["writing", "thinking"]);
const ACTIVITY_PREVIEW_LEN = 160;
/** @type {Set<string>} */
const openActivityIds = new Set();
let activityIdCounter = 0;

let brainstormActive = false;
let agentsPaused = false;
let waitingForHuman = false;
let autoRetrying = false;
let autoRetryInSec = 0;
let activeAuthor = null;
let activeElapsedMs = 0;
let loopPhase = "idle";
let heartbeatTimer = null;
let reconnectTimer = null;

const wsProto = location.protocol === "https:" ? "wss" : "ws";
let ws = null;

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function cursorAgentUrl(agentId) {
  if (!agentId) return null;
  return `https://cursor.com/agents/${encodeURIComponent(agentId)}`;
}

function formatActivityTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function activityPreview(detail) {
  const text = (detail || "").trim();
  if (!text) return "(empty)";
  if (text.length <= ACTIVITY_PREVIEW_LEN) return text;
  return `${text.slice(0, ACTIVITY_PREVIEW_LEN)}…`;
}

function phaseLabel(phase) {
  const map = {
    thinking: "Thinking",
    tool: "Tool",
    writing: "Writing",
    status: "Status",
    task: "Task",
    done: "Done",
    routing: "Routing",
    specialist: "Specialist",
    idle: "Idle",
  };
  return map[phase] || phase;
}

function renderParticipants() {
  participantsEl.innerHTML = "";
  for (const [id, p] of Object.entries(participants)) {
    const row = document.createElement("div");
    const isActive = activeAuthor === id;
    const isTyping = typing.has(id);
    const agentId = agentBindings[id];
    const dashboardUrl = id !== "human" ? cursorAgentUrl(agentId) : null;
    const currentPhase = isActive ? phaseLabel(loopPhase) : "";
    row.className =
      "participant" +
      (isTyping ? " typing" : "") +
      (isActive ? " active-agent" : "") +
      (dashboardUrl ? " has-dashboard" : "");
    row.innerHTML = `
      <span class="dot" style="background:${p.color}"></span>
      <div class="meta">
        <div class="name">${escapeHtml(p.name)}${isActive ? `<span class="phase-tag">${escapeHtml(currentPhase)}</span>` : ""}</div>
        <div class="label">${escapeHtml(p.label)}</div>
      </div>${
        dashboardUrl
          ? `<div class="participant-popover" role="tooltip">
        <a class="participant-link" href="${escapeHtml(dashboardUrl)}" target="_blank" rel="noopener noreferrer">Open in Cursor ↗</a>
      </div>`
          : ""
      }`;
    participantsEl.appendChild(row);
  }
}

/** Update the pinned live monitor panel */
function updateLiveMonitor() {
  const newest = activityLog.at(-1);
  const isStreaming =
    newest &&
    activeAuthor === newest.author &&
    STREAMING_PHASES.has(newest.phase);

  if (!isStreaming || !activeAuthor) {
    liveMonitorEl.hidden = true;
    return;
  }

  liveMonitorEl.hidden = false;
  const who = participants[activeAuthor]?.name || activeAuthor;
  const color = participants[activeAuthor]?.color || "#4ade80";
  lmWhoEl.textContent = who;
  lmWhoEl.style.color = color;
  lmPhaseEl.textContent = phaseLabel(newest.phase);
  lmElapsedEl.textContent = activeElapsedMs > 0 ? formatElapsed(activeElapsedMs) : "";

  const text = newest.detail || "";
  lmBodyEl.textContent = text;
  // Auto-scroll to bottom as text streams in
  lmBodyEl.scrollTop = lmBodyEl.scrollHeight;
}

/** Flat card activity log — no accordion noise */
function renderActivity() {
  activityFeedEl.innerHTML = "";
  const items = activityLog.slice(-MAX_ACTIVITY).reverse();

  if (!items.length) {
    activityFeedEl.innerHTML = `<p class="activity-empty">Waiting for agent activity…</p>`;
    activityCountEl.hidden = true;
    updateLiveMonitor();
    return;
  }

  activityCountEl.textContent = String(items.length);
  activityCountEl.hidden = false;

  for (const item of items) {
    const detail = (item.detail || "").trim();
    const who = participants[item.author]?.name || item.author;
    const color = participants[item.author]?.color || "#888";
    const isExpanded = openActivityIds.has(item.id);
    const expandable = detail.length > ACTIVITY_PREVIEW_LEN;

    const card = document.createElement("div");
    card.className =
      `activity-item phase-${item.phase}` +
      (expandable ? " activity-expandable" : "") +
      (isExpanded ? " activity-expanded" : "");
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="activity-row">
        <span class="activity-who" style="color:${color}">${escapeHtml(who)}</span>
        <span class="activity-phase">${escapeHtml(phaseLabel(item.phase))}</span>
        <time class="activity-time" datetime="${new Date(item.ts).toISOString()}">${escapeHtml(formatActivityTime(item.ts))}</time>
      </div>
      ${detail ? `<div class="activity-preview">${escapeHtml(detail)}</div>` : ""}`;

    if (expandable) {
      card.addEventListener("click", () => {
        if (card.classList.contains("activity-expanded")) {
          card.classList.remove("activity-expanded");
          openActivityIds.delete(item.id);
        } else {
          card.classList.add("activity-expanded");
          openActivityIds.add(item.id);
        }
      });
    }

    activityFeedEl.appendChild(card);
  }

  updateLiveMonitor();
}

function recordActivity(item) {
  const last = activityLog.at(-1);
  const canMerge =
    last &&
    last.author === item.author &&
    last.phase === item.phase &&
    (item.phase === "tool"
      ? last.tool === item.tool
      : STREAMING_PHASES.has(item.phase));

  if (canMerge) {
    last.detail = item.detail ?? last.detail;
    last.ts = item.ts;
    if (item.tool) last.tool = item.tool;
  } else {
    activityLog.push({
      ...item,
      id: `act-${++activityIdCounter}`,
    });
    if (activityLog.length > MAX_ACTIVITY * 2) {
      const removed = activityLog.splice(0, activityLog.length - MAX_ACTIVITY);
      for (const r of removed) openActivityIds.delete(r.id);
    }
  }
  renderActivity();
}

function pushActivity(item) {
  recordActivity(item);
}

function renderAssets(assets) {
  if (!assets?.length) {
    assetsAccordion.hidden = true;
    assetsCountEl.hidden = true;
    return;
  }
  assetsAccordion.hidden = false;
  assetsCountEl.textContent = String(assets.length);
  assetsCountEl.hidden = false;
  assetsListEl.innerHTML = assets
    .map(
      (a) =>
        `<li><span class="asset-tool">${escapeHtml(a.tool)}</span> <code>${escapeHtml(a.path)}</code></li>`,
    )
    .join("");
}

function messageClass(author) {
  if (author === "human") return "human";
  if (author === "system") return "system";
  if (author === "orchestrator") return "orchestrator";
  return "agent";
}

function appendMessage({ id, author, text }) {
  const el = document.createElement("article");
  el.className = `msg ${messageClass(author)}`;
  el.dataset.id = id;
  const label = participants[author]?.name || author;
  el.innerHTML = `<span class="author" style="color:${participants[author]?.color || "#888"}">${escapeHtml(label)}</span><span class="body">${escapeHtml(text)}</span>`;
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function updateLiveBar() {
  const show =
    brainstormActive ||
    typing.size > 0 ||
    activeAuthor ||
    loopPhase !== "idle" ||
    autoRetrying;

  liveBar.hidden = !show;
  liveBar.classList.toggle("retrying", autoRetrying);
  liveBar.classList.remove("slow");

  if (!show) {
    liveLabel.textContent = "Idle";
    liveElapsed.textContent = "";
    return;
  }

  if (autoRetrying) {
    liveLabel.textContent = "Retrying…";
    liveElapsed.textContent =
      autoRetryInSec > 0 ? `in ${autoRetryInSec}s` : "starting";
    return;
  }

  if (activeAuthor) {
    const name = participants[activeAuthor]?.name || activeAuthor;
    liveLabel.textContent = `${name} · ${phaseLabel(loopPhase)}`;
    liveElapsed.textContent = formatElapsed(activeElapsedMs);
    if (activeElapsedMs > 90000) {
      liveElapsed.textContent += " · may be slow";
      liveBar.classList.add("slow");
    }
  } else if (typing.size > 0) {
    const who = [...typing][0];
    liveLabel.textContent = `${participants[who]?.name || who} starting…`;
    liveElapsed.textContent = "";
  } else {
    liveLabel.textContent = phaseLabel(loopPhase);
    liveElapsed.textContent = "";
  }
}

function updateStatus() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    statusEl.textContent = "Reconnecting…";
    statusEl.classList.remove("live", "retrying");
    updateLiveBar();
    return;
  }
  if (autoRetrying) {
    statusEl.textContent =
      autoRetryInSec > 0
        ? `Auto-retry in ${autoRetryInSec}s…`
        : "Auto-retrying…";
    statusEl.classList.add("retrying");
    statusEl.classList.remove("live");
    updateLiveBar();
    return;
  }
  if (waitingForHuman) {
    statusEl.textContent = "Your turn required";
    statusEl.classList.add("live");
    statusEl.classList.remove("retrying");
    updateLiveBar();
    return;
  }
  if (agentsPaused) {
    statusEl.textContent = "Paused";
    statusEl.classList.remove("live", "retrying");
    updateLiveBar();
    return;
  }
  if (brainstormActive || typing.size > 0 || activeAuthor) {
    statusEl.textContent = "Agents working…";
    statusEl.classList.add("live");
    statusEl.classList.remove("retrying");
    updateLiveBar();
    return;
  }
  statusEl.textContent = "Live";
  statusEl.classList.add("live");
  statusEl.classList.remove("retrying");
  updateLiveBar();
}

function showGoal(goal) {
  const text = (goal || "").trim();
  if (!text) {
    goalBar.hidden = true;
    return;
  }
  goalText.textContent = text;
  goalBar.hidden = false;
}

function updateComposerState() {
  const connected = ws && ws.readyState === WebSocket.OPEN;
  sendBtn.disabled = !connected;
  input.disabled = !connected;
  topicInput.disabled = !connected;
  pauseBtn.textContent = agentsPaused ? "Resume agents" : "Pause agents";
  pauseBtn.disabled =
    !connected || (agentsPaused && waitingForHuman);
  forceStopBtn.disabled =
    !connected ||
    (agentsPaused && !brainstormActive && typing.size === 0 && !activeAuthor && !autoRetrying);
}

function startHeartbeatTicker() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (activeAuthor && !autoRetrying) activeElapsedMs += 1000;
    updateLiveBar();
    updateStatus();
    updateLiveMonitor();
  }, 1000);
}

function maybeResumeFlow(data) {
  if (
    !ws ||
    ws.readyState !== WebSocket.OPEN ||
    !data.messages?.length ||
    data.waitingForHuman ||
    data.brainstormActive
  ) {
    return;
  }
  ws.send(JSON.stringify({ type: "resume_agents" }));
}

function handleServerMessage(data) {
  switch (data.type) {
    case "init":
      activityLog.length = 0;
      openActivityIds.clear();
      activityIdCounter = 0;
      loopPhase = "idle";
      participants = data.participants;
      agentBindings = data.agentBindings || {};
      brainstormActive = data.brainstormActive;
      agentsPaused = data.agentsPaused;
      waitingForHuman = data.waitingForHuman;
      autoRetrying = data.autoRetrying || false;
      autoRetryInSec = data.autoRetryInSec || 0;
      activeAuthor = data.activeAuthor || null;
      activeElapsedMs = data.activeElapsedMs || 0;
      topicInput.value = data.sessionTopic || "";
      showGoal(data.conversationGoal || "");
      renderParticipants();
      renderActivity();
      renderAssets(data.assets || []);
      chatEl.innerHTML = "";
      for (const msg of data.messages) appendMessage(msg);
      updateStatus();
      updateComposerState();
      maybeResumeFlow(data);
      break;
    case "participants_update":
      participants = data.participants;
      if (data.agentBindings) agentBindings = data.agentBindings;
      renderParticipants();
      break;
    case "agent_bindings_update":
      agentBindings = data.agentBindings || {};
      renderParticipants();
      break;
    case "message":
      appendMessage(data);
      break;
    case "typing":
      if (data.active) typing.add(data.author);
      else typing.delete(data.author);
      renderParticipants();
      updateStatus();
      updateComposerState();
      break;
    case "brainstorm_active":
      brainstormActive = data.active;
      agentsPaused = data.paused;
      updateStatus();
      updateComposerState();
      break;
    case "waiting_for_human":
      waitingForHuman = data.active;
      updateStatus();
      updateComposerState();
      break;
    case "auto_retry":
      autoRetrying = data.active;
      autoRetryInSec = data.inSec || 0;
      if (data.hint) {
        hintEl.textContent = data.hint;
        hintEl.classList.toggle("retrying", autoRetrying);
      }
      updateStatus();
      updateComposerState();
      break;
    case "goal_update":
      if (data.topic) topicInput.value = data.topic;
      showGoal(data.goal);
      break;
    case "assets_update":
      renderAssets(data.assets);
      break;
    case "activity_start":
      autoRetrying = false;
      autoRetryInSec = 0;
      hintEl.classList.remove("retrying");
      activeAuthor = data.author;
      activeElapsedMs = 0;
      pushActivity({
        author: data.author,
        phase: "status",
        detail: `${data.label || data.author} started`,
        ts: data.ts,
      });
      renderParticipants();
      updateStatus();
      updateComposerState();
      break;
    case "activity":
      recordActivity({
        author: data.author,
        phase: data.phase,
        detail: data.detail,
        tool: data.tool,
        ts: data.ts,
      });
      updateStatus();
      break;
    case "activity_end":
      if (activeAuthor === data.author) activeAuthor = null;
      pushActivity({
        author: data.author,
        phase: "done",
        detail: data.reason === "stopped" ? "Stopped" : "Turn complete",
        ts: data.ts,
      });
      liveMonitorEl.hidden = true;
      renderParticipants();
      updateStatus();
      updateComposerState();
      break;
    case "loop_phase":
      loopPhase = data.phase;
      if (data.author) activeAuthor = data.author;
      updateStatus();
      break;
    case "heartbeat":
      if (data.author === activeAuthor) {
        activeElapsedMs = data.elapsedMs;
        updateLiveBar();
      }
      break;
    case "system":
      appendMessage({
        id: `sys-${Date.now()}`,
        author: "system",
        text: data.text,
      });
      break;
    default:
      break;
  }
}

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(`${wsProto}://${location.host}`);

  ws.addEventListener("open", () => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    ws.send(JSON.stringify({ type: "sync" }));
    updateStatus();
    updateComposerState();
    startHeartbeatTicker();
  });

  ws.addEventListener("close", () => {
    updateStatus();
    updateComposerState();
    if (!reconnectTimer) {
      reconnectTimer = setInterval(() => connectWebSocket(), 3000);
    }
  });

  ws.addEventListener("message", (event) => {
    try {
      handleServerMessage(JSON.parse(event.data));
    } catch {
      /* ignore */
    }
  });
}

connectWebSocket();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: "human_message",
      text,
      topic: topicInput.value.trim(),
    }),
  );
  input.value = "";
  input.focus();
  form.scrollIntoView({ block: "end", behavior: "smooth" });
});

pauseBtn.addEventListener("click", () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: agentsPaused ? "resume_agents" : "pause_agents" }));
});

forceStopBtn.addEventListener("click", () => {
  if (!ws || ws.readyState !== WebSocket.OPEN || forceStopBtn.disabled) return;
  ws.send(JSON.stringify({ type: "force_stop" }));
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
