const itineraries = [
  {
    id: "kansai-budget",
    title: "7 Hari Kansai Budget",
    destination: "Osaka, Kyoto, Nara",
    duration: 7,
    budget: 8550000,
    style: "Budget trip",
    season: "Semi",
    image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=80",
    creator: {
      name: "Risa Tanaka",
      username: "@risa.route",
      bio: "Slow traveler, pemburu ramen, dan spreadsheet budget.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    },
    likes: 1500,
    saves: 860,
    copied: 112,
    description:
      "Rute Kansai yang nyaman untuk first-timer: transit mudah, makan enak, dan masih punya ruang buat jalan santai tanpa mengejar terlalu banyak tempat.",
    notes:
      "Ambil ICOCA sejak tiba di KIX, simpan cash kecil untuk shrine dan street food, lalu pilih penginapan dekat Namba atau Umeda agar pindah kota tetap ringan.",
    tags: ["Kuliner", "Transport mudah", "City tour", "Budget", "Sakura"],
    costBreakdown: [
      { label: "Transport", value: 2150000, icon: "car" },
      { label: "Makan", value: 2450000, icon: "food" },
      { label: "Tiket", value: 1450000, icon: "camera" },
      { label: "Lain-lain", value: 2500000, icon: "wallet" },
    ],
    days: [
      {
        title: "Hari 1 - Osaka",
        activities: [
          { time: "09.00", title: "Tiba di KIX, beli ICOCA & Haruka", type: "Transport", cost: 350000, icon: "plane" },
          { time: "12.00", title: "Makan ichiran Dotonbori", type: "Kuliner", cost: 120000, icon: "food" },
          { time: "14.00", title: "Sightseeing Dotonbori & Shinsaibashi", type: "City walk", cost: 0, icon: "camera" },
          { time: "18.30", title: "Check-in hotel Shin-Osaka", type: "Stay", cost: 640000, icon: "hotel" },
        ],
      },
      {
        title: "Hari 2 - Kyoto",
        activities: [
          { time: "08.00", title: "Kereta ke Kyoto Station", type: "Transport", cost: 90000, icon: "car" },
          { time: "10.00", title: "Fushimi Inari sampai viewpoint", type: "Culture", cost: 0, icon: "camera" },
          { time: "13.00", title: "Lunch dekat Nishiki Market", type: "Kuliner", cost: 160000, icon: "food" },
          { time: "16.30", title: "Kiyomizudera golden hour", type: "Temple", cost: 65000, icon: "camera" },
        ],
      },
      {
        title: "Hari 3 - Nara",
        activities: [
          { time: "08.30", title: "Kintetsu Nara dari Namba", type: "Transport", cost: 95000, icon: "car" },
          { time: "10.00", title: "Nara Park & Todaiji", type: "Nature", cost: 90000, icon: "camera" },
          { time: "14.00", title: "Mochi Nakatanidou", type: "Kuliner", cost: 45000, icon: "food" },
          { time: "18.00", title: "Balik Osaka, dinner Kuromon", type: "Kuliner", cost: 180000, icon: "food" },
        ],
      },
    ],
  },
  {
    id: "bali-nature",
    title: "Bali 4D3N Sawah & Pantai",
    destination: "Ubud, Canggu, Uluwatu",
    duration: 4,
    budget: 3200000,
    style: "Nature",
    season: "Kemarau",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80",
    creator: {
      name: "Made Aruna",
      username: "@madejalan",
      bio: "Local host yang suka rute sunrise dan warung rumahan.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    },
    likes: 2100,
    saves: 1240,
    copied: 208,
    description:
      "Paduan Ubud yang hijau, cafe hopping di Canggu, dan sunset Uluwatu dengan budget terkontrol untuk pasangan atau solo traveler.",
    notes:
      "Sewa motor hanya kalau sudah nyaman berkendara. Untuk Uluwatu, berangkat lebih awal karena traffic sore bisa padat.",
    tags: ["Nature", "Couple", "Pantai", "Sunset", "Budget"],
    costBreakdown: [
      { label: "Transport", value: 650000, icon: "car" },
      { label: "Makan", value: 950000, icon: "food" },
      { label: "Tiket", value: 350000, icon: "camera" },
      { label: "Stay", value: 1250000, icon: "hotel" },
    ],
    days: [
      {
        title: "Hari 1 - Ubud",
        activities: [
          { time: "10.00", title: "Tiba di Bali dan drop barang", type: "Transport", cost: 180000, icon: "plane" },
          { time: "13.00", title: "Lunch nasi campur Ubud", type: "Kuliner", cost: 70000, icon: "food" },
          { time: "15.00", title: "Tegallalang rice terrace", type: "Nature", cost: 50000, icon: "camera" },
          { time: "19.00", title: "Dinner di pusat Ubud", type: "Kuliner", cost: 120000, icon: "food" },
        ],
      },
      {
        title: "Hari 2 - Canggu",
        activities: [
          { time: "08.30", title: "Campuhan Ridge Walk", type: "Nature", cost: 0, icon: "camera" },
          { time: "11.00", title: "Pindah ke Canggu", type: "Transport", cost: 250000, icon: "car" },
          { time: "15.30", title: "Pantai Batu Bolong", type: "Beach", cost: 0, icon: "camera" },
          { time: "18.00", title: "Sunset dan seafood", type: "Kuliner", cost: 180000, icon: "food" },
        ],
      },
    ],
  },
  {
    id: "jogja-kuliner",
    title: "Jogja 3D2N Kuliner Klasik",
    destination: "Yogyakarta",
    duration: 3,
    budget: 1650000,
    style: "Kuliner",
    season: "Akhir pekan",
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1400&q=80",
    creator: {
      name: "Nabila Putri",
      username: "@nabila.travel",
      bio: "Nyusun rute pendek yang enak buat cuti tipis.",
      avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=160&q=80",
    },
    likes: 980,
    saves: 690,
    copied: 88,
    description:
      "Weekend santai di Jogja dengan fokus makan, jalan kaki ringan, dan beberapa spot budaya yang tidak terlalu padat.",
    notes:
      "Gudeg populer cepat habis. Simpan beberapa alternatif warung agar jadwal tetap lentur.",
    tags: ["Kuliner", "Budget", "Culture", "Weekend", "City walk"],
    costBreakdown: [
      { label: "Transport", value: 420000, icon: "car" },
      { label: "Makan", value: 520000, icon: "food" },
      { label: "Tiket", value: 210000, icon: "camera" },
      { label: "Stay", value: 500000, icon: "hotel" },
    ],
    days: [
      {
        title: "Hari 1 - Pusat Kota",
        activities: [
          { time: "09.00", title: "Tiba di Stasiun Tugu", type: "Transport", cost: 0, icon: "plane" },
          { time: "10.30", title: "Brunch gudeg legendaris", type: "Kuliner", cost: 55000, icon: "food" },
          { time: "14.00", title: "Taman Sari dan Keraton", type: "Culture", cost: 45000, icon: "camera" },
          { time: "19.00", title: "Angkringan Kopi Joss", type: "Kuliner", cost: 45000, icon: "food" },
        ],
      },
      {
        title: "Hari 2 - Utara Jogja",
        activities: [
          { time: "08.00", title: "Sarapan soto lokal", type: "Kuliner", cost: 35000, icon: "food" },
          { time: "10.00", title: "Museum Ullen Sentalu", type: "Culture", cost: 60000, icon: "camera" },
          { time: "15.00", title: "Kopi sore Kaliurang", type: "Kuliner", cost: 70000, icon: "food" },
          { time: "20.00", title: "Bakmi Jawa", type: "Kuliner", cost: 55000, icon: "food" },
        ],
      },
    ],
  },
  {
    id: "singapore-family",
    title: "Singapore 3D2N Family Easy",
    destination: "Singapore",
    duration: 3,
    budget: 6900000,
    style: "Family",
    season: "Libur sekolah",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=80",
    creator: {
      name: "Dimas Pradana",
      username: "@dimasfamilytrip",
      bio: "Trip keluarga yang anti ribet dan stroller-friendly.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    },
    likes: 760,
    saves: 510,
    copied: 54,
    description:
      "Rute keluarga yang dekat MRT, minim pindah hotel, dan punya kombinasi taman, aquarium, serta city lights.",
    notes:
      "Pilih hotel dekat jalur MRT utama. Beli attraction ticket online agar antrian anak-anak lebih singkat.",
    tags: ["Family", "City tour", "MRT", "Kids", "Praktis"],
    costBreakdown: [
      { label: "Transport", value: 1100000, icon: "car" },
      { label: "Makan", value: 1600000, icon: "food" },
      { label: "Tiket", value: 2200000, icon: "camera" },
      { label: "Stay", value: 2000000, icon: "hotel" },
    ],
    days: [
      {
        title: "Hari 1 - Marina Bay",
        activities: [
          { time: "11.00", title: "Tiba di Changi dan MRT ke hotel", type: "Transport", cost: 120000, icon: "plane" },
          { time: "14.30", title: "Gardens by the Bay", type: "City tour", cost: 350000, icon: "camera" },
          { time: "18.30", title: "Dinner Satay by the Bay", type: "Kuliner", cost: 220000, icon: "food" },
          { time: "20.00", title: "Spectra light show", type: "City lights", cost: 0, icon: "camera" },
        ],
      },
      {
        title: "Hari 2 - Sentosa",
        activities: [
          { time: "09.00", title: "S.E.A Aquarium", type: "Kids", cost: 780000, icon: "camera" },
          { time: "13.00", title: "Lunch VivoCity", type: "Kuliner", cost: 260000, icon: "food" },
          { time: "16.00", title: "Palawan Beach", type: "Beach", cost: 0, icon: "camera" },
          { time: "19.00", title: "Balik hotel via MRT", type: "Transport", cost: 70000, icon: "car" },
        ],
      },
    ],
  },
];

const state = {
  currentId: "kansai-budget",
  tab: "summary",
  dayIndex: 0,
  filter: "Semua",
  search: "",
  saved: readStorage("jalanin.saved", []),
  liked: readStorage("jalanin.liked", []),
  created: readStorage("jalanin.created", []),
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const $ = (selector) => document.querySelector(selector);

const allItineraries = () => [...state.created, ...itineraries];

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function icon(name) {
  const map = {
    food: "food",
    car: "car",
    camera: "camera",
    hotel: "hotel",
    plane: "plane",
    wallet: "wallet",
    route: "route",
  };

  return `<svg aria-hidden="true"><use href="#icon-${map[name] || name}"></use></svg>`;
}

function currentItinerary() {
  return allItineraries().find((item) => item.id === state.currentId) ?? allItineraries()[0];
}

function formatCompact(number) {
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}K`;
  return number.toString();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function render() {
  const item = currentItinerary();
  const saved = state.saved.includes(item.id);
  const liked = state.liked.includes(item.id);

  $("#heroImage").src = item.image;
  $("#heroImage").alt = item.destination;
  $("#heroKicker").textContent = item.destination;
  $("#heroTitle").textContent = item.title;
  $("#creatorAvatar").src = item.creator.avatar;
  $("#creatorAvatar").alt = item.creator.name;
  $("#creatorName").textContent = item.creator.name;

  $("#quickMeta").innerHTML = [
    ["calendar", "Durasi", `${item.duration} hari`],
    ["wallet", "Total", rupiah.format(item.budget)],
    ["route", "Biaya/hari", rupiah.format(Math.round(item.budget / item.duration))],
    ["star", "Style", item.style],
    ["map-pin", "Destinasi", item.destination],
  ]
    .map(
      ([iconName, label, value]) => `
        <span class="meta-item">
          ${icon(iconName)}
          <span>${label}: <strong>${value}</strong></span>
        </span>
      `,
    )
    .join("");

  $("#likeButton").classList.toggle("active", liked);
  $("#likeButton span").textContent = liked ? `Disukai (${formatCompact(item.likes + 1)})` : `Suka (${formatCompact(item.likes)})`;
  $("#saveButton").classList.toggle("active", saved);
  $("#saveButton span").textContent = saved ? "Tersimpan" : `Simpan Rute (${formatCompact(item.saves)})`;

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === state.tab);
  });

  renderTab(item);
  renderSidebar(item);
  renderFeed();
}

function renderTab(item) {
  const panel = $("#tabPanel");

  if (state.tab === "summary") {
    panel.innerHTML = `
      <div class="summary-grid">
        <article class="summary-card">
          <span class="summary-icon">${icon("compass")}</span>
          <h3>Konsep Trip</h3>
          <p>${item.description}</p>
        </article>
        <article class="summary-card">
          <span class="summary-icon">${icon("wallet")}</span>
          <h3>Budget Realistis</h3>
          <p>${rupiah.format(item.budget)} untuk ${item.duration} hari, sekitar ${rupiah.format(Math.round(item.budget / item.duration))} per hari.</p>
        </article>
        <article class="summary-card">
          <span class="summary-icon">${icon("route")}</span>
          <h3>Siap Digunakan</h3>
          <p>${item.copied} traveler sudah memakai rute ini sebagai template perjalanan pribadi.</p>
        </article>
      </div>
      <article class="notes-card">
        <h3>Catatan creator</h3>
        <p>${item.notes}</p>
      </article>
    `;
    return;
  }

  if (state.tab === "days") {
    const day = item.days[state.dayIndex] ?? item.days[0];
    panel.innerHTML = `
      <div class="day-title">
        <h2>${day.title}</h2>
        <div class="day-switcher">
          ${item.days
            .map(
              (_, index) => `
                <button class="${index === state.dayIndex ? "active" : ""}" data-day="${index}">
                  ${index + 1}
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="timeline">
        ${day.activities
          .map(
            (activity) => `
              <article class="activity-card">
                <div class="activity-time">${activity.time}</div>
                <div class="activity-icon">${icon(activity.icon)}</div>
                <div class="activity-main">
                  <strong>${activity.title}</strong>
                  <span>${activity.type}</span>
                </div>
                <div class="activity-cost">${activity.cost ? rupiah.format(activity.cost) : "Gratis"}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
    panel.querySelectorAll("[data-day]").forEach((button) => {
      button.addEventListener("click", () => {
        state.dayIndex = Number(button.dataset.day);
        render();
      });
    });
    return;
  }

  const steps = item.days.flatMap((day) => day.activities).slice(0, 4);
  panel.innerHTML = `
    <div class="route-board">
      <div class="large-map">
        <span class="map-pin">1</span>
        <span class="map-pin">2</span>
        <span class="map-pin">3</span>
        <span class="map-pin">4</span>
      </div>
      <div class="route-list">
        ${steps
          .map(
            (step, index) => `
              <article class="route-step">
                <span>${index + 1}</span>
                <div>
                  <strong>${step.title}</strong>
                  <small>${step.time} - ${step.type}</small>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderSidebar(item) {
  $("#budgetStyle").textContent = item.style;
  $("#budgetTotal").textContent = rupiah.format(item.budget);
  $("#budgetLines").innerHTML = item.costBreakdown
    .map(
      (line) => `
        <div class="budget-line">
          ${icon(line.icon)}
          <span>${line.label}</span>
          <strong>${rupiah.format(line.value)}</strong>
        </div>
      `,
    )
    .join("");

  $("#tagList").innerHTML = [...item.tags, item.season].map((tag) => `<span>${tag}</span>`).join("");
  $("#authorAvatar").src = item.creator.avatar;
  $("#authorAvatar").alt = item.creator.name;
  $("#authorName").textContent = item.creator.name;
  $("#authorBio").textContent = item.creator.bio;
  $("#mapDay").textContent = state.dayIndex + 1;
  $("#mapPreview").innerHTML = `
    <span class="mini-pin">1</span>
    <span class="mini-pin">2</span>
    <span class="mini-pin">3</span>
    <span class="mini-pin">4</span>
  `;

  const savedItems = allItineraries().filter((savedItem) => state.saved.includes(savedItem.id));
  $("#savedCount").textContent = savedItems.length;
  $("#savedList").innerHTML = savedItems.length
    ? savedItems
        .map(
          (savedItem) => `
            <button class="compact-item" data-open="${savedItem.id}">
              <img src="${savedItem.image}" alt="${savedItem.destination}" />
              <span>
                <strong>${savedItem.title}</strong>
                <span>${savedItem.duration} hari - ${rupiah.format(savedItem.budget)}</span>
              </span>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state">Belum ada rute tersimpan. Simpan itinerary yang ingin kamu pakai nanti.</div>`;

  $("#savedList").querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => selectItinerary(button.dataset.open));
  });
}

function renderFeed() {
  const filters = ["Semua", "Budget trip", "Kuliner", "Nature", "Family", "City tour"];
  $("#filterChips").innerHTML = filters
    .map((filter) => `<button class="chip ${state.filter === filter ? "active" : ""}" data-filter="${filter}">${filter}</button>`)
    .join("");

  $("#filterChips").querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      renderFeed();
    });
  });

  const query = state.search.trim().toLowerCase();
  const items = allItineraries().filter((item) => {
    const matchesFilter = state.filter === "Semua" || item.style === state.filter || item.tags.includes(state.filter);
    const haystack = `${item.title} ${item.destination} ${item.style} ${item.tags.join(" ")}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesFilter && matchesSearch;
  });

  $("#feedGrid").innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="feed-card">
              <button data-itinerary="${item.id}">
                <img src="${item.image}" alt="${item.destination}" />
                <div class="feed-card-body">
                  <h3>${item.title}</h3>
                  <p>${item.destination}</p>
                  <div class="feed-card-meta">
                    <span>${icon("calendar")}${item.duration} hari</span>
                    <span>${icon("wallet")}${rupiah.format(item.budget)}</span>
                  </div>
                </div>
              </button>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Tidak ada itinerary yang cocok dengan pencarian ini.</div>`;

  $("#feedGrid").querySelectorAll("[data-itinerary]").forEach((button) => {
    button.addEventListener("click", () => selectItinerary(button.dataset.itinerary));
  });
}

function selectItinerary(id) {
  state.currentId = id;
  state.dayIndex = 0;
  state.tab = "summary";
  render();
  document.querySelector(".app-shell").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openDrawer(mode = "create", baseItem = null) {
  const drawer = $("#drawer");
  const form = $("#itineraryForm");
  form.reset();
  $("#drawerTitle").textContent = mode === "clone" ? "Edit Rute Salinan" : "Buat Itinerary";

  if (baseItem) {
    form.title.value = mode === "clone" ? `${baseItem.title} (Versi Saya)` : baseItem.title;
    form.destination.value = baseItem.destination;
    form.duration.value = baseItem.duration;
    form.image.value = baseItem.image;
    form.budget.value = baseItem.budget;
    form.style.value = baseItem.style;
    form.description.value = baseItem.description;
    form.activities.value = baseItem.days[0].activities
      .map((activity) => `${activity.time} - ${activity.title}`)
      .join("\n");
  }

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  window.setTimeout(() => form.title.focus(), 50);
}

function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
}

function createFromForm(form) {
  const formData = new FormData(form);
  const activityLines = String(formData.get("activities") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const activities = activityLines.length
    ? activityLines.map((line, index) => {
        const [timePart, ...titleParts] = line.split("-");
        return {
          time: timePart.trim() || `${9 + index}.00`,
          title: titleParts.join("-").trim() || line,
          type: index % 2 === 0 ? "City walk" : "Kuliner",
          cost: 0,
          icon: index % 2 === 0 ? "camera" : "food",
        };
      })
    : [
        { time: "09.00", title: "Tiba di destinasi", type: "Transport", cost: 0, icon: "plane" },
        { time: "12.00", title: "Makan siang lokal", type: "Kuliner", cost: 0, icon: "food" },
      ];

  const item = {
    id: `custom-${Date.now()}`,
    title: String(formData.get("title")),
    destination: String(formData.get("destination")),
    duration: Number(formData.get("duration")),
    budget: Number(formData.get("budget")),
    style: String(formData.get("style")),
    season: "Custom",
    image:
      String(formData.get("image")) ||
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    creator: {
      name: "Kamu",
      username: "@jalanin.user",
      bio: "Itinerary pribadi yang siap dibagikan.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    },
    likes: 0,
    saves: 0,
    copied: 0,
    description: String(formData.get("description")),
    notes: "Rute ini masih bisa kamu edit lagi setelah dipakai sebagai template.",
    tags: [String(formData.get("style")), "Custom", "Pribadi"],
    costBreakdown: [
      { label: "Transport", value: Math.round(Number(formData.get("budget")) * 0.28), icon: "car" },
      { label: "Makan", value: Math.round(Number(formData.get("budget")) * 0.32), icon: "food" },
      { label: "Tiket", value: Math.round(Number(formData.get("budget")) * 0.18), icon: "camera" },
      { label: "Stay", value: Math.round(Number(formData.get("budget")) * 0.22), icon: "hotel" },
    ],
    days: [{ title: "Hari 1 - Rute Pertama", activities }],
  };

  state.created = [item, ...state.created];
  writeStorage("jalanin.created", state.created);
  state.currentId = item.id;
  state.tab = "summary";
  state.dayIndex = 0;
  closeDrawer();
  render();
  showToast("Itinerary berhasil dipublish.");
}

function toggleArrayValue(array, value) {
  return array.includes(value) ? array.filter((item) => item !== value) : [...array, value];
}

$("#likeButton").addEventListener("click", () => {
  state.liked = toggleArrayValue(state.liked, state.currentId);
  writeStorage("jalanin.liked", state.liked);
  render();
});

$("#saveButton").addEventListener("click", () => {
  const wasSaved = state.saved.includes(state.currentId);
  state.saved = toggleArrayValue(state.saved, state.currentId);
  writeStorage("jalanin.saved", state.saved);
  render();
  showToast(wasSaved ? "Rute dihapus dari koleksi." : "Rute berhasil disimpan.");
});

$("#cloneButton").addEventListener("click", () => {
  openDrawer("clone", currentItinerary());
  showToast("Template rute disalin ke form kamu.");
});

$("#shareButton").addEventListener("click", async () => {
  const item = currentItinerary();
  const text = `${item.title} - ${item.destination}`;
  try {
    await navigator.clipboard.writeText(`${location.href.split("#")[0]}#${item.id}`);
    showToast("Tautan itinerary berhasil disalin.");
  } catch {
    showToast(text);
  }
});

$("#createButton").addEventListener("click", () => openDrawer("create"));
$("#mobileCreate").addEventListener("click", () => openDrawer("create"));
$("#closeDrawer").addEventListener("click", closeDrawer);
$("#drawerBackdrop").addEventListener("click", closeDrawer);
$("#itineraryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  createFromForm(event.currentTarget);
});

$("#searchInput").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderFeed();
  $("#exploreSection").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    render();
  });
});

