let processList = [];

/* ===== Threshold Sliders ===== */
let high = document.getElementById("high");
let medium = document.getElementById("medium");
let display = document.getElementById("thresholdDisplay");

function updateThresholdText() {
  display.innerText =
    `High Faults > ${high.value} → SJF | Medium ≥ ${medium.value} → Priority | Else → RR`;
}

high.oninput = medium.oninput = updateThresholdText;
updateThresholdText();

/* ===== Form Submission ===== */
document.getElementById("processForm").addEventListener("submit", function(e){
    e.preventDefault();
    let id = document.getElementById("procId").value.trim();
    let faults = parseInt(document.getElementById("pageFaults").value.trim());
    if(!id || isNaN(faults)) return alert("Please fill all fields!");

    let sched = faults > parseInt(high.value) ? "SJF" :
                faults >= parseInt(medium.value) ? "PRIORITY" : "RR";

    processList.push({id, faults, sched});
    updateTableAndCharts();
    document.getElementById("processForm").reset();
});

/* ===== Update Table, Frames, Gantt ===== */
function updateTableAndCharts() {
    let table = document.getElementById("result");
    table.innerHTML = `<tr>
        <th>Process</th><th>Page Faults</th><th>Selected Scheduler</th>
      </tr>`;

    let ganttList = [], framePages = [];
    processList.forEach((proc, i) => {
        let tr = table.insertRow();
        tr.insertCell(0).innerText = proc.id;
        tr.insertCell(1).innerText = proc.faults;
        let schedCell = tr.insertCell(2);
        schedCell.innerText = proc.sched;
        if(proc.sched==="SJF") schedCell.className="sjf-cell";
        else if(proc.sched==="PRIORITY") schedCell.className="priority-cell";
        else schedCell.className="rr-cell";

        ganttList.push(proc.id);
        framePages.push(i);
    });

    animateFrames(framePages);
    drawGantt(ganttList);
}

/* ===== Animate Frames ===== */
function animateFrames(pages){
    let container = document.getElementById("frames");
    container.innerHTML="";
    pages.forEach((p,i)=>{
        setTimeout(()=>{
            let div=document.createElement("div");
            div.className="frame active";
            div.innerText=p;
            container.appendChild(div);
        }, i*500);
    });
}

/* ===== Draw Gantt ===== */
function drawGantt(processes){
    let gantt = document.getElementById("gantt");
    gantt.innerHTML="";
    processes.forEach((p,i)=>{
        let block=document.createElement("div");
        block.className="gantt-block";
        block.innerText=p;
        gantt.appendChild(block);
        setTimeout(()=>{ block.classList.add("show"); }, 50*i);
    });
}

/* ===== Export PDF ===== */
function exportPDF(){
    html2pdf().set({
        margin:0.5, filename:'Memory_Aware_CPU_Scheduler.pdf',
        image:{type:'jpeg',quality:0.98},
        html2canvas:{scale:2,useCORS:true},
        jsPDF:{unit:'in',format:'a4',orientation:'portrait'}
    }).from(document.getElementById("dashboard")).save();
}

/* ===== CPU Utilization Graph ===== */
let ctx=document.getElementById('cpuChart').getContext('2d');
let cpuChart=new Chart(ctx,{
    type:'line',
    data:{ labels:[], datasets:[{label:'CPU Usage (%)', data:[], borderColor:'#4caf50', backgroundColor:[], tension:0.3, fill:true, pointRadius:4}] },
    options:{ 
        responsive:true, 
        maintainAspectRatio:false,
        scales:{ y:{min:0,max:100,title:{display:true,text:'Usage %'}}, x:{title:{display:true,text:'Time'}} } 
    }
});

// Pre-fill initial points
for(let i=0;i<5;i++){
    cpuChart.data.labels.push(i);
    cpuChart.data.datasets[0].data.push(Math.floor(Math.random()*50)+30);
    cpuChart.data.datasets[0].backgroundColor.push('rgba(76,175,80,0.2)');
}
cpuChart.update();

// Update graph live
let time=5;
setInterval(()=>{
    let usage=Math.floor(Math.random()*100);
    cpuChart.data.labels.push(time++);
    cpuChart.data.datasets[0].data.push(usage);
    cpuChart.data.datasets[0].backgroundColor.push(usage>80?'rgba(255,0,0,0.2)':'rgba(76,175,80,0.2)');

    if(cpuChart.data.labels.length>20){
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
        cpuChart.data.datasets[0].backgroundColor.shift();
    }
    cpuChart.update();
},1000);
