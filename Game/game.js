let coins = 0, coinsPerClick = 1, coinsPerSecond = 0;
const characterBtn = document.getElementById("character-btn");
const counters = document.querySelectorAll(".counter");
const textbox = document.getElementById("textbox");
const shopBtn = document.getElementById("shop-btn");
const shop = document.getElementById("shop");
const shopFooter = document.querySelector(".shop-footer");
const intro = document.getElementById("intro");

// hi raz

let messages = [], currentMessageIndex = 0, isTyping = false, autoNextTimer = null;

let clickCooldown = false;
let headpatPlaying = false;

const idleGif = "assets/Idle.gif";
const headpatGif = "assets/headpat.gif";
const headpatDuration = 450;
const clickCooldownTime = 200;

window.addEventListener("load", () => {
  characterBtn.src = idleGif;
  loadData();
  setTimeout(() => {
    intro.classList.add("fade-out");
    setTimeout(() => intro.remove(), 1000);
  }, 2500);
});

const upgrades = {
  upgrade1: { name: "Better Headpats", cost: 10, bonus: 1, scale: 1.5, type: "click" },
  upgrade2: { name: "Even Better Headpats", cost: 100, bonus: 5, scale: 1.35, type: "click" },
  auto1: { name: "Axolotl Worker", cost: 50, bonus: 1, scale: 1.5, type: "auto" },
  auto2: { name: "Monster Refill For The Axolotl", cost: 250, bonus: 5, scale: 1.6, type: "auto" },

  gamingPC: { name: "Gaming PC", cost: 1000, bonusClick: 5, bonusAuto: 3, type: "decor", oneTime: true, image: "assets/pc.png", purchased: false },
  axolotlWorker: { name: "Axolotl Worker", cost: 2500, bonusClick: 10, bonusAuto: 8, type: "decor", oneTime: true, image: "assets/axolotl.png", purchased: false },
  aquarium1: { name: "Aquarium", cost: 8000, bonusClick: 20, bonusAuto: 10, type: "decor", oneTime: true, image: "assets/aquarium1.png", purchased: false, id: "aq1" },
  shelf: { name: "Shelf", cost: 15000, bonusClick: 25, bonusAuto: 15, type: "decor", oneTime: true, image: "assets/shelf.png", purchased: false },
  fumos: { name: "Fumos", cost: 25000, bonusClick: 35, bonusAuto: 25, type: "decor", oneTime: true, image: "assets/fumos.png", purchased: false },
  aquariumUpgrade: { name: "Aquarium Upgrade", cost: 35000, bonusClick: 35, bonusAuto: 25, type: "decorReplace", oneTime: true, image: "assets/aquarium2.png", replaces: "aq1", purchased: false },
  wallPicture: { name: "Picture", cost: 50000, bonusClick: 50, bonusAuto: 35, type: "decor", oneTime: true, image: "assets/picture.png", purchased: false },
  sillyCat: { name: "Silly Cat", cost: 75000, bonusClick: 80, bonusAuto: 50, type: "decor", oneTime: true, image: "assets/sillycat.png", purchased: false },
  bwSet: { name: "Blooming Wings", cost: 125000, bonusClick: 120, bonusAuto: 80, type: "decor", oneTime: true, image: "assets/bws.png", purchased: false },
  meiStatue: { name: "???", cost: 250000, bonusClick: 200, bonusAuto: 100, type: "decor", oneTime: true, image: "assets/statue.png", purchased: false }
};

const permanentOrder = [
  "gamingPC",
  "axolotlWorker",
  "aquarium1",
  "shelf",
  "fumos",
  "aquariumUpgrade",
  "wallPicture",
  "sillyCat",
  "bwSet",
  "meiStatue"
];

function loadData() {
  const saved = JSON.parse(localStorage.getItem("meiClickerData"));
  if (saved) {
    ({ coins = 0, coinsPerClick = 1, coinsPerSecond = 0 } = saved);
    for (const k in upgrades) upgrades[k] = { ...upgrades[k], ...(saved.upgrades?.[k] || {}) };
    queueText(["Welcome back!"]);
  } else {
    queueText(["Hello!", "Click me to earn Mei Coins!"]);
  }

  updateCounters();
  createShopButtons();

  for (const id of permanentOrder) {
    const u = upgrades[id];
    if (u.purchased) {
      if (u.type === "decorReplace") {
        const oldImg = document.querySelector(`[data-decor="${u.replaces}"]`);
        if (oldImg) oldImg.remove();
      }
      addDecorationImage(u);
      coinsPerClick += u.bonusClick || 0;
      coinsPerSecond += u.bonusAuto || 0;
    }
  }

  refreshPermanentButtons();
}

function saveData() {
  localStorage.setItem("meiClickerData", JSON.stringify({ coins, coinsPerClick, coinsPerSecond, upgrades }));
}

setInterval(saveData, 10000);

setInterval(() => {
  if (coinsPerSecond > 0) {
    coins += coinsPerSecond;
    updateCounters();
  }
}, 1000);

function updateCounters() {
  counters.forEach(c => c.textContent = `Mei Coins: ${coins.toLocaleString()}`);
}

function createShopButtons() {
  const normalOrder = ["upgrade1", "upgrade2", "auto1", "auto2"];
  for (const id of normalOrder) createButton(id);

  const reference = document.getElementById("auto2");
  for (const id of permanentOrder) makeShopButton(id, reference);

  updateShopButtons();
  refreshPermanentButtons();
}

