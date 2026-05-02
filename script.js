let rowsData = [];
let cameraTargetIndex = null;
let cameraStream = null;

// ── Add Row ──
function addRow() {
    let i = rowsData.length;

    let html = `
    <div class="row-card">
        <input type="file" onchange="loadImage(event, ${i})">
        <img id="img${i}" class="img-preview">

        <textarea id="desc${i}" placeholder="Description"></textarea>
        <textarea id="impact${i}" placeholder="Impact"></textarea>
        <input type="date" id="target${i}">
        <input id="person${i}" placeholder="Person">
        <input id="company${i}" placeholder="Company">

        <select id="status${i}">
            <option>Open</option>
            <option>In Progress</option>
            <option>Closed</option>
        </select>

        <textarea id="remarks${i}" placeholder="Remarks"></textarea>
    </div>
    `;

    document.getElementById("rows").insertAdjacentHTML("beforeend", html);
    rowsData.push({ });
}

// ── Load Image from file ──
function loadImage(e, i) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function() {
        rowsData[i].image = reader.result;
        document.getElementById("img"+i).src = reader.result;
    };
    reader.readAsDataURL(file);
}

// ── Set image & update preview ──
function setImage(i, dataUrl) {
    rowsData[i].image = dataUrl;

    let preview = document.getElementById("imgPreview" + i);
    let placeholder = document.getElementById("imgPlaceholder" + i);
    let placeholderText = document.getElementById("imgPlaceholderText" + i);
    let removeBtn = document.getElementById("removeBtn" + i);

    preview.src = dataUrl;
    preview.style.display = "block";
    placeholder.style.display = "none";
    placeholderText.style.display = "none";
    removeBtn.style.display = "block";
}

// ── Remove image ──
function removeImage(i) {
    rowsData[i].image = "";
    let preview = document.getElementById("imgPreview" + i);
    let placeholder = document.getElementById("imgPlaceholder" + i);
    let placeholderText = document.getElementById("imgPlaceholderText" + i);
    let removeBtn = document.getElementById("removeBtn" + i);

    preview.src = "";
    preview.style.display = "none";
    
    placeholder.style.display = "block";
    placeholderText.style.display = "block";
    removeBtn.style.display = "none";

    document.getElementById("fileInput" + i).value = "";
}

// ── Camera ──
async function openCamera(i) {
    cameraTargetIndex = i;

    let video = document.getElementById("cameraVideo");
    let preview = document.getElementById("capturedPreview");

    video.style.display = "block";
    preview.style.display = "none";
    document.getElementById("liveActions").style.display = "flex";
    document.getElementById("previewActions").style.display = "none";

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = cameraStream;
        document.getElementById("cameraModal").classList.add("open");
    } catch (err) {
        alert("Camera not available: " + err.message);
    }
}

function capturePhoto() {
    let video = document.getElementById("cameraVideo");
    let canvas = document.getElementById("cameraCanvas");
    let preview = document.getElementById("capturedPreview");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    let dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    preview.src = dataUrl;

    video.style.display = "none";
    preview.style.display = "block";
    document.getElementById("liveActions").style.display = "none";
    document.getElementById("previewActions").style.display = "flex";
}

function confirmPhoto() {
    let dataUrl = document.getElementById("capturedPreview").src;
    setImage(cameraTargetIndex, dataUrl);
    closeCamera();
}

function retakePhoto() {
    let video = document.getElementById("cameraVideo");
    let preview = document.getElementById("capturedPreview");

    video.style.display = "block";
    preview.style.display = "none";
    document.getElementById("liveActions").style.display = "flex";
    document.getElementById("previewActions").style.display = "none";
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    document.getElementById("cameraModal").classList.remove("open");
    cameraTargetIndex = null;
}

// ── Collect Data ──
function collect() {
    return rowsData.map((r, i) => ({
        no: i + 1,
        image: r.image,
        desc: document.getElementById("desc"+i).value,
        impact: document.getElementById("impact"+i).value,
        target: document.getElementById("target"+i).value,
        person: document.getElementById("person"+i).value,
        company: document.getElementById("company"+i).value,
        status: document.getElementById("status"+i).value,
        remarks: document.getElementById("remarks"+i).value
    }))
    .filter(row => row.desc || row.impact || row.target); // removes empty rows
}

