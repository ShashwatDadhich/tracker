const STORAGE_KEY = "accountability-challenge-v1";
const SIGNER_STORAGE_KEY = "accountability-signer-v1";
const DAYS = 40;
const START_DATE_PARTS = { year: 2026, month: 4, day: 7 };
const CT_TIME_ZONE = "America/Chicago";
const states = ["pending", "done"];
const QUICK_TIME_PRESETS = [
  { label: "0:30", minutes: 0, seconds: 30 },
  { label: "1:00", minutes: 1, seconds: 0 },
  { label: "1:30", minutes: 1, seconds: 30 },
  { label: "2:00", minutes: 2, seconds: 0 },
  { label: "3:00", minutes: 3, seconds: 0 },
  { label: "5:00", minutes: 5, seconds: 0 },
];

const logoutBtn = document.getElementById("logoutBtn");
const sessionBoard = document.getElementById("sessionBoard");
const currentDayLabel = document.getElementById("currentDayLabel");
const currentDateLine = document.getElementById("currentDateLine");
const todayInstruction = document.getElementById("todayInstruction");
const currentDayTag = document.getElementById("currentDayTag");
const activeSignerLabel = document.getElementById("activeSignerLabel");
const doneCount = document.getElementById("doneCount");
const remainingCount = document.getElementById("remainingCount");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const saveState = document.getElementById("saveState");
const editableDaySelect = document.getElementById("editableDaySelect");

const activeSigner = loadActiveSigner();
if (!activeSigner) {
  window.location.replace("index.html");
}

let currentChallengeDay = findCurrentDay();
const sessionDefinitions = getSessionDefinitions(activeSigner);
let store = createDefaultState();
let selectedEditableDay = currentChallengeDay;

init();

logoutBtn.addEventListener("click", () => {
  window.localStorage.removeItem(SIGNER_STORAGE_KEY);
  window.location.href = "index.html";
});

function loadActiveSigner() {
  const saved = window.localStorage.getItem(SIGNER_STORAGE_KEY);
  return saved === "Kiran" || saved === "Shashwat" ? saved : "";
}

function createDefaultState() {
  return Array.from({ length: DAYS }, (_, index) => ({
    day: index + 1,
    date: formatDate(createChallengeDateParts(index)),
    entries: {
      "kiran-am": { state: "pending", note: "" },
      "kiran-pm": { state: "pending", note: "" },
      "shashwat-am": { state: "pending", note: "" },
      "shashwat-pm": { state: "pending", note: "" },
    },
  }));
}

function sanitizeEntry(entry, fallback) {
  if (!entry || typeof entry !== "object") {
    return { ...fallback };
  }

  return {
    state: states.includes(entry.state) ? entry.state : "pending",
    note: typeof entry.note === "string" ? entry.note : fallback.note,
  };
}

function persist() {
  if (saveState) {
    saveState.textContent = "Saving...";
  }
  fetch("/api/state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(store),
  })
    .then(() => {
      if (saveState) {
        saveState.textContent = "Saved in database";
      }
    })
    .catch(() => {
      if (saveState) {
        saveState.textContent = "Save failed";
      }
    });
}

async function init() {
  store = await fetchState();
  renderDashboardState();
  renderSessionBoard();
  refreshSummary();
  startDailyRefresh();
}

async function fetchState() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) {
      throw new Error("Failed to load state");
    }

    const parsed = await response.json();
    return normalizeState(parsed);
  } catch {
    return createDefaultState();
  }
}

function normalizeState(parsed) {
  const fallbackState = createDefaultState();

  if (!Array.isArray(parsed) || parsed.length !== DAYS) {
    return fallbackState;
  }

  return parsed.map((row, index) => {
    const fallback = fallbackState[index];
    return {
      day: row.day ?? fallback.day,
      date: row.date ?? fallback.date,
      entries: {
        "kiran-am": sanitizeEntry(row.entries?.["kiran-am"], fallback.entries["kiran-am"]),
        "kiran-pm": sanitizeEntry(row.entries?.["kiran-pm"], fallback.entries["kiran-pm"]),
        "shashwat-am": sanitizeEntry(row.entries?.["shashwat-am"], fallback.entries["shashwat-am"]),
        "shashwat-pm": sanitizeEntry(row.entries?.["shashwat-pm"], fallback.entries["shashwat-pm"]),
      },
    };
  });
}

