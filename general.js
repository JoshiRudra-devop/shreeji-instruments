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

// Function to generate short name from party name (first 3-4 characters)
function generatePartyShortName(partyName) {
  if (!partyName) return "UNKNOWN";
  // Get first word and take first 3 characters, convert to uppercase
  const words = partyName.trim().split(/\s+/);
  const shortName = words[0].substring(0, 4).toUpperCase();
  return shortName;
}

// Function to generate share filename: INSTRUMENT_NAME_PARTY_SHORT.pdf
function generateSharePDFFileName(details) {
  // Get instrument name from form details
  const instrumentName = (details.instrumentType || details.equipmentName || "CERTIFICATE").replace(/\s+/g, "_").toUpperCase();
  // Get party name short form
  const partyShort = generatePartyShortName(details.partyName);
  return `${instrumentName}_${partyShort}.pdf`;
}

// Function to generate share message
function generateShareMessage(details) {
  const instrumentName = details.instrumentType || details.equipmentName || "Calibration Certificate";
  const partyName = details.partyName || "Client";
  
  return `Here is your "${instrumentName}" calibration report of "${partyName}" PDF.`;
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

async function generateWord() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  
  showCustomLoader("Generating Word document...");
  
  try {
    const details = getFormDetails();
    
    // Create a new Document
    const docx = new window.docx.Document({
      sections: [{
        children: [
          // Header
          new window.docx.Paragraph({
            text: "SHREEJI INSTRUMENTS",
            bold: true,
            fontSize: 28,
            alignment: window.docx.AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new window.docx.Paragraph({
            text: "SALES • SERVICE • REPAIRING • CALIBRATIONS",
            fontSize: 12,
            alignment: window.docx.AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          // Title
          new window.docx.Paragraph({
            text: "CALIBRATION CERTIFICATE",
            bold: true,
            fontSize: 24,
            alignment: window.docx.AlignmentType.CENTER,
            spacing: { after: 150 }
          }),
          
          // Certificate Details Table
          new window.docx.Table({
            width: { size: 100, type: window.docx.WidthType.PERCENTAGE },
            rows: [
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Certificate No:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: `SI-${details.certificateNumber}` })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Date of Calibration:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.calibrationDate })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Next Calibration Date:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.nextCalibrationDate })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Name of Party:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.partyName })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Equipment Name:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.instrumentType || "AUTO LEVEL" })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Make:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.make })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Model No:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.modelNo })]
                  })
                ]
              }),
              new window.docx.TableRow({
                children: [
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: "Serial No:", bold: true })],
                    shading: { fill: "E8E8E8" }
                  }),
                  new window.docx.TableCell({
                    children: [new window.docx.Paragraph({ text: details.serialNo })]
                  })
                ]
              })
            ]
          }),
          
          new window.docx.Paragraph({ text: "", spacing: { after: 200 } }),
          
          // Certificate Text
          new window.docx.Paragraph({
            text: `This is to certify that the above mentioned equipment has been calibrated as per our standard procedures and found to be in good working condition.`,
            alignment: window.docx.AlignmentType.LEFT,
            spacing: { after: 150 }
          }),
          
          new window.docx.Paragraph({
            text: "FOR, SHREEJI INSTRUMENTS",
            alignment: window.docx.AlignmentType.RIGHT,
            bold: true,
            spacing: { after: 100 }
          }),
          
          new window.docx.Paragraph({
            text: "PROPRIETOR",
            alignment: window.docx.AlignmentType.RIGHT,
            spacing: { before: 200 }
          })
        ]
      }]
    });
    
    // Generate and save the document
    window.docx.Packer.toBlob(docx).then(blob => {
      saveDocWithLocation(blob, `${details.saveentry || "Unknown"}.docx`);
    });
  } catch (error) {
    console.error("Error generating Word document:", error);
    showCustomLoader("Failed to generate Word document 😞");
    setTimeout(hideCustomLoader, 1400);
  }
}

async function sharePDF() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const details = getFormDetails();
  addCertificateDetails(doc, details);
  addImg(doc, details);
  const pdfBlob = doc.output("blob");
  
  // Generate share filename: INSTRUMENT_NAME_PARTY_SHORT.pdf
  const shareFileName = generateSharePDFFileName(details);
  
  // Generate custom share message with party name
  const shareMessage = generateShareMessage(details);
  
  const pdfFile = new File([pdfBlob], shareFileName, {
    type: "application/pdf",
  });
  
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: "Calibration Certificate",
        text: shareMessage,
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

async function saveDocWithLocation(docBlob, defaultFileName) {
  try {
    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          { description: "Word Files", accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] } },
        ],
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(docBlob);
      await writableStream.close();
      pdfSaved = true;
      updateUnsavedReminder();
      showCustomTick("Word document saved successfully! ✨");
      setTimeout(hideCustomLoader, 1500);
    } else {
      // Fallback for browsers that don't support File System Access API
      const url = URL.createObjectURL(docBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      pdfSaved = true;
      updateUnsavedReminder();
      showCustomTick("Word document downloaded successfully! ✨");
      setTimeout(hideCustomLoader, 1500);
    }
  } catch (error) {
    console.error("Error saving Word document:", error);
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