// Generate PDF
async function generatePDF() {
    const { jsPDF } = window.jspdf;

    let doc = new jsPDF('l', 'mm', 'a4');

    let pageWidth = 297;
    let margin = 15;

    let cols = [10,50,50,40,30,40,25,42];
    let totalWidth = cols.reduce((a,b)=>a+b,0);

    let startX = (pageWidth - totalWidth) / 2;

    let yStart = 35;
    let y = yStart;

    let rowHeight = 40;
    let rowLimit = 4;
    let rowCount = 0;

    let data = collect();
    let totalPages = Math.ceil(data.length / rowLimit);
    let pageNo = 1;

    function drawHeader(pageNo) {
        doc.setFontSize(12);
        doc.text(title.value, pageWidth/2, 12, { align: "center" });

        doc.setFontSize(9);
        doc.text("Client: " + client.value, startX, 20);
        doc.text("Consultant: " + consultant.value, startX + 90, 20);
        doc.text("Contractor: " + contractor.value, startX + 180, 20);
        doc.text("Project: " + project.value, startX, 26);

        doc.text(`Page ${pageNo} / ${totalPages}`, pageWidth - margin, 12, { align: "right" });
    }

    function drawTableHeader(y) {
        let headers = ["No","Image","Description","Impact","Target","Responsible","Status","Remarks"];
        let x = startX;

        doc.setFontSize(8);

        headers.forEach((h, i) => {
            doc.rect(x, y, cols[i], 10);
            doc.text(h, x+2, y+6);
            x += cols[i];
        });
    }

    drawHeader(pageNo);
    drawTableHeader(y);
    y += 12;

    data.forEach((r) => {

        if (rowCount === rowLimit) {
            doc.addPage();
            pageNo++;
            y = yStart;

            drawHeader(pageNo);
            drawTableHeader(y);
            y += 12;

            rowCount = 0;
        }

        let x = startX;

        cols.forEach(w => {
            doc.rect(x, y, w, rowHeight);
            x += w;
        });
   
        doc.text(String(r.no), x+2, y+5);
        x += cols[0];

        if (r.image) {
            doc.addImage(r.image, 'JPEG', x+2, y+2, cols[1]-4, rowHeight-4);
        }
        x += cols[1];

        doc.text(doc.splitTextToSize(r.desc, cols[2]-5), x+2, y+5);
        x += cols[2];

        doc.text(doc.splitTextToSize(r.impact, cols[3]-5), x+2, y+5);
        x += cols[3];

        doc.text(r.target || "", x+2, y+5);
        x += cols[4];

        doc.text(doc.splitTextToSize(r.person + "/" + r.company, cols[5]-5), x+2, y+5);
        x += cols[5];

        doc.text(r.status, x+2, y+5);
        x += cols[6];

        doc.text(doc.splitTextToSize(r.remarks, cols[7]-5), x+2, y+5);

        y += rowHeight;
        rowCount++;
    });

    doc.save("Final_Site_Report.pdf");
}   


// SAVE TO BACKEND
async function saveToServer() {
  try {
        const data = {
            client: document.getElementById("client").value,
            consultant: document.getElementById("consultant").value,
            contractor: document.getElementById("contractor").value,
            project: document.getElementById("project").value,
            title: document.getElementById("title").value,
            rows: collect()
        };


        const res = await fetch("https://construction-site-iiy0.onrender.com/reports", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
             },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("✅ Report saved successfully!");
            document.querySelector("form")?.reset();
        } else {
            alert("❌Error saving report");
        }

      } catch (err) {
        console.error(err);
        alert("❌Error saving report");
      }  
}

window.onload = () => {
    addRow();

    document.querySelectorAll("input, textarea").forEach(el =>  el.value = "");
};

console.log("JS is working");

window.addEventListener("pageshow", () => {
    document.querySelector("input, textarea").forEach(el => el.value = "");
    rowsData = [];
    document.getElementById("rows").innerHTML = "";
    addRow();
});

function openReport() {
    window.location.href = "report.html";
}