$("#exploreButton").addEventListener("click", () => $("#exploreSection").scrollIntoView({ behavior: "smooth", block: "start" }));
$("#mobileHome").addEventListener("click", () => $("#exploreSection").scrollIntoView({ behavior: "smooth", block: "start" }));
$("#savedButton").addEventListener("click", () => $("#savedPanel").scrollIntoView({ behavior: "smooth", block: "center" }));
$("#mobileSaved").addEventListener("click", () => $("#savedPanel").scrollIntoView({ behavior: "smooth", block: "center" }));
$("#homeButton").addEventListener("click", () => selectItinerary("kansai-budget"));
$("#profileButton").addEventListener("click", renderProfile);
$("#mobileProfile").addEventListener("click", renderProfile);

function renderProfile() {
  const panel = $("#tabPanel");
  state.tab = "profile";
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  panel.innerHTML = `
    <article class="profile-panel">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" alt="Profil kamu" />
      <div>
        <h2>Risa Tanaka</h2>
        <p>@risa.route - Jakarta. Suka itinerary padat tapi tetap realistis.</p>
        <div class="profile-stats">
          <span><strong>${state.created.length}</strong> dibuat</span>
          <span><strong>${state.saved.length}</strong> disimpan</span>
          <span><strong>${state.liked.length}</strong> disukai</span>
        </div>
      </div>
      <button class="mini-button">Edit Profil</button>
    </article>
  `;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (location.hash) {
  const id = location.hash.replace("#", "");
  if (allItineraries().some((item) => item.id === id)) state.currentId = id;
}

render();
