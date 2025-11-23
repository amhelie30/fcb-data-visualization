const dateElement = document.getElementById("date");

let currentDate = new Date();
let dateOptions = { year: "numeric", month: "long", day: "numeric" };
dateElement.innerHTML = currentDate.toLocaleDateString("en-US", dateOptions);

// Helper to render a horizontal bar chart into a canvas
function renderBarChart(canvasId, labels, dataPoints, datasetLabel) {
  const ctx = document.getElementById(canvasId);
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: datasetLabel,
          data: dataPoints,
          borderWidth: 2,
          backgroundColor: labels.map((_, i) => {
            const palette = [
              "rgba(255, 99, 132, 0.2)",
              "rgba(255, 159, 64, 0.2)",
              "rgba(255, 205, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(201, 203, 207, 0.2)",
            ];
            return palette[i % palette.length];
          }),
          borderColor: labels.map((_, i) => {
            const palette = [
              "rgb(255, 99, 132)",
              "rgb(255, 159, 64)",
              "rgb(255, 205, 86)",
              "rgb(75, 192, 192)",
              "rgb(54, 162, 235)",
              "rgb(153, 102, 255)",
              "rgb(201, 203, 207)",
            ];
            return palette[i % palette.length];
          }),
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        y: { beginAtZero: true },
      },
      maintainAspectRatio: false,
    },
  });
}

// --- Twitter: fetch from RapidAPI and render into #myChartTwitter ---
const twitterUrl = "https://twitter-trends5.p.rapidapi.com/twitter/request.php";
const twitterOptions = {
  method: "POST",
  headers: {
    "x-rapidapi-key": "86f529c1a3msh891fd3d0bc97bdbp12fafbjsn9050c5fc4a8c",
    "x-rapidapi-host": "twitter-trends5.p.rapidapi.com",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ woeid: "23424934" }),
};

let twitterChart = null;

function formatNumber(n) {
  return n === null || n === undefined ? "—" : n.toLocaleString();
}

function populateTable(tableId, data, platform) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";
  data.forEach((item, idx) => {
    const tr = document.createElement("tr");
    const rankTd = document.createElement("td");
    rankTd.textContent = idx + 1;
    const topicTd = document.createElement("td");
    topicTd.innerHTML = `<span class="trend-name">${item.name}</span>`;
    const volTd = document.createElement("td");
    volTd.textContent = item.volume ? formatNumber(item.volume) : "—";
    const actionTd = document.createElement("td");
    const link = document.createElement("a");
    link.className = "btn btn-sm btn-outline-primary";
    if (platform === "twitter") {
      link.href = `https://twitter.com/search?q=${encodeURIComponent(item.name)}`;
    } else if (platform === "facebook") {
      link.href = `https://www.facebook.com/search/top?q=${encodeURIComponent(item.name)}`;
    } else {
      link.href = "#";
    }
    link.target = "_blank";
    link.textContent = "View";
    actionTd.appendChild(link);

    tr.appendChild(rankTd);
    tr.appendChild(topicTd);
    tr.appendChild(volTd);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}

// show spinner
const twitterLoading = document.getElementById("twitterLoading");
if (twitterLoading) twitterLoading.style.display = "flex";
const twitterErrorEl = document.getElementById("twitterError");

// helper: fetch with timeout using AbortController
function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const signal = controller.signal;
  return fetch(resource, { ...options, signal })
    .finally(() => clearTimeout(id));
}