function createButton(id) {
  const upg = upgrades[id];
  let btn = document.getElementById(id);

  if (!btn) {
    btn = document.createElement("div");
    btn.classList.add("shop-item");
    btn.id = id;
    shop.insertBefore(btn, shopFooter);
  }

  if (!btn.dataset.listenerAdded) {
    btn.addEventListener("click", e => { e.stopPropagation(); buyUpgrade(id); });
    btn.dataset.listenerAdded = "1";
  }
}

function makeShopButton(id, reference) {
  let btn = document.getElementById(id);

  if (!btn) {
    btn = document.createElement("div");
    btn.classList.add("shop-item");
    btn.id = id;
    reference.insertAdjacentElement("afterend", btn);
  }

  if (!btn.dataset.listenerAdded) {
    btn.addEventListener("click", e => { e.stopPropagation(); buyUpgrade(id); });
    btn.dataset.listenerAdded = "1";
  }
}

function updateShopButtons() {
  for (const id in upgrades) {
    const u = upgrades[id], btn = document.getElementById(id);
    if (!btn) continue;

    let label =
      u.type === "auto" ? `+${u.bonus} per second` :
      u.type === "click" ? `+${u.bonus} per click` :
      u.type === "decorReplace" ? `upgrade (replaces aquarium)` :
      `decoration (+${u.bonusClick || 0} click, +${u.bonusAuto || 0} auto)`;

    btn.textContent = `${u.name} — ${label} (Cost: ${u.cost.toLocaleString()})`;
  }
}

function addDecorationImage(u) {
  const img = document.createElement("img");
  img.src = u.image;
  img.alt = u.name;
  img.classList.add("decor-item");
  img.dataset.decor = u.id || u.name;
  document.querySelector(".game-area").appendChild(img);
}

function refreshPermanentButtons() {
  const first = permanentOrder.findIndex(id => !upgrades[id].purchased);
  permanentOrder.forEach((id, i) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (upgrades[id].purchased) btn.remove();
    else btn.classList.toggle("hidden", i !== first);
  });
}

function buyUpgrade(id) {
  const u = upgrades[id];
  if (!u || coins < u.cost) return queueText(["Not enough Mei Coins!"]);
  coins -= u.cost;

  if (u.type === "click") coinsPerClick += u.bonus;
  else if (u.type === "auto") coinsPerSecond += u.bonus;

  else if (u.type === "decor" && u.oneTime && !u.purchased) {
    addDecorationImage(u);
    coinsPerClick += u.bonusClick;
    coinsPerSecond += u.bonusAuto;
    u.purchased = true;
    document.getElementById(id)?.remove();
    refreshPermanentButtons();
    queueText([`You added ${u.name} to the room! ✨`]);
    updateCounters();
    updateShopButtons();
    return;
  }

  else if (u.type === "decorReplace" && u.oneTime && !u.purchased) {
    const old = document.querySelector(`[data-decor="${u.replaces}"]`);
    if (old) old.remove();

    addDecorationImage(u);
    coinsPerClick += u.bonusClick;
    coinsPerSecond += u.bonusAuto;
    u.purchased = true;
    document.getElementById(id)?.remove();
    refreshPermanentButtons();
    queueText(["Your aquarium has more fish now! 🐟✨"]);
    updateCounters();
    updateShopButtons();
    return;
  }

  u.cost = Math.floor(u.cost * (u.scale || 1.5));
  updateCounters();
  updateShopButtons();
  queueText([`You bought ${u.name}! ✨`]);
}

characterBtn.addEventListener("click", e => {
  e.stopPropagation();
  if (clickCooldown) return;
  clickCooldown = true;

  coins += coinsPerClick;
  updateCounters();

  if (!headpatPlaying) {
    headpatPlaying = true;
    characterBtn.src = headpatGif;

    setTimeout(() => {
      characterBtn.src = idleGif;
      headpatPlaying = false;
    }, headpatDuration);
  }

  setTimeout(() => { clickCooldown = false; }, clickCooldownTime);

  if (coins === 1) queueText(["Your first Mei Coin!"]);
  if (coins === 10) queueText(["You’re getting rich!", "Maybe check out the shop."]);
  if (coins === 50) queueText(["So rich!"]);
  if (coins === 100000) queueText(["You’re crashing the Economy!"]);
  if (coins === 1000000) queueText(["Me Cruel says hi!"]);
});

shopBtn.addEventListener("click", e => { e.stopPropagation(); shop.classList.toggle("show"); });

document.addEventListener("click", e => {
  if (shop.classList.contains("show")) {
    const inside = shop.contains(e.target);
    if (!inside && !e.target.closest("#textbox") && e.target !== shopBtn && e.target !== characterBtn) shop.classList.remove("show");
  }
});

function queueText(newMsgs) {
  if (isTyping) return;
  messages = newMsgs;
  currentMessageIndex = 0;
  showNextMessage();
}

function showNextMessage() {
  if (currentMessageIndex < messages.length) typeText(messages[currentMessageIndex++]);
  else textbox.classList.add("hidden");
}

function typeText(text) {
  textbox.textContent = "";
  textbox.classList.remove("hidden");
  isTyping = true;
  clearTimeout(autoNextTimer);
  let i = 0;
  const timer = setInterval(() => {
    textbox.textContent += text.charAt(i++);
    if (i >= text.length) {
      clearInterval(timer);
      isTyping = false;
      autoNextTimer = setTimeout(() => {
        if (!isTyping) showNextMessage();
      }, 5000);
    }
  }, 30);
}

textbox.addEventListener("click", () => {
  if (!isTyping) {
    clearTimeout(autoNextTimer);
    showNextMessage();
  }
});

document.addEventListener("click", e => {
  if (!e.target.closest("#character-btn, #shop, #shop-btn, .shop-item")
      && !isTyping && !shop.classList.contains("show")) {
    clearTimeout(autoNextTimer);
    showNextMessage();
  }
});
