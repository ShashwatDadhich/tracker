const SIGNER_STORAGE_KEY = "accountability-signer-v1";
const DAILY_QUOTE_KEY = "dailyQuote";
const QUOTES = [
  "Sadhana is not about doing something; it is about becoming something.",
  "Your sadhana should become as natural as breathing.",
  "Without sadhana, there is no transformation.",
  "Sadhana is a tool to dismantle your limitations.",
  "The purpose of sadhana is to create a stable inner space.",
  "Consistency in sadhana is more important than intensity.",
  "Sadhana is not a practice; it is a way of being.",
  "Through sadhana, you move from compulsiveness to consciousness.",
  "Yoga is not about touching your toes; it is about what you learn on the way down.",
  "Yoga means union—when there is no you and me.",
  "The aim of yoga is to create a life that is free from boundaries.",
  "Yoga is a technology for inner well-being.",
  "Yoga is not exercise; it is a process of aligning your body, mind, and energy.",
  "If you are willing, yoga can transform you completely.",
  "Yoga is the science of activating your inner energies.",
  "When you are in yoga, you are in harmony with existence.",
  "Spirituality is not about becoming special; it is about becoming one with everything.",
  "The spiritual process is not about climbing up; it is about dissolving.",
  "Enlightenment is not a goal; it is a consequence of your inner growth.",
  "If you become absolutely still, existence will reveal itself.",
  "Awareness is the greatest agent for change.",
  "The deeper you go within, the higher you will rise.",
  "Spirituality is about realizing the nature of your existence.",
  "Meditation means dissolving the invisible walls that you have built.",
  "The moment you identify with your mind, you become limited.",
  "Ego is just your imagination of who you are.",
  "If you learn to use your mind, it is a miracle; otherwise, it is misery.",
  "Your thoughts and emotions are not you; they are just accumulations.",
  "Consciousness is not something you create; it is something you realize.",
  "Clarity comes only when you are free from mental clutter.",
  "Joy is not something you get from outside; it is your natural state.",
  "Peace is not the absence of chaos; it is your ability to remain undisturbed.",
  "If you are joyful, you will naturally be loving.",
  "Life becomes beautiful when you are in a state of acceptance.",
  "Well-being is a consequence of how you are within yourself.",
  "Responsibility means your ability to respond consciously.",
  "What you call destiny is just the accumulation of your past actions.",
  "If you take charge of your inner nature, your destiny will be yours.",
  "Life is not about finding yourself; it is about creating yourself consciously.",
  "When you are aligned within, everything you do becomes effortless."
];

const loginButtons = [...document.querySelectorAll("[data-login-role]")];

const dailyQuote = document.getElementById(DAILY_QUOTE_KEY);

renderDailyQuote();

loginButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.loginRole;
    window.localStorage.setItem(SIGNER_STORAGE_KEY, role);
    window.location.href = role === "Admin" ? "admin.html" : "dashboard.html";
  });
});

function renderDailyQuote() {
  if (!dailyQuote) {
    return;
  }

  const quoteIndex = getQuoteIndexForToday();
  dailyQuote.textContent = QUOTES[quoteIndex];
}

function getQuoteIndexForToday() {
  const startDate = new Date("2026-04-07T00:00:00");
  const today = new Date();
  const startDay = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOffset = Math.max(0, Math.floor((todayDay - startDay) / 86400000));
  return dayOffset % QUOTES.length;
}