function renderDashboardState() {
  const now = new Date();
  currentChallengeDay = findCurrentDay();
  selectedEditableDay = Math.min(selectedEditableDay, currentChallengeDay);
  const currentDayText = getChallengeDayText(now);

  currentDayLabel.textContent = currentDayText;
  currentDayTag.textContent = currentDayText;
  currentDateLine.textContent = formatLongDateInCT(now);
  renderEditableDaySelector();

  if (activeSigner === "Shashwat") {
    todayInstruction.textContent = "Signed in as Shashwat.";
  } else {
    todayInstruction.textContent = "Signed in as Kiran.";
  }

  activeSignerLabel.textContent = activeSigner;
}

function renderSessionBoard() {
  sessionBoard.innerHTML = "";

  if (selectedEditableDay > currentChallengeDay) {
    selectedEditableDay = currentChallengeDay;
  }

  const currentDayEntry = store[selectedEditableDay - 1];
  sessionDefinitions.forEach((definition) => {
    const entry = currentDayEntry.entries[definition.field];
    const duration = parseDuration(entry.note);
    const card = document.createElement("article");
    card.className = "session-card";
    card.dataset.field = definition.field;

    card.innerHTML = `
      <div class="session-card__top">
        <div>
          <p class="session-kicker">${definition.person}</p>
          <h3>${definition.title}</h3>
        </div>
        <span class="session-badge" data-session-badge></span>
      </div>
      <p class="session-date">${currentDayEntry.date}</p>
      <div class="state-pills" role="group" aria-label="Set status for ${definition.title}">
        ${states.map((state) => `<button type="button" class="state-pill" data-state="${state}">${stateLabel(state)}</button>`).join("")}
      </div>
      <div class="session-time">
        <div class="time-grid">
          <label class="time-group">
            <span>Minutes</span>
            <select data-minute-select></select>
          </label>
          <label class="time-group">
            <span>Seconds</span>
            <select data-second-select></select>
          </label>
        </div>
      </div>
      <div class="session-actions">
        <button type="button" class="session-save">Save Day ${selectedEditableDay} mark</button>
      </div>
      <p class="session-summary" data-session-summary></p>
    `;

    const badge = card.querySelector("[data-session-badge]");
    const summary = card.querySelector("[data-session-summary]");
    const minuteSelect = card.querySelector("[data-minute-select]");
    const secondSelect = card.querySelector("[data-second-select]");
    const saveButton = card.querySelector(".session-save");
    const stateButtons = [...card.querySelectorAll(".state-pill")];

    populateTimeSelect(minuteSelect, 120, duration.minutes);
    populateTimeSelect(secondSelect, 59, duration.seconds);

    updateSessionCard(card, entry, badge, summary, minuteSelect, secondSelect);

    stateButtons.forEach((button) => {
      const buttonState = button.dataset.state;
      button.classList.toggle("is-active", buttonState === entry.state);
      button.addEventListener("click", () => {
        if (!canEditSelectedDay()) {
          if (saveState) {
            saveState.textContent = "Future days are locked";
          }
          return;
        }
        entry.state = buttonState;
        currentDayEntry.entries[definition.field] = entry;
        persist();
        updateSessionCard(card, entry, badge, summary, minuteSelect, secondSelect);
      });
    });

    const syncDurationPreview = () => {
      const minutes = Number(minuteSelect.value);
      const seconds = Number(secondSelect.value);
      const formatted = formatDuration(minutes, seconds);
      summary.textContent = `Time report: ${formatted}`;
    };

    minuteSelect.addEventListener("change", syncDurationPreview);
    secondSelect.addEventListener("change", syncDurationPreview);

    saveButton.addEventListener("click", () => {
      if (!canEditSelectedDay()) {
        if (saveState) {
          saveState.textContent = "Future days are locked";
        }
        return;
      }
      const minutes = Number(minuteSelect.value);
      const seconds = Number(secondSelect.value);
      entry.note = formatDuration(minutes, seconds);
      currentDayEntry.entries[definition.field] = entry;
      persist();
      updateSessionCard(card, entry, badge, summary, minuteSelect, secondSelect);
      refreshSummary();
    });

    syncDurationPreview();
    sessionBoard.appendChild(card);
  });
}

function renderEditableDaySelector() {
  if (!editableDaySelect) {
    return;
  }

  editableDaySelect.innerHTML = "";
  const maxDay = currentChallengeDay;

  for (let day = maxDay; day >= 1; day -= 1) {
    const option = document.createElement("option");
    option.value = String(day);
    option.textContent = `Day ${day} - ${store[day - 1].date}`;
    if (day === selectedEditableDay) {
      option.selected = true;
    }
    editableDaySelect.appendChild(option);
  }
}

