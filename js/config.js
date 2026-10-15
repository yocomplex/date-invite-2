// Everything you might want to tweak lives here.
window.CONFIG = {
  // Web3Forms access keys are public by design (they only let people email YOU).
  web3formsKey: "82ba40e3-65a2-42a8-88eb-9da43d48f506",
  web3formsUrl: "https://api.web3forms.com/submit",

  herName: "Dani",

  // Competition
  joshHighScore: 10, // ghosts bosh caught in 20s. Beatable on purpose.
  gameSeconds: 20,
  triviaPassMark: 3, // she wins the trivia round with this many of 5

  dates: [
    { id: "2026-10-17", label: "Saturday, Oct 17" },
    { id: "2026-10-18", label: "Sunday, Oct 18" },
  ],
  times: ["4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"],

  // type: single = pick 1, multi = pick up to `pick`. `need` correct picks to pass.
  trivia: [
    {
      prompt: "Where does bosh want to travel before anywhere else?",
      type: "single",
      options: ["Japan", "Philippines", "India", "Germany"],
      answers: ["Japan"],
      need: 1,
      reveal: "Japan. Number one on the list.",
    },
    {
      prompt: "What does bosh love doing?",
      sub: "Pick all that apply.",
      type: "multi",
      pick: 4,
      options: ["Raves", "Pickleball", "Ragebaiting Dani", "Making music"],
      answers: ["Raves", "Pickleball", "Ragebaiting Dani", "Making music"],
      need: 1,
      reveal: "All of it. Raves, pickleball, ragebaiting Dani and making music.",
    },
    {
      prompt: "Pick bosh's top 3 love languages.",
      sub: "Get 2 of 3 and you're in.",
      type: "multi",
      pick: 3,
      options: ["Words of Affirmation", "Receiving Gifts", "Quality Time", "Physical Touch", "Acts of Service"],
      answers: ["Quality Time", "Physical Touch", "Acts of Service"],
      need: 2,
      reveal: "Quality Time, then Physical Touch, then Acts of Service.",
    },
    {
      prompt: "Pick 3 of bosh's favorite artists.",
      sub: "Get 2 of 3 and you're in.",
      type: "multi",
      pick: 3,
      options: ["Knock2", "ISOxo", "RL Grime", "Kai Wachi", "Lil Uzi Vert", "The Kid LAROI", "Gunna", "Playboi Carti", "Crankdat"],
      answers: ["Knock2", "ISOxo", "RL Grime", "Kai Wachi", "Lil Uzi Vert", "The Kid LAROI"],
      need: 2,
      reveal: "Knock2, ISOxo, RL Grime, Kai Wachi, Lil Uzi Vert and The Kid LAROI.",
    },
    {
      prompt: "What are bosh's favorite colors?",
      sub: "Pick up to 2. Get 1 right and you're in.",
      type: "multi",
      pick: 2,
      options: ["Orange", "Black", "Pink", "Blue", "Green", "Purple"],
      answers: ["Orange", "Black"],
      need: 1,
      reveal: "Orange and black. Very on theme for October.",
    },
  ],

  // Unscored, just for fun.
  hotTakes: [
    { q: "Dani LOVES the smell of vomit.", yes: "Absolutely", no: "Sarcasm detected" },
    { q: "Dani LOVES having stroke patients at work.", yes: "Absolutely", no: "Sarcasm detected" },
    { q: "Dani LOVES psych DKA patients that recently got a stroke.", yes: "Absolutely", no: "Sarcasm detected" },
  ],

  // Pick as many as she likes. Anything unticked is off the table.
  prizes: [
    { id: "kiss", e: "😘", n: "We go on a ferris wheel and kiss" },
    { id: "boba", e: "😋", n: "Grab boba" },
    { id: "hands", e: "👬👭", n: "Hold hands at the pumpkin patch" },
    { id: "photos", e: "📸", n: "Take pictures at the pumpkin patch, but as a \"soft launch\"" },
  ],
};
