// Scanner configuration
let html5QrcodeScanner
let isScannerOpen = false
let isDragging = false
let offsetX, offsetY
const scannerContainer = document.getElementById("scanner-container")
const scannerHeader = document.getElementById("scanner-header")

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Open scanner button
  document.getElementById("open-scanner").addEventListener("click", openScanner)

  // Close scanner button
  document
    .getElementById("close-scanner")
    .addEventListener("click", closeScanner)

  // Make scanner draggable
  scannerHeader.addEventListener("mousedown", startDrag)
  document.addEventListener("mousemove", dragScanner)
  document.addEventListener("mouseup", endDrag)
})

function openScanner() {
  if (isScannerOpen) return

  scannerContainer.style.display = "block"
  isScannerOpen = true

  // Initialize the scanner
  html5QrcodeScanner = new Html5Qrcode("qr-reader")

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    // Supported formats
    formatsToSupport: [
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.QR_CODE,
    ],
  }

  // For Raspberry Pi Camera, you'll need to use the camera ID
  // First list cameras to find the correct one
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        // Find the Raspberry Pi camera (might be labeled differently)
        const piCamera =
          devices.find(
            (device) =>
              device.label.includes("Pi Camera") ||
              device.label.includes("mmal service")
          ) || devices[0] // Fallback to first camera

        console.log("Using camera:", piCamera.label)

        html5QrcodeScanner
          .start(piCamera.id, config, onScanSuccess, onScanError)
          .catch((err) => {
            console.error("Failed to start scanner:", err)
            alert("Failed to start scanner: " + err)
          })
      } else {
        alert("No cameras found. Please connect a camera.")
      }
    })
    .catch((err) => {
      console.error("Camera access error:", err)
      alert("Camera access error: " + err)
    })
}

function closeScanner() {
  if (!isScannerOpen) return

  html5QrcodeScanner
    .stop()
    .then(() => {
      scannerContainer.style.display = "none"
      isScannerOpen = false
    })
    .catch((err) => {
      console.error("Failed to stop scanner:", err)
    })
}

function onScanSuccess(decodedText, decodedResult) {
  console.log(`Scan result: ${decodedText}`, decodedResult)
  document.getElementById("scan-result").innerHTML = `
        <strong>Scanned:</strong> ${decodedText}<br>
        <strong>Format:</strong> ${decodedResult.result.format.formatName}
    `

  // Optional: Close scanner after successful scan
  // closeScanner();

  // Here you can add your custom logic for handling the scanned barcode
  // For example, make an API call to your Node.js backend
  // handleScannedBarcode(decodedText);
}

function onScanError(errorMessage) {
  // Parse error, ignore if it's just "NotFoundException"
  if (
    errorMessage !==
    "NotFoundException: No MultiFormat Readers were able to detect the code."
  ) {
    console.warn(`Scan error: ${errorMessage}`)
  }
}

// Draggable scanner functions
function startDrag(e) {
  isDragging = true
  offsetX = e.clientX - scannerContainer.getBoundingClientRect().left
  offsetY = e.clientY - scannerContainer.getBoundingClientRect().top
  scannerContainer.style.cursor = "grabbing"
}

function dragScanner(e) {
  if (!isDragging) return

  scannerContainer.style.left = `${e.clientX - offsetX}px`
  scannerContainer.style.top = `${e.clientY - offsetY}px`
}

function endDrag() {
  isDragging = false
  scannerContainer.style.cursor = "grab"
}

// Example function to handle the scanned barcode
async function handleScannedBarcode(barcode) {
  try {
    const response = await fetch("/api/process-barcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ barcode }),
    })

    const data = await response.json()
    console.log("Backend response:", data)
    // Handle the response from your Node.js backend
  } catch (error) {
    console.error("Error processing barcode:", error)
  }
}
