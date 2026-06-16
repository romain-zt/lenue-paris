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

/** @type {Record<string, { name: string; label: string; color: string }>} */
let participants = {};
/** @type {Set<string>} */
const typing = new Set();
/** @type {Array<{ author: string; phase: string; detail: string; ts: number; tool?: string }>} */
const activityLog = [];
const MAX_ACTIVITY = 40;

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
    row.className =
      "participant" +
      (typing.has(id) ? " typing" : "") +
      (isActive ? " active-agent" : "");
    row.innerHTML = `
      <span class="dot" style="background:${p.color}"></span>
      <div class="meta">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="label">${escapeHtml(p.label)}</div>
      </div>`;
    participantsEl.appendChild(row);
  }
}

function renderActivity() {
  activityFeedEl.innerHTML = "";
  const items = activityLog.slice(-MAX_ACTIVITY).reverse();
  if (!items.length) {
    activityFeedEl.innerHTML = `<p class="activity-empty">Waiting for agent activity…</p>`;
    activityCountEl.hidden = true;
    return;
  }
  activityCountEl.textContent = String(items.length);
  activityCountEl.hidden = false;
  for (const item of items) {
    const row = document.createElement("div");
    row.className = `activity-item phase-${item.phase}`;
    const who = participants[item.author]?.name || item.author;
    row.innerHTML = `
      <div class="activity-head">
        <span class="activity-who" style="color:${participants[item.author]?.color || "#888"}">${escapeHtml(who)}</span>
        <span class="activity-phase">${escapeHtml(phaseLabel(item.phase))}</span>
      </div>
      <div class="activity-detail">${escapeHtml(item.detail || "")}</div>`;
    activityFeedEl.appendChild(row);
  }
}

function pushActivity(item) {
  activityLog.push(item);
  if (activityLog.length > MAX_ACTIVITY * 2) {
    activityLog.splice(0, activityLog.length - MAX_ACTIVITY);
  }
  renderActivity();
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
  }, 1000);
}

function handleServerMessage(data) {
  switch (data.type) {
    case "init":
      participants = data.participants;
      brainstormActive = data.brainstormActive;
      agentsPaused = data.agentsPaused;
      waitingForHuman = data.waitingForHuman;
      autoRetrying = data.autoRetrying || false;
      autoRetryInSec = data.autoRetryInSec || 0;
      activeAuthor = data.activeAuthor || null;
      activeElapsedMs = data.activeElapsedMs || 0;
      if (data.sessionTopic) topicInput.value = data.sessionTopic;
      showGoal(data.conversationGoal || data.sessionTopic);
      renderParticipants();
      renderAssets(data.assets || []);
      chatEl.innerHTML = "";
      for (const msg of data.messages) appendMessage(msg);
      updateStatus();
      updateComposerState();
      break;
    case "participants_update":
      participants = data.participants;
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
      pushActivity({
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
