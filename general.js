    function generateTimestampNumber() {
  const now = new Date();

  const year = String(now.getFullYear()).slice(-2);          // e.g., "25"
  const month = String(now.getMonth() + 1).padStart(2, '0'); // "01" to "12"
  
  const uniqueNumber = `${year}${month}`;
  return Number(uniqueNumber); // Or keep it as a string if preferred
}

certificateNumber=generateTimestampNumber();
document.getElementById('certificateNumber').value = certificateNumber;

    function isMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }
        
    function toggleDock() {
      const dock = document.getElementById('sideDock');
      dock.classList.toggle('open');
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
