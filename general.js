    function generateTimestampNumber() {
    const now = new Date();

    const year = String(now.getFullYear()).slice(-2);          // e.g., "25"
    const month = String(now.getMonth() + 1).padStart(2, '0'); // "01" to "12"
    
    const uniqueNumber = `${year}${month}`;
    return Number(uniqueNumber); // Or keep it as a string if preferred
    }
        // Certificate number async check
    let checkTimeout;
    document.getElementById('certificateNumber').addEventListener('input', function() {
    clearTimeout(checkTimeout);
    const input = this;
    const errorDiv = document.getElementById('certificateNumberError');
    
    checkTimeout = setTimeout(async () => {
        if (input.value.trim()) {
        const exists = await checkCertificateExists(input.value.trim());
        if (exists) {
            input.classList.add('error-input');
            errorDiv.style.display = 'block';
        } else {
            input.classList.remove('error-input');
            errorDiv.style.display = 'none';
        }
        } else {
        input.classList.remove('error-input');
        errorDiv.style.display = 'none';
        }
    }, 500);
    });
    
    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }
        
    function toggleDock() {
      const dock = document.getElementById('sideDock');
      dock.classList.toggle('open');
    }
        

    // Updated showLoaderAndUpload function - only show loader if form is valid
function showLoaderAndUpload(uploadFn) {
    // Check form validity first
    if (!document.getElementById("calibrationForm").reportValidity()) {
        return; // Don't show loader if form is invalid
    }
    
    showCustomLoader('Uploading...');
    return uploadFn().then(() => {
    }).catch((e) => {
        showCustomLoader('Upload failed 😞');
        setTimeout(hideCustomLoader, 1400);
        throw e;
    });
}


    function showCustomLoader() {
    document.getElementById('customLoaderOverlay').style.display = 'flex';
    document.getElementById('customLoaderContent').style.pointerEvents = 'auto';
    document.getElementById('loaderSpinner').style.display = 'block';
    document.getElementById('loaderTick').style.display = 'none';
    document.getElementById('loaderText').textContent = '  Uploading PDF to Cloudinary...';
    }

    function showCustomTick() {
    document.getElementById('loaderSpinner').style.display = 'none';
    document.getElementById('loaderTick').style.display = 'flex';
    document.getElementById('loaderText').textContent = 'Certificate uploaded successfully! ✨';
    // Reset/replay SVG animation:
    const svg = document.querySelector('#loaderTick svg');
    svg.querySelector('.tick-circle').style.animation = 'none';
    svg.querySelector('.tick-check').style.animation = 'none';
    void svg.offsetWidth; // force reflow
    svg.querySelector('.tick-circle').style.animation = 'custom-tick-circle 0.4s ease-out forwards';
    svg.querySelector('.tick-check').style.animation = 'custom-tick-check 0.3s 0.45s cubic-bezier(.3,1.5,.5,1) forwards';
    }

    function hideCustomLoader() {
    document.getElementById('customLoaderOverlay').style.display = 'none';
    }

    async function preview() {
      if (!document.getElementById("calibrationForm").reportValidity()) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const details = getFormDetails();
      addCertificateDetails(doc, details);
      addImg(doc, details);
      const pdfBlob = doc.output('blob');
      const pdfURL = URL.createObjectURL(pdfBlob);
      const previewFrame = document.createElement('iframe');
      previewFrame.style.width = "100%";
      previewFrame.style.height = "600px";
      previewFrame.src = pdfURL;
      const container = document.querySelector('.container');
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
      const pdfBlob = doc.output('blob');
      await savePDFWithLocation(pdfBlob, `ElongationGauge_${details.certificateNumber || 'Unknown'}.pdf`);
    }
    
    async function generatePDFblankpg() {
      if (!document.getElementById("calibrationForm").reportValidity()) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const details = getFormDetails();
      addCertificateDetails(doc, details);
      const pdfBlob = doc.output('blob');
      await savePDFWithLocation(pdfBlob, `ElongationGauge_${details.certificateNumber || 'Unknown'}.pdf`);
    }
   
    async function sharePDF() {
      if (!document.getElementById("calibrationForm").reportValidity()) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      addCertificateDetails(doc, getFormDetails());
      addImg(doc, getFormDetails());
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], "certificate.pdf", { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: 'Calibration Certificate',
            text: 'Here is your calibration certificate PDF.'
          });
        } catch (err) {
          alert('Sharing cancelled or not supported.');
        }
      } else {
        alert('Web Share API not supported or file sharing not available in your browser.');
      }
    }
    
    async function printBlankCertificate() {
      if (!document.getElementById("calibrationForm").reportValidity()) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const details = getFormDetails();
      addCertificateDetails(doc, details);
      const pdfBlob = doc.output('blob');
      const pdfURL = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfURL, '_blank');
      if (printWindow) {
        printWindow.onload = function () { printWindow.print(); };
      }
    }
        let pdfSaved = false;

    // Show reminder until saved
    function updateUnsavedReminder() {
      const reminder = document.getElementById('unsavedReminder');
      if (!pdfSaved) {
        reminder.style.display = 'block';
      } else {
        reminder.style.display = 'none';
      }
    }
  
    function goBackOrPromptSave() {
      if (!pdfSaved) {
        updateUnsavedReminder();
        if (confirm("⚠️ You have unsaved changes! Please save your calibration certificate before leaving.\n\nDo you want to save now?")) {
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
      const calibrationDateInput = document.getElementById('calibrationDate');
      const nextDateInput = document.getElementById('nextCalibrationDate');
      const calibrationDate = new Date(calibrationDateInput.value);
      if (!isNaN(calibrationDate)) {
        const nextYearDate = new Date(calibrationDate);
        nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
        nextYearDate.setDate(nextYearDate.getDate() - 1);
        const formattedDate = nextYearDate.toISOString().split('T')[0];
        nextDateInput.value = formattedDate;
      }
    }

    async function savePDFWithLocation(pdfDocument, defaultFileName) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            { description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } },
          ],
        });
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(pdfDocument);
        await writableStream.close();
        pdfSaved = true;
        updateUnsavedReminder();
        alert('PDF saved successfully!');
      } catch (error) {
        console.error('Error saving PDF:', error);
      }
    }

    async function checkCertificateExists(certificateNumber) {
    try {
        const querySnapshot = await db.collection("certificates")
        .where("certificateNumber", "==", certificateNumber)
        .limit(1)
        .get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking certificate:", error);
        return false;
    }
    }

    function addImg(doc, details) {
      const img = new Image();
      img.src = 'footer.jpeg';
      doc.addImage(img, 'PNG', 0, 255, 210, 27);

      const img3 = new Image();
      img3.src = 'sign.jpeg';
      doc.addImage(img3, 'PNG', 160, 232, 40, 10);

      const img1 = new Image();
      img1.src = 'stamp.jpeg';
      doc.addImage(img1, 'PNG', 100, 217, 35, 35);

      const img2 = new Image();
      img2.src = 'header.jpeg';
      doc.addImage(img2, 'PNG', 3, 3, 210, 30);
    }
        
    // --- THE KEY FUNCTION: GENERATE, UPLOAD PDF TO CLOUDINARY, SAVE LINK TO FIREBASE ---
    async function Upload() {
    if (!document.getElementById("calibrationForm").reportValidity()) return;

    const details = getFormDetails();
    const exists = await checkCertificateExists(details.certificateNumber);
    if (exists) {
        showCustomLoader('Upload failed 😞');
        setTimeout(hideCustomLoader, 1400);
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    addImg(doc, details);
    addCertificateDetails(doc, details);
    const pdfBlob = doc.output('blob');
    const fileName = `CubeMould_${details.certificateNumber}.pdf`;

    // 1. Upload to Cloudinary
    let cloudinaryResp;
    try {
        cloudinaryResp = await uploadPDFtoCloudinary(pdfBlob, fileName);
                
    } catch (err) {
        showCustomLoader('Upload failed 😞');
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
        ...details
        });
        showCustomTick();
        setTimeout(hideCustomLoader, 1400);
        pdfSaved = true;
        updateUnsavedReminder();
    } catch (err) {
        showCustomLoader('Upload failed 😞');
        setTimeout(hideCustomLoader, 1400);
    }
    }

    certificateNumber=generateTimestampNumber();
    document.getElementById('certificateNumber').value = certificateNumber;


    // Mark as unsaved on any form input change
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll("#calibrationForm input").forEach(input => {
        input.addEventListener('input', () => {
          pdfSaved = false;
          updateUnsavedReminder();
        });
      });
      updateUnsavedReminder();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('calibrationDate').value = today;
      calculateNextDate();
    });

    window.onbeforeunload = function(e) {
      if (!pdfSaved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Please save your calibration certificate before leaving!';
        return e.returnValue;
      }
    };

            
    document.getElementById('loaderOkkBtn').onclick = hideCustomLoader;

    // Attach loader to Upload PDF button
    document.getElementById('uploadBtn').onclick = function() {
    showLoaderAndUpload(Upload);
    };


    // ---- FIREBASE INIT  ----
    const firebaseConfig = {
    apiKey: "AIzaSyB5LBbG8EZtE0iVecwpk7QYpmPhAY5Y5R4",
    authDomain: "shreeji-instruments.firebaseapp.com",
    projectId: "shreeji-instruments",
    storageBucket: "shreeji-instruments.firebasestorage.app",
    messagingSenderId: "714355376623",
    appId: "1:714355376623:web:ff4d29899b4012568c761a"
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
        body: formData
    });
    if (!response.ok) throw new Error("Cloudinary upload failed");
    return await response.json(); // .secure_url
    }

    
