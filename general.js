function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function toggleDock() {
  const dock = document.getElementById("sideDock");
  dock.classList.toggle("open");
}

function showCustomLoader(message) {
  document.getElementById("customLoaderOverlay").style.display = "flex";
  document.getElementById("customLoaderContent").style.pointerEvents = "auto";
  document.getElementById("loaderSpinner").style.display = "block";
  document.getElementById("loaderTick").style.display = "none";
  document.getElementById("loaderText").textContent = message || "Processing...";
}

function showCustomTick(message) {
  document.getElementById("loaderSpinner").style.display = "none";
  document.getElementById("loaderTick").style.display = "flex";
  document.getElementById("loaderText").textContent = message || "Success! ✨";
  // Reset/replay SVG animation:
  const svg = document.querySelector("#loaderTick svg");
  svg.querySelector(".tick-circle").style.animation = "none";
  svg.querySelector(".tick-check").style.animation = "none";
  void svg.offsetWidth; // force reflow
  svg.querySelector(".tick-circle").style.animation =
    "custom-tick-circle 0.4s ease-out forwards";
  svg.querySelector(".tick-check").style.animation =
    "custom-tick-check 0.3s 0.45s cubic-bezier(.3,1.5,.5,1) forwards";
}

function hideCustomLoader() {
  document.getElementById("customLoaderOverlay").style.display = "none";
}

async function preview() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails();
  addCertificateDetails(doc, details);
  addImg(doc, details);
  const pdfBlob = doc.output("blob");
  const pdfURL = URL.createObjectURL(pdfBlob);
  const previewFrame = document.createElement("iframe");
  previewFrame.style.width = "100%";
  previewFrame.style.height = "600px";
  previewFrame.src = pdfURL;
  const container = document.querySelector(".container");
  const existingPreview = document.querySelector('iframe[style*="600px"]');
  if (existingPreview) container.removeChild(existingPreview);
  container.appendChild(previewFrame);
}

async function generatePDF() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails();
  addCertificateDetails(doc, details);
  addImg(doc, details);
  const pdfBlob = doc.output("blob");
  await savePDFWithLocation(
    pdfBlob,
    `${details.saveentry || "Unknown"}.pdf`
  );
}

async function generatePDFblankpg() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails();
  addCertificateDetails(doc, details);
  const pdfBlob = doc.output("blob");
  await savePDFWithLocation(
    pdfBlob,
    `${details.saveentry || "Unknown"}.pdf`
  );
}

async function sharePDF() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails(); // Fixed: Added missing details variable
  addCertificateDetails(doc, details);
  addImg(doc, details);
  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], `${details.saveentry || "Unknown"}.pdf`, { // Fixed: Corrected File constructor syntax
    type: "application/pdf",
  });
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: "Calibration Certificate",
        text: "Here is your calibration certificate PDF.",
      });
    } catch (err) {
      alert("Sharing cancelled or not supported.");
    }
  } else {
    alert(
      "Web Share API not supported or file sharing not available in your browser."
    );
  }
}

async function printBlankCertificate() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails();
  addCertificateDetails(doc, details);
  const pdfBlob = doc.output("blob");
  const pdfURL = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfURL, "_blank");
  if (printWindow) {
    printWindow.onload = function () {
      printWindow.print();
    };
  }
}

let pdfSaved = false;

// Show reminder until saved
function updateUnsavedReminder() {
  const reminder = document.getElementById("unsavedReminder");
  if (reminder) {
    if (!pdfSaved) {
      reminder.style.display = "block";
    } else {
      reminder.style.display = "none";
    }
  }
}

function goBackOrPromptSave() {
  if (!pdfSaved) {
    updateUnsavedReminder();
    if (
      confirm(
        "⚠️ You have unsaved changes! Please save your calibration certificate before leaving.\n\nDo you want to save now?"
      )
    ) {
      generatePDF();
      // Do NOT auto-navigate back until the user saves.
      // The user must click back again after saving.
    }
    // Otherwise, stay on page.
  } else {
    window.history.back();
  }
}

function calculateNextDate() {
  const calibrationDateInput = document.getElementById("calibrationDate");
  const nextDateInput = document.getElementById("nextCalibrationDate");
  const calibrationDate = new Date(calibrationDateInput.value);
  if (!isNaN(calibrationDate)) {
    const nextYearDate = new Date(calibrationDate);
    nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
    nextYearDate.setDate(nextYearDate.getDate() - 1);
    const formattedDate = nextYearDate.toISOString().split("T")[0];
    nextDateInput.value = formattedDate;
  }
}

async function savePDFWithLocation(pdfDocument, defaultFileName) {
  try {
    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          { description: "PDF Files", accept: { "application/pdf": [".pdf"] } },
        ],
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(pdfDocument);
      await writableStream.close();
      pdfSaved = true;
      updateUnsavedReminder();
      showCustomTick("PDF saved successfully! ✨");
      setTimeout(hideCustomLoader, 1500);
    } else {
      // Fallback for browsers that don't support File System Access API
      const url = URL.createObjectURL(pdfDocument);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      pdfSaved = true;
      updateUnsavedReminder();
      showCustomTick("PDF downloaded successfully! ✨");
      setTimeout(hideCustomLoader, 1500);
    }
  } catch (error) {
    console.error("Error saving PDF:", error);
    showCustomLoader("Save failed 😞");
    setTimeout(hideCustomLoader, 1400);
  }
}
function addImg(doc, details) {
  const img = new Image();
  img.src = "footer.jpeg";
  doc.addImage(img, "PNG", 0, 255, 210, 27);

  const img3 = new Image();
  img3.src = "sign.jpeg";
  doc.addImage(img3, "PNG", 160, 232, 40, 10);

  const img1 = new Image();
  img1.src = "stamp.jpeg";
  doc.addImage(img1, "PNG", 100, 217, 35, 35);

  const img2 = new Image();
  img2.src = "header.jpeg";
  doc.addImage(img2, "PNG", 3, 3, 210, 30);
}


// Mark as unsaved on any form input change
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("#calibrationForm input").forEach((input) => {
    input.addEventListener("input", () => {
      pdfSaved = false;
      updateUnsavedReminder();
    });
  });
  updateUnsavedReminder();
  
  // Set today's date
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("calibrationDate").value = today;
  calculateNextDate();
  

});

window.onbeforeunload = function (e) {
  if (!pdfSaved) {
    e.preventDefault();
    e.returnValue =
      "You have unsaved changes. Please save your calibration certificate before leaving!";
    return e.returnValue;
  }
};

document.getElementById("loaderOkkBtn").onclick = hideCustomLoader;

// Updated Upload function - now just saves locally
async function Upload() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;

  const details = getFormDetails();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  addImg(doc, details);
  addCertificateDetails(doc, details);
  const pdfBlob = doc.output("blob");
  const fileName = `CubeMould_${details.certificateNumber}.pdf`;

  showCustomLoader("Saving PDF...");
  await savePDFWithLocation(pdfBlob, fileName);
}

// Attach save function to Upload button
document.addEventListener("DOMContentLoaded", function () {
  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.onclick = function () {
      Upload();
    };
  }
});
