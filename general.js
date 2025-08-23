function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function toggleDock() {
  const dock = document.getElementById("sideDock");
  dock.classList.toggle("open");
}

// Updated showLoaderAndUpload function - only show loader if form is valid
function showLoaderAndUpload(uploadFn) {
  // Check form validity first
  if (!document.getElementById("calibrationForm").reportValidity()) {
    return; // Don't show loader if form is invalid
  }

  showCustomLoader("Uploading...");
  return uploadFn()
    .then(() => { })
    .catch((e) => {
      showCustomLoader("Upload failed 😞");
      setTimeout(hideCustomLoader, 1400);
      throw e;
    });
}

function showCustomLoader() {
  document.getElementById("customLoaderOverlay").style.display = "flex";
  document.getElementById("customLoaderContent").style.pointerEvents = "auto";
  document.getElementById("loaderSpinner").style.display = "block";
  document.getElementById("loaderTick").style.display = "none";
  document.getElementById("loaderText").textContent =
    "  Uploading PDF to Cloudinary...";
}

function showCustomTick() {
  document.getElementById("loaderSpinner").style.display = "none";
  document.getElementById("loaderTick").style.display = "flex";
  document.getElementById("loaderText").textContent =
    "Certificate uploaded successfully! ✨";
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
  addCertificateDetails(doc, getFormDetails());
  addImg(doc, getFormDetails());
  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], "`${details.saveentry || "Unknown"}.pdf`"), {
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
  if (!pdfSaved) {
    reminder.style.display = "block";
  } else {
    reminder.style.display = "none";
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
    alert("PDF saved successfully!");
  } catch (error) {
    console.error("Error saving PDF:", error);
  }
}

// async function checkCertificateExists(certificateNumber) {
// try {
//     const querySnapshot = await db.collection("certificates")
//     .where("certificateNumber", "==", certificateNumber)
//     .limit(1)
//     .get();
//     return !querySnapshot.empty;
// } catch (error) {
//     console.error("Error checking certificate:", error);
//     return false;
// }
// }

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



// certificateNumber=generateTimestampNumber();
// document.getElementById('certificateNumber').value = certificateNumber;

// Mark as unsaved on any form input change
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("#calibrationForm input").forEach((input) => {
    input.addEventListener("input", () => {
      pdfSaved = false;
      updateUnsavedReminder();
    });
  });
  updateUnsavedReminder();
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

// Attach loader to Upload PDF button
document.getElementById("uploadBtn").onclick = function () {
  showLoaderAndUpload(Upload);
};

