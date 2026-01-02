function loadData() {
  fetch("output.txt")
    .then(response => response.text())
    .then(data => {

      let table = document.getElementById("result");
      table.innerHTML = `
        <tr>
          <th>Process</th>
          <th>Page Faults</th>
          <th>Selected Scheduler</th>
        </tr>
      `;

      let rows = data.trim().split("\n").slice(1);
      let ganttList = [];

      rows.forEach(row => {
        let parts = row.split(" ");
        let tr = table.insertRow();

        tr.insertCell(0).innerText = parts[0];
        tr.insertCell(1).innerText = parts[1];

        let schedCell = tr.insertCell(2);
        schedCell.innerText = parts[2];

        if (parts[2] === "SJF") {
          schedCell.className = "sjf-cell";
          schedCell.title = "High page faults → minimize memory thrashing";
        } else if (parts[2] === "PRIORITY") {
          schedCell.className = "priority-cell";
          schedCell.title = "Medium page faults → balanced scheduling";
        } else {
          schedCell.className = "rr-cell";
          schedCell.title = "Low page faults → fair CPU sharing";
        }

        ganttList.push(parts[0]);
      });

      // Demo animations (can be linked to backend later)
      animateFrames([0,1,2,0,3,0,4]);
      drawGantt(ganttList);
    });
}

/* Page Frame Animation */
function animateFrames(pages) {
  let container = document.getElementById("frames");
  container.innerHTML = "";

  pages.forEach((p, i) => {
    setTimeout(() => {
      let div = document.createElement("div");
      div.className = "frame active";
      div.innerText = p;
      container.appendChild(div);
    }, i * 500);
  });
}

/* Gantt Chart */
function drawGantt(processes) {
  let gantt = document.getElementById("gantt");
  gantt.innerHTML = "";

  processes.forEach(p => {
    let block = document.createElement("div");
    block.className = "gantt-block";
    block.innerText = p;
    gantt.appendChild(block);
  });
}

/* Threshold Sliders */
let high = document.getElementById("high");
let medium = document.getElementById("medium");
let display = document.getElementById("thresholdDisplay");

function updateThresholdText() {
  display.innerText =
    `High Faults > ${high.value} → SJF | Medium ≥ ${medium.value} → Priority | Else → RR`;
}

high.oninput = medium.oninput = updateThresholdText;
updateThresholdText();

/* Export PDF */
function exportPDF() {
  const element = document.getElementById("dashboard");

  if (!element) {
    alert("Dashboard element not found!");
    return;
  }

  const opt = {
    margin:       0.5,
    filename:     'Memory_Aware_CPU_Scheduler.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

