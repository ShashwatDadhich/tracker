const SIGNER_STORAGE_KEY = "accountability-signer-v1";
const DAILY_QUOTE_KEY = "dailyQuote";
const QUOTES = [
  "Imagination is useful as a plan or a fantasy. But the only thing you can experience is what is here Right Now.",
  "When you meet someone, only the sweetest part of you should touch them.",
  "Optimists hallucinate; pessimists get depressed. Both will not get anywhere. You must be willing and able to see everything the way it is.",
  "Whatever life throws at you, if you learn to shake it off and stand on it, you can make it the basis of your growth, maturity, and well-being.",
  "Someone says something nasty because something nasty is happening within them.",
  "Your entire life is a Virtual Reality because you are seeing it only the way it happens in your mind.",
  "In nature, everything is living and giving itself to the maximum extent. Only human beings are trying to save — their joy, their love, and their Peace — to rest in Peace.",
  "All through life, your physical body will age. But your energy body need not age — you can keep it like it was just born.",
  "The moment any sensitive human being misuses something, it will bother them from within. Sensitivity is proportional to one’s sense of Inclusion.",
  "Food is not just nourishment — it is something that makes your life. We need to treat it with utmost love and reverence.",
  "Youth is life in the making. Being youthful means being willing to look inward, seek answers, and create your life the way you want it.",
  "Energy is useful only if you can direct it the way you want. That is when a human being naturally transforms into a spiritual possibility.",
  "If you want brotherhood, it should be with every creature on this planet. If it is limited to certain people, it is the beginning of tyranny.",
  "Maybe you are not able to do what someone else is able to do — so what. You do what you can do in the best possible way, and that is all that matters in life.",
  "The fundamental building blocks in the human system can be transformed very rapidly if one lives in a consecrated space.",
  "I am not here to solace you. I am here to awaken you.",
  "You should know how to carry your memories like a bag in your hand. They are not the essence of your life — they are something that you have accumulated over time.",
  "Christmas has become a symbol of love and light. Around this time, a new cycle of the life-giving Sun begins. May the light of love shine brightly within you. Love and Blessings.",
  "Confusion is better than stupid conclusions. Confusion at least brings humility. Conclusions bring arrogance.",
  "If you are joyful by your own nature, you do not have to prove you are better than anyone else. You are fine the way you are.",
  "It is in the hands of us human beings to either bring disaster upon ourselves or realize transformation. This is why the Conscious Planet movement has become super significant.",
  "Why do certain people irritate you? Simply because they are not the way you expect or want them to be.",
  "If you can access the source of creation within you, you will for sure live a magical life.",
  "It is easier to change your thinking than to change the world. Changing your thinking will definitely change the world.",
  "The only reason why human beings do not naturally become meditative is that they are not at ease. As long as the instinct of survival is on, you are under certain stress and tension.",
  "Raising your level of consciousness means that external situations do not decide who you are.",
  "Constantly thinking that something is wrong with them is a major disease that many human beings are suffering from.",
  "Education should be about expanding one’s horizons, about having a larger vision of life.",
  "In meditation, do not try to go anywhere. There is nowhere to go. Nowhere is limitless. This is the journey from the limited to the limitless.",
  "Be the light of your life.",
  "The past can only be remembered. The present can only be experienced. The future has to be crafted.",
  "May you be blissful. That is the greatest success in life.",
  "Life is available to you only to the extent that you are open to it.t?",
  "Human beings are coming into this world unformed. You can either mold yourself the way you want, or other people and society will mold you. If you allow too many hands to mold you, you will become deformed.",
  "True well-being is not only determined by your physical and mental health but also by the sense of peacefulness, joyfulness, and blissfulness within you.",
  "When you are connected with life, you are naturally blissful. Unconnected with life, you become a mental mess.",
  "The Creator has paid equal attention to every detail of creation. If you pay attention to everything and everyone the same way, your life will be rich.",
  "If one is absolutely devoted to the process of Yoga, it shall take one’s life to its Ultimate Goal.",
  "Meditation is not an act you perform — it is a quality you acquire. You cannot do meditation, but you can become meditative.",
  "Never do Sadhana for life. Do it only for today."
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
  dailyQuote.innerHTML = `${QUOTES[quoteIndex]}<br><span style="font-size: 0.9em; font-weight: 500; color: var(--muted);">– Sadhguru</span>`;
}

function getQuoteIndexForToday() {
  const startDate = new Date("2026-04-07T00:00:00");
  const today = new Date();
  const startDay = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOffset = Math.max(0, Math.floor((todayDay - startDay) / 86400000));
  return dayOffset % QUOTES.length;
}
