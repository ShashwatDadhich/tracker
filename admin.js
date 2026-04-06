const STORAGE_KEY = "accountability-challenge-v1";
const SIGNER_STORAGE_KEY = "accountability-signer-v1";
const DAYS = 40;
const START_DATE_PARTS = { year: 2026, month: 4, day: 7 };
const CT_TIME_ZONE = "America/Chicago";

const logoutBtn = document.getElementById("logoutBtn");
const adminTitle = document.getElementById("adminTitle");
const adminDateLine = document.getElementById("adminDateLine");
const adminInstruction = document.getElementById("adminInstruction");
const adminDayTag = document.getElementById("adminDayTag");
const adminKiranProgress = document.getElementById("adminKiranProgress");
const adminShashwatProgress = document.getElementById("adminShashwatProgress");
const adminPercent = document.getElementById("adminPercent");
const adminProgressFill = document.getElementById("adminProgressFill");
const adminTimesheetBody = document.getElementById("adminTimesheetBody");
const matrixMorning = document.getElementById("matrixMorning");
const matrixEvening = document.getElementById("matrixEvening");
const matrixKiran = document.getElementById("matrixKiran");
const matrixShashwat = document.getElementById("matrixShashwat");

const activeSigner = loadActiveSigner();
if (activeSigner !== "Admin") {
  window.location.replace("index.html");
}

let currentChallengeDay = findCurrentDay();
let store = createDefaultState();

init();

logoutBtn.addEventListener("click", () => {
  window.localStorage.removeItem(SIGNER_STORAGE_KEY);
  window.location.href = "index.html";
});

function loadActiveSigner() {
  const saved = window.localStorage.getItem(SIGNER_STORAGE_KEY);
  return saved === "Admin" ? saved : "";
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
    state: entry.state === "done" ? "done" : "pending",
    note: typeof entry.note === "string" ? entry.note : fallback.note,
  };
}

function renderHeader() {
  const now = new Date();
  currentChallengeDay = findCurrentDay();
  const currentDayText = getChallengeDayText(now);

  adminTitle.textContent = "Read-only control room";
  adminDayTag.textContent = currentDayText;
  adminDateLine.textContent = formatLongDateInCT(now);
  adminInstruction.textContent = "Inspect the full timesheet and the daily matrix dashboard. Editing is disabled.";
}

async function init() {
  store = await fetchState();
  renderHeader();
  renderTimesheet();
  renderMatrix();
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

function renderTimesheet() {
  adminTimesheetBody.innerHTML = "";

  store.forEach((row) => {
    const rowElement = document.createElement("tr");
    rowElement.className = row.day === currentChallengeDay ? "is-current-day" : "";

    rowElement.innerHTML = `
      <td>${row.day}</td>
      <td>${row.date}</td>
      <td>${renderReadonlyCell(row.entries["kiran-am"])}</td>
      <td>${renderReadonlyCell(row.entries["kiran-pm"])}</td>
      <td>${renderReadonlyCell(row.entries["shashwat-am"])}</td>
      <td>${renderReadonlyCell(row.entries["shashwat-pm"])}</td>
    `;

    adminTimesheetBody.appendChild(rowElement);
  });
}

function renderMatrix() {
  const morningEntries = store.map((row) => [row.entries["kiran-am"], row.entries["shashwat-am"]]).flat();
  const eveningEntries = store.map((row) => [row.entries["kiran-pm"], row.entries["shashwat-pm"]]).flat();
  const kiranEntries = store.map((row) => [row.entries["kiran-am"], row.entries["kiran-pm"]]).flat();
  const shashwatEntries = store.map((row) => [row.entries["shashwat-am"], row.entries["shashwat-pm"]]).flat();

  matrixMorning.textContent = `${Math.round(rateDone(morningEntries) * 100)}%`;
  matrixEvening.textContent = `${Math.round(rateDone(eveningEntries) * 100)}%`;
  matrixKiran.textContent = `${Math.round(rateDone(kiranEntries) * 100)}%`;
  matrixShashwat.textContent = `${Math.round(rateDone(shashwatEntries) * 100)}%`;
}

function refreshSummary() {
  const kiranDone = store.reduce((sum, row) => {
    return sum + [row.entries["kiran-am"], row.entries["kiran-pm"]].filter((entry) => entry.state === "done").length;
  }, 0);
  const shashwatDone = store.reduce((sum, row) => {
    return sum + [row.entries["shashwat-am"], row.entries["shashwat-pm"]].filter((entry) => entry.state === "done").length;
  }, 0);
  const percent = Math.round(((kiranDone + shashwatDone) / (DAYS * 4)) * 100);

  adminKiranProgress.textContent = `${kiranDone} / 80`;
  adminShashwatProgress.textContent = `${shashwatDone} / 80`;
  adminPercent.textContent = `${percent}%`;
  adminProgressFill.style.width = `${percent}%`;
}

function rateDone(entries) {
  if (!entries.length) {
    return 0;
  }

  return entries.filter((entry) => entry.state === "done").length / entries.length;
}

function cellText(entry) {
  return entry.state === "done" ? "Done" : "Pending";
}

function renderReadonlyCell(entry) {
  const timeText = entry.note ? entry.note : "No time reported";
  return `<span class="readonly-cell ${cellClass(entry.state)}"><strong>${cellText(entry)}</strong><small>${timeText}</small></span>`;
}

function cellClass(state) {
  return state === "done" ? "is-done" : "is-pending";
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

function formatDate(date) {
  return `${date.month}/${date.day}/${date.year}`;
}

function startDailyRefresh() {
  let previousChallengeDay = currentChallengeDay;

  window.setInterval(() => {
    const nextChallengeDay = findCurrentDay();
    renderHeader();

    if (nextChallengeDay !== previousChallengeDay) {
      renderTimesheet();
    }

    previousChallengeDay = nextChallengeDay;
  }, 60000);
}

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
