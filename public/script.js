let deleted = new Set();
let showDeleted = false;
let champions = [];
let latest;
let selectedRole = null;
let championRoles = {};
let selectedTags = new Set(); 

const grid = document.getElementById("champGrid");
const searchInput = document.getElementById("search");
const toggleDeletedBtn = document.getElementById("toggleDeleted");
const restoreAllBtn = document.getElementById("restoreAll");
const statusText = document.getElementById("statusText");
const remainingText = document.getElementById("remainingText");
const deletedSection = document.getElementById("deletedSection");
const deletedList = document.getElementById("deletedList");
const tagDropdownBtn = document.getElementById("tagDropdownBtn");
const tagDropdownMenu = document.getElementById("tagDropdownMenu");



document.querySelectorAll(".role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const role = btn.dataset.role;

        selectedRole = selectedRole === role ? null : role;

        render();
    });
});
const roleButtons = document.querySelectorAll(".role-btn");
    roleButtons.forEach(button => {
    button.addEventListener("click", () => {

        const isActive = button.classList.contains("active");

        roleButtons.forEach(btn => btn.classList.remove("active"));

        if (!isActive) {
        button.classList.add("active");
        }

    });
    });

function saveState() {
    const state = {
        deleted: [...deleted],
        selectedTags: [...selectedTags],
        selectedRole: selectedRole,
        search: searchInput.value,
        showDeleted: showDeleted
    };
    localStorage.setItem("champTrackerState", JSON.stringify(state));
}

function loadState() {
    const stateJSON = localStorage.getItem("champTrackerState");
    if (!stateJSON) return;

    const state = JSON.parse(stateJSON);

    deleted = new Set(state.deleted || []);
    selectedTags = new Set(state.selectedTags || []);
    selectedRole = state.selectedRole || null;
    searchInput.value = state.search || "";
    showDeleted = state.showDeleted || false;
}

async function loadChampions() {
    const versions = await fetch(
        "https://ddragon.leagueoflegends.com/api/versions.json"
    ).then((res) => res.json());

    latest = versions[0];

    const data = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`
    ).then((res) => res.json());

    champions = Object.values(data.data);

    await Promise.all(
        champions.map(async (champ) => {
            try {
                const response = await fetch(
                    `https://raw.communitydragon.org/latest/game/data/characters/${champ.id.toLowerCase()}/${champ.id.toLowerCase()}.bin.json`
                );

                const json = await response.json();

            let recInfo = null;

            for (const key in json) {
                if (json[key]?.RecSpellRankUpInfos) {
                    recInfo = json[key].RecSpellRankUpInfos;
                    break;
                }
            }

                if (!recInfo) {
                    championRoles[champ.name] = null;
                    return;
                }
                const srRoles = recInfo
                    .filter(r => r.MapId === 11)
                    .map(r => normalizeRole(r.Position));
                championRoles[champ.name] = srRoles;

            } catch (err) {
                championRoles[champ.name] = null;
            }
        })
    );

    generateTagDropdown();
    render();
}

function normalizeRole(position) {
    if (!position) return null;

    position = position.toLowerCase();

    if (position === "top") return "Top";
    if (position === "middle") return "Mid";
    if (position === "utility") return "Support";
    if (position === "bottom") return "ADC";
    if (position.includes("jungle")) return "Jungle";

    return null;
}
//====================================================================================================

function render() {
    grid.innerHTML = "";
    deletedList.innerHTML = "";

    const search = searchInput.value.toLowerCase();

    const filtered = champions.filter(c => {
        const search = searchInput.value.toLowerCase();
        const matchesSearch = c.name.toLowerCase().includes(search);
        const matchesDeleted = showDeleted ? deleted.has(c.name) : !deleted.has(c.name);

        let matchesRole = true;
        if (selectedRole) {
            matchesRole = championRoles[c.name]?.includes(selectedRole);
        }

        let matchesTags = true;
        if (selectedTags.size > 0) {
            matchesTags = [...selectedTags].every(tag => c.tags.includes(tag));
        }

        return matchesSearch && matchesDeleted && matchesRole && matchesTags;
    });

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
            saveState();
        };

        grid.appendChild(card);
    });

    // ---- Counters ----
    const activeCount = champions.length - deleted.size;
    const deletedCount = deleted.size;

    statusText.textContent = `${activeCount} ACTIVE`;
    remainingText.textContent = `${deletedCount} BANNED`;
    toggleDeletedBtn.textContent = `BANNED (${deletedCount})`;

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

function generateTagDropdown() {
    // Collect unique tags
    const allTags = new Set();
    champions.forEach(champ => champ.tags.forEach(tag => allTags.add(tag)));

    // Clear existing menu
    tagDropdownMenu.innerHTML = "";

    allTags.forEach(tag => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.checked = selectedTags.has(tag);

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) selectedTags.add(tag);
            else selectedTags.delete(tag);
            render();
            saveState();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + tag));
        tagDropdownMenu.appendChild(label);
    });
}

// Toggle dropdown visibility
tagDropdownBtn.addEventListener("click", () => {
    tagDropdownMenu.classList.toggle("hidden");
});

// Close dropdown if clicked outside
document.addEventListener("click", (e) => {
    if (!tagDropdownBtn.contains(e.target) && !tagDropdownMenu.contains(e.target)) {
        tagDropdownMenu.classList.add("hidden");
    }
});



searchInput.addEventListener("input", () => {
    render();
    saveState();
})

toggleDeletedBtn.addEventListener("click", () => {
    showDeleted = !showDeleted;
    render();
    saveState();
});

restoreAllBtn.addEventListener("click", () => {
    deleted.clear();
    showDeleted = false;
    render();
    saveState();
});

loadState();
loadChampions();