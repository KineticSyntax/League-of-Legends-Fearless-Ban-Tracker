let deleted = new Set();
let showDeleted = false;
let champions = [];
let latest;

const grid = document.getElementById("champGrid");
const searchInput = document.getElementById("search");


async function loadChampions() {
  const versions = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  ).then(res => res.json());

  latest = versions[0];   // assign, don't redeclare

  const data = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`
  ).then(res => res.json());

  champions = Object.values(data.data);
  render();
}


function render() {
  grid.innerHTML = "";

  const search = searchInput.value.toLowerCase();

  champions
    .filter(c =>
      c.name.toLowerCase().includes(search) &&
      (showDeleted ? deleted.has(c.name) : !deleted.has(c.name))
    )
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "card";
      if (deleted.has(c.name)) card.classList.add("deleted");

      card.innerHTML = `
        <img src="https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${c.id}.png">
        <div class="card-name">${c.name}</div>`;

      card.onclick = () => {
        if (deleted.has(c.name)) deleted.delete(c.name);
        else deleted.add(c.name);
        render();
      };

      grid.appendChild(card);
    });
}

searchInput.addEventListener("input", render);

loadChampions();