// ---- FIREBASE INIT  ----
const firebaseConfig = {
  apiKey: "AIzaSyB5LBbG8EZtE0iVecwpk7QYpmPhAY5Y5R4",
  authDomain: "shreeji-instruments.firebaseapp.com",
  projectId: "shreeji-instruments",
  storageBucket: "shreeji-instruments.firebasestorage.app",
  messagingSenderId: "714355376623",
  appId: "1:714355376623:web:ff4d29899b4012568c761a",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ---- CLOUDINARY UPLOAD  ----
async function uploadPDFtoCloudinary(pdfBlob, fileName) {
  const url = `https://api.cloudinary.com/v1_1/deread6ss/auto/upload`;
  const formData = new FormData();
  formData.append("file", pdfBlob, fileName);
  formData.append("upload_preset", "shreeji_instruments");
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Cloudinary upload failed");
  return await response.json(); // .secure_url
}

// Auto Certificate Number Manager
class CertificateNumberManager {
  constructor() {
    this.firestore = null;
    this.initializeFirestore();
  }

  initializeFirestore() {
    try {
      if (typeof firebase !== "undefined" && firebase.firestore) {
        this.firestore = firebase.firestore();
      }
    } catch (error) {
      console.error("Error initializing Firestore:", error);
    }
  }

  extractNumber(certNumber) {
    if (!certNumber) return 0;
    const match = certNumber.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  }

  formatCertificateNumber(number, prefix = "", digits = 3) {
    const paddedNumber = number.toString().padStart(digits, "0");
    return prefix ? `${prefix}${paddedNumber}` : paddedNumber;
  }

  async fetchLastCertificateFromFirestore() {
    try {
      if (!this.firestore) {
        throw new Error("Firestore not initialized");
      }

      const querySnapshot = await this.firestore
        .collection("certificates")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const data = lastDoc.data();
        return data.certificateNumber || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching from Firestore:", error);
      return null;
    }
  }

  fetchLastCertificateFromLocalStorage() {
    try {
      const certificates = JSON.parse(
        localStorage.getItem("certificates") || "[]"
      );
      if (certificates.length > 0) {
        const sorted = certificates.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        return sorted[0].certificateNumber || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching from localStorage:", error);
      return null;
    }
  }

  async generateNextCertificateNumber() {
    let lastCertNumber = null;

    try {
      lastCertNumber = await this.fetchLastCertificateFromFirestore();

      if (!lastCertNumber) {
        lastCertNumber = this.fetchLastCertificateFromLocalStorage();
      }
    } catch (error) {
      console.error("Error generating certificate number:", error);
    }

    let nextNumber = 1;
    let prefix = "";

    if (lastCertNumber) {
      const prefixMatch = lastCertNumber.match(/^(.+?)(\d+)$/);
      if (prefixMatch) {
        prefix = prefixMatch[1];
        nextNumber = parseInt(prefixMatch[2]) + 1;
      } else {
        nextNumber = 1;
      }
    }

    const newCertNumber = this.formatCertificateNumber(nextNumber, prefix);
    return newCertNumber;
  }

  updateStatus(message, type = "info") {
    const statusDiv = document.getElementById("certificateStatus");
    if (!statusDiv) return;

    statusDiv.className = `certificate-status status-${type}`;

    if (type === "loading") {
      statusDiv.innerHTML = `<span class="loading-spinner"></span> ${message}`;
    } else if (type === "success") {
      statusDiv.innerHTML = `✓ ${message}`;
    } else if (type === "error") {
      statusDiv.innerHTML = `✗ ${message}`;
    } else {
      statusDiv.innerHTML = message;
    }
  }

  async setAutoCertificateNumber() {
    const certNumberInput = document.getElementById("certificateNumber");
    const errorDiv = document.getElementById("certificateNumberError");
    const autoBtn = document.getElementById("autoGenerateBtn");

    if (!certNumberInput) {
      console.error("Certificate number input field not found");
      return;
    }

    try {
      // Show loading state
      this.updateStatus("Generating certificate number...", "loading");
      certNumberInput.disabled = true;
      autoBtn.disabled = true;
      autoBtn.textContent = "Generating...";

      // Generate next certificate number
      const nextCertNumber = await this.generateNextCertificateNumber();

      // Set the value
      certNumberInput.value = nextCertNumber;
      certNumberInput.disabled = false;
      autoBtn.disabled = false;
      autoBtn.textContent = "🔄 Auto Generate";

      // Hide any error messages
      if (errorDiv) {
        errorDiv.style.display = "none";
      }

      this.updateStatus(`Generated: ${nextCertNumber}`, "success");

      // Clear status after 3 seconds
      setTimeout(() => {
        this.updateStatus("");
      }, 3000);

      console.log(`Auto-generated certificate number: ${nextCertNumber}`);
    } catch (error) {
      console.error("Error setting auto certificate number:", error);

      // Reset input on error
      certNumberInput.disabled = false;
      autoBtn.disabled = false;
      autoBtn.textContent = "🔄 Auto Generate";

      this.updateStatus("Error generating certificate number", "error");

      // Show error message
      if (errorDiv) {
        errorDiv.textContent =
          "Error generating certificate number. Please enter manually.";
        errorDiv.style.display = "block";
      }
    }
  }

  async checkCertificateExists(certNumber) {
    try {
      if (this.firestore) {
        const querySnapshot = await this.firestore
          .collection("certificates")
          .where("certificateNumber", "==", certNumber)
          .get();

        return !querySnapshot.empty;
      }
      return false;
    } catch (error) {
      console.error("Error checking certificate existence:", error);
      return false;
    }
  }
}

// Initialize the certificate number manager
const certManager = new CertificateNumberManager();

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Add event listener to auto-generate button
  const autoGenerateBtn = document.getElementById("autoGenerateBtn");
  if (autoGenerateBtn) {
    autoGenerateBtn.addEventListener("click", function () {
      certManager.setAutoCertificateNumber();
    });
  }

  // Auto-generate on page load after Firebase is initialized
  setTimeout(() => {
    certManager.setAutoCertificateNumber();
  }, 1500);

  // Add real-time validation
  const certNumberInput = document.getElementById("certificateNumber");
  if (certNumberInput) {
    certNumberInput.addEventListener("input", function () {
      document.getElementById("certificateNumberError").style.display = "none";
      certManager.updateStatus("");
    });

    certNumberInput.addEventListener("blur", async function () {
      const certNumber = this.value.trim();
      if (certNumber) {
        const exists = await certManager.checkCertificateExists(certNumber);
        const errorDiv = document.getElementById("certificateNumberError");
        if (exists) {
          errorDiv.style.display = "block";
          errorDiv.textContent = "This certificate number already exists!";
          certManager.updateStatus(
            "Certificate number already exists",
            "error"
          );
        } else {
          errorDiv.style.display = "none";
          certManager.updateStatus("Certificate number available", "success");
          setTimeout(() => {
            certManager.updateStatus("");
          }, 2000);
        }
      }
    });
  }
});


// --- THE KEY FUNCTION: GENERATE, UPLOAD PDF TO CLOUDINARY, SAVE LINK TO FIREBASE ---
async function Upload() {
  if (!document.getElementById("calibrationForm").reportValidity()) return;

  const details = getFormDetails();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  addImg(doc, details);
  addCertificateDetails(doc, details);
  const pdfBlob = doc.output("blob");
  const fileName = `CubeMould_${details.certificateNumber}.pdf`;

  // 1. Upload to Cloudinary
  let cloudinaryResp;
  try {
    cloudinaryResp = await uploadPDFtoCloudinary(pdfBlob, fileName);
  } catch (err) {
    showCustomLoader("Upload failed 😞");
    setTimeout(hideCustomLoader, 1400);
    return;
  }
  const pdfUrl = cloudinaryResp.secure_url;

  // 2. Save PDF URL & details to Firestore
  try {
    await db.collection("certificates").add({
      certificateNumber: details.certificateNumber,
      downloadUrl: pdfUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...details,
    });
    showCustomTick();
    setTimeout(hideCustomLoader, 1400);
    pdfSaved = true;
    updateUnsavedReminder();
  } catch (err) {
    showCustomLoader("Upload failed 😞");
    setTimeout(hideCustomLoader, 1400);
  }

  generatePDFblankpg();
}
