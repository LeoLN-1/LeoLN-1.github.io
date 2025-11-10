let coins = 0;
let coinsPerClick = 1;
let coinsPerSecond = 0;

const characterBtn = document.getElementById("character-btn");
const counters = document.querySelectorAll(".counter");
const textbox = document.getElementById("textbox");
const shopBtn = document.getElementById("shop-btn");
const shop = document.getElementById("shop");
const upgrade1 = document.getElementById("upgrade1");
const upgrade2 = document.getElementById("upgrade2");
const intro = document.getElementById("intro");

const shopFooter = document.querySelector(".shop-footer");

let messages = [];
let currentMessageIndex = 0;
let isTyping = false;
let autoNextTimer = null;

let upgrades = {
  upgrade1: { name: "Upgrade 1", cost: 20, bonus: 1, scale: 1.5, type: "click" },
  upgrade2: { name: "Upgrade 2", cost: 100, bonus: 5, scale: 1.5, type: "click" },
  auto1: { name: "Auto Clicker", cost: 50, bonus: 1, scale: 1.5, type: "auto" },
  auto2: { name: "Coin Factory", cost: 250, bonus: 5, scale: 1.6, type: "auto" }
};

function loadData() {
  const savedData = JSON.parse(localStorage.getItem("meiClickerData"));
  if (savedData) {
    coins = savedData.coins || 0;
    coinsPerClick = savedData.coinsPerClick || 1;
    coinsPerSecond = savedData.coinsPerSecond || 0;

    for (const key in upgrades) {
      upgrades[key] = { ...upgrades[key], ...(savedData.upgrades?.[key] || {}) };
    }

    updateCounters();
    createShopButtons();
    queueText(["Welcome back!"]);
  } else {
    updateCounters();
    createShopButtons();
    queueText(["Hello! I’m Mei! ( •ᴗ• )", "Click me to earn Mei Coins!"]);
  }
}

function updateCounters() {
  counters.forEach(counter => {
    counter.textContent = `Mei Coins: ${coins}`;
  });
}

function createShopButtons() {
  updateShopButtons();

  for (const id in upgrades) {
    if (id === "upgrade1" || id === "upgrade2") continue;
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement("div");
      btn.classList.add("shop-item");
      btn.id = id;
      shop.insertBefore(btn, shopFooter);
      btn.addEventListener("click", () => buyUpgrade(id));
    }
  }

  updateShopButtons();
}

function updateShopButtons() {
  for (const id in upgrades) {
    const upg = upgrades[id];
    const btn = document.getElementById(id);
    if (btn) {
      const typeLabel = upg.type === "auto" ? "per second" : "per click";
      btn.textContent = `${upg.name} — +${upg.bonus} ${typeLabel} (Cost: ${upg.cost})`;
    }
  }
}

window.addEventListener("load", () => {
  loadData();
  setTimeout(() => {
    intro.classList.add("fade-out");
    setTimeout(() => intro.remove(), 1000);
  }, 2500);
});

setInterval(() => {
  const data = { coins, coinsPerClick, coinsPerSecond, upgrades };
  localStorage.setItem("meiClickerData", JSON.stringify(data));
  console.log("Autosaved data");
}, 10000);

setInterval(() => {
  if (coinsPerSecond > 0) {
    coins += coinsPerSecond;
    updateCounters();
  }
}, 1000);

characterBtn.addEventListener("click", () => {
  coins += coinsPerClick;
  updateCounters();

  if (coins === 1) queueText(["Your first Mei Coin!"]);
  if (coins === 10) queueText(["You’re getting rich!", "Maybe check out the shop."]);
  if (coins === 50) queueText(["So rich! 💰"]);
});

shopBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  shop.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (shop.classList.contains("show") && !shop.contains(e.target) && e.target !== shopBtn) {
    shop.classList.remove("show");
  }
});

upgrade1.addEventListener("click", () => buyUpgrade("upgrade1"));
upgrade2.addEventListener("click", () => buyUpgrade("upgrade2"));

function buyUpgrade(id) {
  const upg = upgrades[id];
  if (!upg) return;

  if (coins >= upg.cost) {
    coins -= upg.cost;

    if (upg.type === "click") {
      coinsPerClick += upg.bonus;
    } else if (upg.type === "auto") {
      coinsPerSecond += upg.bonus;
    }

    upg.cost = Math.floor(upg.cost * upg.scale);
    updateCounters();
    updateShopButtons();

    queueText([
      `You bought ${upg.name}! ✨ (+${upg.bonus} ${upg.type === "auto" ? "per second" : "per click"})`
    ]);
  } else {
    queueText(["Not enough Mei Coins!"]);
  }
}

function queueText(newMessages) {
  if (isTyping) return;
  messages = newMessages;
  currentMessageIndex = 0;
  showNextMessage();
}

function showNextMessage() {
  if (currentMessageIndex < messages.length) {
    typeText(messages[currentMessageIndex]);
    currentMessageIndex++;
  } else {
    textbox.classList.add("hidden");
  }
}

function typeText(text) {
  textbox.textContent = "";
  textbox.classList.remove("hidden");
  isTyping = true;
  clearTimeout(autoNextTimer);

  let i = 0;
  const interval = setInterval(() => {
    textbox.textContent += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      isTyping = false;

      // Auto-continue after 5 seconds
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

document.addEventListener("click", (e) => {
  const clickedInteractable = e.target.closest(
    "#character-btn, #shop, #shop-btn, .shop-item"
  );
  if (!clickedInteractable && !isTyping && !shop.classList.contains("show")) {
    clearTimeout(autoNextTimer);
    showNextMessage();
  }
});
