let processes = [];
let executionOrder = [];
let cpuTimer = null;
let cpuUtilTimer = null;

/* ================= INPUTS ================= */
const pidInput = document.getElementById("pid");
const burstInput = document.getElementById("burst");
const priorityInput = document.getElementById("priority");
const framesInput = document.getElementById("frames");
const refsInput = document.getElementById("refs");

/* ================= ADD PROCESS ================= */
document.getElementById("form").onsubmit = e => {
  e.preventDefault();

  processes.push({
    pid: pidInput.value.trim(),
    burst: +burstInput.value,
    priority: +priorityInput.value,
    frames: +framesInput.value,
    refs: refsInput.value.trim().split(" ").map(Number)
  });

  alert("Process added");
  e.target.reset();
};

/* ================= RUN ================= */
function run() {
  fetch("http://localhost:5000/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(processes)
  })
    .then(res => res.json())
    .then(d => renderOutput(d.output))
    .catch(() => alert("Backend not running"));
}

/* ================= RENDER ================= */
function renderOutput(text) {
  let lines = text.trim().split("\n");
  let tbody = document.querySelector("#table tbody");
  tbody.innerHTML = "";

  executionOrder = [];
  let ganttData = [];

  lines.slice(1, -1).forEach(line => {
    let p = line.split(" ");
    if (!p[0] || p[0] === "None") return;

    let row = tbody.insertRow();
    p.forEach(v => row.insertCell().innerText = v);

    executionOrder.push(p[0]);
    ganttData.push({ pid: p[0], burst: +p[1] });
  });

  document.getElementById("status").innerText =
    "Scheduler executed successfully";

  startCPUAnimation();
  drawGanttChart(ganttData);
  startCPUUtilisation(ganttData);

  /* ===== SAFE VM TRIGGER ===== */
  const vmProcess = processes.find(
    p => p.refs && p.refs.length > 0 && p.frames > 0
  );

  if (vmProcess) {
    animateVMFrames(vmProcess.refs, vmProcess.frames);
  } else {
    document.getElementById("vmFrames").innerHTML =
      "<p style='text-align:center'>No Virtual Memory data</p>";
  }
}

/* ================= CPU ANIMATION ================= */
function startCPUAnimation() {
  clearInterval(cpuTimer);
  let ctx = cpuCanvas.getContext("2d");
  let i = 0;

  cpuTimer = setInterval(() => {
    ctx.clearRect(0, 0, 220, 220);

    ctx.beginPath();
    ctx.arc(110, 110, 80, 0, 2 * Math.PI);
    ctx.fillStyle = "#3498db";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "22px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(executionOrder[i], 110, 110);

    currentProcess.innerText = "Executing: " + executionOrder[i];
    i = (i + 1) % executionOrder.length;
  }, 1000);
}

/* ================= GANTT ================= */
function drawGanttChart(data) {
  ganttContainer.innerHTML = "";
  let t = 0;

  data.forEach(p => {
    let block = document.createElement("div");
    block.className = "gantt-block";
    block.style.width = (p.burst * 50) + "px";
    block.innerText = p.pid;

    let time = document.createElement("div");
    time.className = "gantt-time";
    time.innerText = `${t} → ${t + p.burst}`;

    block.appendChild(time);
    ganttContainer.appendChild(block);
    t += p.burst;
  });
}

/* ================= CPU UTIL ================= */
function startCPUUtilisation(data) {
  clearInterval(cpuUtilTimer);

  let total = data.reduce((a, b) => a + b.burst, 0);
  let ctx = cpuUtilCanvas.getContext("2d");
  let t = 0;

  cpuUtilTimer = setInterval(() => {
    let util = Math.min(Math.floor((t / total) * 100), 100);
    ctx.clearRect(0, 0, 200, 200);

    ctx.beginPath();
    ctx.arc(100, 100, 70, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      100,
      100,
      70,
      -Math.PI / 2,
      -Math.PI / 2 + (util / 100) * 2 * Math.PI
    );
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 14;
    ctx.stroke();

    cpuUtilText.innerText = `CPU Utilisation: ${util}%`;
    t++;
    if (t > total) clearInterval(cpuUtilTimer);
  }, 1000);
}

/* ================= VM (FINAL & SAFE) ================= */
function animateVMFrames(refs, frameCount) {
  const container = document.getElementById("vmFrames");
  container.innerHTML = "";

  let frames = new Array(frameCount).fill(null);

  /* Always create frame boxes */
  for (let i = 0; i < frameCount; i++) {
    const box = document.createElement("div");
    box.className = "vm-frame";
    box.innerText = "-";
    container.appendChild(box);
  }

  refs.forEach((page, step) => {
    setTimeout(() => {
      let idx = frames.indexOf(page);

      if (idx === -1) {
        idx = frames.indexOf(null);
        if (idx === -1) idx = 0; // simplified LRU
        frames[idx] = page;
      }

      [...container.children].forEach((box, i) => {
        box.classList.remove("active");
        box.innerText = frames[i] !== null ? frames[i] : "-";
      });

      container.children[idx].classList.add("active");
    }, step * 900);
  });
}