function canEditSelectedDay() {
  return selectedEditableDay <= currentChallengeDay;
}

function updateSessionCard(card, entry, badge, summary, minuteSelect, secondSelect) {
  const duration = parseDuration(entry.note);
  badge.textContent = stateLabel(entry.state);
  badge.dataset.state = entry.state;
  card.dataset.state = entry.state;
  [...card.querySelectorAll(".state-pill")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.state === entry.state);
  });
  minuteSelect.value = String(duration.minutes);
  secondSelect.value = String(duration.seconds);
  summary.textContent = entry.note
    ? `Time report: ${entry.note}`
    : "Pick a preset or choose mins and secs, then save.";
}

function populateTimeSelect(selectElement, maxValue, selectedValue) {
  selectElement.innerHTML = "";

  for (let value = 0; value <= maxValue; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = value < 10 ? `0${value}` : String(value);
    if (value === selectedValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  }
}

function refreshSummary() {
  const totalSessions = DAYS * sessionDefinitions.length;
  const activeFields = sessionDefinitions.map((definition) => definition.field);
  const completed = store.reduce((sum, row) => {
    return sum + activeFields.reduce((rowSum, field) => rowSum + (row.entries[field].state === "done" ? 1 : 0), 0);
  }, 0);
  const remaining = totalSessions - completed;
  const percent = Math.round((completed / totalSessions) * 100);

  doneCount.textContent = String(completed);
  remainingCount.textContent = String(remaining);
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function getSessionDefinitions(signer) {
  if (signer === "Shashwat") {
    return [
      { field: "kiran-am", person: "Kiran", title: "Morning session" },
      { field: "kiran-pm", person: "Kiran", title: "Evening session" },
    ];
  }

  return [
    { field: "shashwat-am", person: "Shashwat", title: "Morning session" },
    { field: "shashwat-pm", person: "Shashwat", title: "Evening session" },
  ];
}

function findCurrentDay() {
  const offset = getChallengeOffset(new Date());
  return clampChallengeDay(offset);
}

function getChallengeDayText(date) {
  const offset = getChallengeOffset(date);

  if (offset < 1) {
    return "Challenge starts tomorrow";
  }

  if (offset > DAYS) {
    return "Challenge complete";
  }

  return `Challenge Day ${offset}`;
}

function stateLabel(state) {
  return state === "done" ? "Done" : "Pending";
}

function parseDuration(note) {
  const match = typeof note === "string" ? note.match(/^(\d+)\s*mins?\s*(\d+)\s*secs?$/i) : null;
  if (!match) {
    return { minutes: 0, seconds: 0 };
  }

  return {
    minutes: Math.min(Number(match[1]), 120),
    seconds: Math.min(Number(match[2]), 59),
  };
}

function formatDuration(minutes, seconds) {
  return `${minutes} mins ${seconds} secs`;
}

function formatDate(date) {
  return `${date.month}/${date.day}/${date.year}`;
}

function startDailyRefresh() {
  let previousChallengeDay = currentChallengeDay;

  window.setInterval(() => {
    const nextChallengeDay = findCurrentDay();
    renderDashboardState();

    if (nextChallengeDay !== previousChallengeDay) {
      renderSessionBoard();
    }

    previousChallengeDay = nextChallengeDay;
  }, 60000);
}

editableDaySelect?.addEventListener("change", (event) => {
  const nextDay = Number(event.target.value);
  if (!Number.isFinite(nextDay) || nextDay < 1 || nextDay > currentChallengeDay) {
    selectedEditableDay = currentChallengeDay;
    renderEditableDaySelector();
    return;
  }

  selectedEditableDay = nextDay;
  renderSessionBoard();
});

function createChallengeDateParts(dayIndex) {
  const utcMillis = Date.UTC(
    START_DATE_PARTS.year,
    START_DATE_PARTS.month - 1,
    START_DATE_PARTS.day + dayIndex
  );
  const utcDate = new Date(utcMillis);
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function getChallengeOffset(date) {
  const ctDateParts = getDatePartsInTimeZone(date, CT_TIME_ZONE);
  const currentDayNumber = toUtcDayNumber(ctDateParts);
  const startDayNumber = toUtcDayNumber(START_DATE_PARTS);
  return currentDayNumber - startDayNumber + 1;
}

function clampChallengeDay(day) {
  return Math.min(Math.max(day, 1), DAYS);
}

function toUtcDayNumber(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
}

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function formatLongDateInCT(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CT_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