fetchWithTimeout(twitterUrl, twitterOptions, 12000)
  .then((res) => {
    if (!res.ok) throw new Error(`Network response was not ok (status ${res.status})`);
    return res.json();
  })
  .then((data) => {
    const graphData = [];
    if (!data || !Array.isArray(data.trends)) throw new Error("Invalid response structure from Twitter API");
    for (let i = 0; i < Math.min(25, data.trends.length); i++) {
      graphData.push({ name: data.trends[i].name, volume: data.trends[i].volume || null });
    }

    // sort by volume descending when available
    graphData.sort((a, b) => (b.volume || 0) - (a.volume || 0));

    const topics = graphData.map((o) => o.name);
    const volumes = graphData.map((o) => (o.volume === null ? 0 : o.volume));

    // destroy previous chart if exists (safe recreate)
    if (twitterChart && typeof twitterChart.destroy === "function") twitterChart.destroy();
    twitterChart = renderBarChart("myChartTwitter", topics, volumes, "# of tweets");

    // populate trending table (show top 10)
    populateTable("twitterTable", graphData.slice(0, 10), "twitter");
  })
  .catch((err) => {
    console.error("Twitter fetch error:", err);
    if (twitterErrorEl) {
      twitterErrorEl.textContent = "Unable to load Twitter trends: " + (err && err.message ? err.message : "network error");
      twitterErrorEl.style.display = "block";
    }
    const sampleTopics = ["#Sample1", "#Sample2", "#Sample3", "#Sample4"];
    const sampleVolumes = [12000, 9000, 6000, 3000];
    if (twitterChart && typeof twitterChart.destroy === "function") twitterChart.destroy();
    twitterChart = renderBarChart("myChartTwitter", sampleTopics, sampleVolumes, "# of tweets (sample)");
    populateTable("twitterTable", sampleTopics.map((t, i) => ({ name: t, volume: sampleVolumes[i] })), "twitter");
  })
  .finally(() => {
    if (twitterLoading) twitterLoading.style.display = "none";
  });

// --- Facebook: no public trending API used here; provide a similar visualization using mock/sample data ---
const facebookData = [
  { name: "#FamilyGoals", volume: 52000 },
  { name: "#BreakingNews", volume: 48000 },
  { name: "#ViralVideo", volume: 42000 },
  { name: "#NewRecipe", volume: 36000 },
  { name: "#DIY", volume: 32000 },
  { name: "#PhotoOfTheDay", volume: 29000 },
  { name: "#SmallBusiness", volume: 26000 },
  { name: "#LocalEvent", volume: 23000 },
  { name: "#Giveaway", volume: 20000 },
  { name: "#TrendingStory", volume: 18000 },
];

const fbTopics = facebookData.map((o) => o.name);
const fbVolumes = facebookData.map((o) => o.volume);
let facebookChart = renderBarChart("myChartFacebook", fbTopics, fbVolumes, "# of reactions (sample)");
// populate facebook table (top 10)
populateTable("facebookTable", facebookData.slice(0, 10), "facebook");

// When switching tabs, ensure the visible chart is resized properly (Bootstrap tab event)
document.addEventListener("shown.bs.tab", function (event) {
  const targetId = event.target.getAttribute("data-bs-target");
  if (targetId === "#twitter" && twitterChart) twitterChart.resize();
  if (targetId === "#facebook" && facebookChart) facebookChart.resize();
});

// =========================
// dummy data to comment out
// =========================

// let myPost = {
//   name: "Lee Sung Kyung",
//   queryUrl: "search?q=%22Lee+Sung+Kyung%22",
//   volume: 31799,
//   followers: 3895734,
// };

// console.log(myPost);
// console.log(myPost.name);
// console.log(myPost.queryUrl);
// console.log(myPost.volume);
// console.log(myPost.followers);

// // Array
// let graphData = [
//   {
//     name: "#PorDeeReunion",
//     queryUrl: "search?q=%23PorDeeReunion",
//     volume: 67000,
//   },
//   {
//     name: "#BGYO3rdAnniversary",
//     queryUrl: "search?q=%23BGYO3rdAnniversary",
//     volume: 27400,
//   },
// ];

// console.log(graphData[0]);

// console.log(graphData);
// graphData.push(myPost);

// console.log(graphData);

// =========================
// end of dummy data
// =========================
