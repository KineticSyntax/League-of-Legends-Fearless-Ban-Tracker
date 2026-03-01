let deleted = new Set();
let showDeleted = false;
let champions = [];
let latest;

const grid = document.getElementById("champGrid");
const searchInput = document.getElementById("search");
const toggleDeletedBtn = document.getElementById("toggleDeleted");
const restoreAllBtn = document.getElementById("restoreAll");
const statusText = document.getElementById("statusText");
const remainingText = document.getElementById("remainingText");
const deletedSection = document.getElementById("deletedSection");
const deletedList = document.getElementById("deletedList");

async function loadChampions() {
    const versions = await fetch(
        "https://ddragon.leagueoflegends.com/api/versions.json",
    ).then((res) => res.json());

    latest = versions[0]; // assign, don't redeclare

    const data = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`,
    ).then((res) => res.json());

    champions = Object.values(data.data);
    render();
}

function render() {
    grid.innerHTML = "";
    deletedList.innerHTML = "";

    const search = searchInput.value.toLowerCase();

    const filtered = champions.filter(
        (c) =>
            c.name.toLowerCase().includes(search) &&
            (showDeleted ? deleted.has(c.name) : !deleted.has(c.name)),
    );

    filtered.forEach((c) => {
        const card = document.createElement("div");
        card.className = "card";
        if (deleted.has(c.name)) card.classList.add("deleted");

        card.innerHTML = `
      <div class="img-wrapper">
        <img class="champ-img"
            src="https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.id}.png">
        ${deleted.has(c.name) ? `<img class="ban-img" src="assets/img/Ban.png">` : ""}
      </div>
      <div class="card-name">${c.name}</div>`;

        card.onclick = () => {
            if (deleted.has(c.name)) deleted.delete(c.name);
            else deleted.add(c.name);
            render();
        };

        grid.appendChild(card);
    });

    // ---- Counters ----
    const activeCount = champions.length - deleted.size;
    const deletedCount = deleted.size;

    statusText.textContent = `${activeCount} ACTIVE`;
    remainingText.textContent = `${deletedCount} DELETED`;
    toggleDeletedBtn.textContent = `DELETED (${deletedCount})`;

    // ---- Deleted Section ----
    if (deletedCount > 0) {
        restoreAllBtn.classList.remove("hidden");
    } else {
        restoreAllBtn.classList.add("hidden");
    }

    if (!showDeleted && !deletedCount > 0) {
        deletedSection.classList.add("hidden");
    }
}

searchInput.addEventListener("input", render);

toggleDeletedBtn.addEventListener("click", () => {
    showDeleted = !showDeleted;
    render();
});

restoreAllBtn.addEventListener("click", () => {
    deleted.clear();
    showDeleted = false;
    render();
});

loadChampions();
