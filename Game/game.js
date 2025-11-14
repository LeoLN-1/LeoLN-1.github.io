let coins = 0, coinsPerClick = 1, coinsPerSecond = 0;
const characterBtn = document.getElementById("character-btn");
const counters = document.querySelectorAll(".counter");
const textbox = document.getElementById("textbox");
const shopBtn = document.getElementById("shop-btn");
const shop = document.getElementById("shop");
const shopFooter = document.querySelector(".shop-footer");
const intro = document.getElementById("intro");

let messages = [], currentMessageIndex = 0, isTyping = false, autoNextTimer = null;

const upgrades = {
  upgrade1: { name: "Upgrade 1", cost: 20, bonus: 1, scale: 1.5, type: "click" },
  upgrade2: { name: "Upgrade 2", cost: 100, bonus: 5, scale: 1.5, type: "click" },
  auto1: { name: "Auto Clicker", cost: 50, bonus: 1, scale: 1.5, type: "auto" },
  auto2: { name: "Auto Clicker but better", cost: 250, bonus: 5, scale: 1.6, type: "auto" },
  roomPlant: { name: "Room Plant", cost: 1000, bonusClick: 2, bonusAuto: 1, type: "decor", oneTime: true, image: "plant.png", purchased: false },
  gamingPC: { name: "Gaming PC", cost: 5000, bonusClick: 5, bonusAuto: 3, type: "decor", oneTime: true, image: "pc.png", purchased: false },
  meiStatue: { name: "???", cost: 20000, bonusClick: 10, bonusAuto: 5, type: "decor", oneTime: true, image: "statue.png", purchased: false }
};

const permanentOrder = ["roomPlant", "gamingPC", "meiStatue"];

window.addEventListener("load", () => {
  loadData();
  setTimeout(() => {
    intro.classList.add("fade-out");
    setTimeout(() => intro.remove(), 1000);
  }, 2500);
});

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

  for (const id of normalOrder) {
    const upg = upgrades[id];
    let btn = document.getElementById(id);

    if (!btn) {
      btn = document.createElement("div");
      btn.classList.add("shop-item");
      btn.id = id;
      shop.insertBefore(btn, shopFooter);
    }

    if (!btn.dataset.listenerAdded) {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        buyUpgrade(id);
      });
      btn.dataset.listenerAdded = "1";
    }
  }

  const reference = document.getElementById("auto2");
  for (const id of permanentOrder) makeShopButton(id, reference, "after");

  updateShopButtons();
  refreshPermanentButtons();
}

function makeShopButton(id, reference, position = "after") {
  const upg = upgrades[id];
  let btn = document.getElementById(id);

  if (!btn) {
    btn = document.createElement("div");
    btn.classList.add("shop-item");
    btn.id = id;
    reference.insertAdjacentElement(position === "after" ? "afterend" : "beforebegin", btn);
  }

  if (!btn.dataset.listenerAdded) {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      buyUpgrade(id);
    });
    btn.dataset.listenerAdded = "1";
  }
}

function updateShopButtons() {
  for (const id in upgrades) {
    const u = upgrades[id], btn = document.getElementById(id);
    if (!btn) continue;
    const label = u.type === "auto"
      ? `+${u.bonus} per second`
      : u.type === "click"
      ? `+${u.bonus} per click`
      : `decoration (+${u.bonusClick || 0} click, +${u.bonusAuto || 0} auto)`;
    btn.textContent = `${u.name} — ${label} (Cost: ${u.cost.toLocaleString()})`;
  }
}

function addDecorationImage(u) {
  const img = document.createElement("img");
  img.src = u.image;
  img.alt = u.name;
  img.classList.add("decor-item");
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
    coinsPerClick += u.bonusClick || 0;
    coinsPerSecond += u.bonusAuto || 0;
    u.purchased = true;
    document.getElementById(id)?.remove();
    refreshPermanentButtons();
    queueText([`You added ${u.name} to the room! ✨`]);
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
  coins += coinsPerClick;
  updateCounters();
  if (coins === 1) queueText(["Your first Mei Coin!"]);
  if (coins === 10) queueText(["You’re getting rich!", "Maybe check out the shop."]);
  if (coins === 50) queueText(["So rich!"]);
});

shopBtn.addEventListener("click", e => {
  e.stopPropagation();
  shop.classList.toggle("show");
});

document.addEventListener("click", e => {
  if (shop.classList.contains("show")) {
    const inside = shop.contains(e.target);
    if (!inside && e.target !== shopBtn && e.target !== characterBtn) shop.classList.remove("show");
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
      autoNextTimer = setTimeout(() => !isTyping && showNextMessage(), 5000);
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
  if (!e.target.closest("#character-btn, #shop, #shop-btn, .shop-item") && !isTyping && !shop.classList.contains("show")) {
    clearTimeout(autoNextTimer);
    showNextMessage();
  }
});
