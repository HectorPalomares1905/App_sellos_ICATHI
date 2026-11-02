// --- Variables globales ---
let dragging = false;
let draggingText = false;
let offsetX = 0;
let offsetY = 0;
let offsetTextX = 0;
let offsetTextY = 0;
let selloFijado = false;
let textoFijado = false;
let selloBase64 = "";
let pdfFiles = [];
let currentPdfBlob = null;
let currentPdfIndex = 0;
let pdfTexts = {}; // Almacena el texto personalizado para cada PDF
let textPositions = {}; // Almacena las posiciones del texto para cada PDF

// --- Referencias a elementos del DOM ---
const fijarButton = document.getElementById("fijarButton");
const pdfListContainer = document.getElementById("pdfListContainer");
const pdfList = document.getElementById("pdfList");
const pdfCount = document.getElementById("pdfCount");
const folderButton = document.getElementById("folderButton");
const folderInput = document.getElementById("folderInput");
const pdfButton = document.getElementById("pdfButton");
const pdfInput = document.getElementById("pdfInput");
const pdfPreview = document.getElementById("pdfPreview");
const stampButton = document.getElementById("stampButton");
const stampInput = document.getElementById("stampInput");
const stampPreview = document.getElementById("stampPreview");
const draggableStamp = document.getElementById("draggableStamp");
const stampControls = document.getElementById("stampControls");
const customDateInput = document.getElementById("customDateInput");
const scaleInput = document.getElementById("scaleInput");
const rotInput = document.getElementById("rotInput");
const downloadButton = document.getElementById("downloadButton");
const pdfCard = document.getElementById("pdfCard");
const openStampButton = document.getElementById("openStampButton");
const draggableText = document.getElementById("draggableText");
const textPreview = document.getElementById("textPreview");

// --- Evento para "Abrir sellos" ---
openStampButton.addEventListener("click", () => stampInput.click());

// --- Eventos para carpeta ---
folderButton.addEventListener("click", () => folderInput.click());
folderInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  pdfFiles = files.filter(file => file.type === "application/pdf");
  
  if (pdfFiles.length === 0) {
    alert("No se encontraron archivos PDF en la carpeta seleccionada.");
    return;
  }

  // Reiniciar textos y posiciones
  pdfTexts = {};
  textPositions = {};
  currentPdfIndex = 0;

  // Mostrar el primer PDF como preview
  if (pdfFiles.length > 0) {
    const url = URL.createObjectURL(pdfFiles[0]);
    pdfPreview.src = url;
    pdfPreview.hidden = false;
    currentPdfBlob = pdfFiles[0];
  }

  // Actualizar lista de PDFs
  updatePdfList();
});

function updatePdfList() {
  pdfList.innerHTML = "";
  pdfCount.textContent = `Se han cargado ${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''}`;
  
  pdfFiles.forEach((file, index) => {
    const li = document.createElement("li");
    
    // Nombre del archivo
    const nameSpan = document.createElement("span");
    nameSpan.className = "pdf-name";
    nameSpan.textContent = `${index + 1}. ${file.name}`;
    
    // Input para texto personalizado
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "pdf-text-input";
    textInput.placeholder = "Texto personalizado";
    textInput.dataset.index = index;
    
    // Evento para actualizar el texto
    textInput.addEventListener("input", (e) => {
      pdfTexts[index] = e.target.value;
      // Si es el PDF actual, actualizar la vista previa
      if (index === currentPdfIndex) {
        updateTextPreview();
      }
    });
    
    // Evento para cambiar al PDF seleccionado al hacer clic
    nameSpan.addEventListener("click", () => {
      switchToPdf(index);
    });
    nameSpan.style.cursor = "pointer";
    
    li.appendChild(nameSpan);
    li.appendChild(textInput);
    pdfList.appendChild(li);
  });

  pdfListContainer.classList.remove("hidden");
}

// Función para cambiar entre PDFs
function switchToPdf(index) {
  if (index < 0 || index >= pdfFiles.length) return;
  
  // Guardar la posición actual del texto
  if (draggableText.style.left && draggableText.style.top) {
    textPositions[currentPdfIndex] = {
      left: draggableText.style.left,
      top: draggableText.style.top
    };
  }
  
  currentPdfIndex = index;
  const url = URL.createObjectURL(pdfFiles[index]);
  pdfPreview.src = url;
  currentPdfBlob = pdfFiles[index];
  
  // Actualizar vista previa del texto
  updateTextPreview();
  
  // Restaurar posición del texto si existe
  if (textPositions[index]) {
    draggableText.style.left = textPositions[index].left;
    draggableText.style.top = textPositions[index].top;
  } else {
    // Posición por defecto
    draggableText.style.left = "50px";
    draggableText.style.top = "50px";
  }
}

// Actualizar vista previa del texto
function updateTextPreview() {
  const text = pdfTexts[currentPdfIndex] || "";
  textPreview.textContent = text;
  draggableText.hidden = text === "";
}

// --- Eventos PDF individual ---
pdfButton.addEventListener("click", () => pdfInput.click());
pdfInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || file.type !== "application/pdf") {
    alert("Selecciona un PDF válido.");
    return;
  }
  pdfFiles = [file];
  pdfTexts = {};
  textPositions = {};
  currentPdfIndex = 0;
  currentPdfBlob = file;
  const url = URL.createObjectURL(file);
  pdfPreview.src = url;
  pdfPreview.hidden = false;
  updatePdfList();
});

// --- Obtener fecha seleccionada ---
function getSelectedDate() {
  const val = document.querySelector('input[name="date"]:checked').value;
  const now = new Date();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const formatDate = (d) => `${String(d.getDate()).padStart(2, "0")} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  if (val === "hoy") return formatDate(now);
  if (val === "ayer") {
    now.setDate(now.getDate() - 1);
    return formatDate(now);
  }
  const txt = customDateInput.value.trim();
  return txt !== "" ? txt : formatDate(now);
}

// --- Eventos para el sello ---
stampButton.addEventListener("click", () => stampInput.click());
stampInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const imageUrl = event.target.result;
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      ctx.font = `bold ${Math.floor(img.height * 0.06)}px Arial`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(getSelectedDate(), img.width / 2, img.height / 2);
      selloBase64 = canvas.toDataURL("image/png");
      stampPreview.src = selloBase64;
      stampPreview.hidden = false;
      draggableStamp.src = selloBase64;
      draggableStamp.hidden = false;
      stampControls.classList.remove("hidden");
      updateTransform();
    };
    img.src = imageUrl;
  };
  reader.readAsDataURL(file);
});

// --- Manejo de fecha personalizada ---
const radios = document.querySelectorAll('input[name="date"]');
radios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "personalizada" && radio.checked) {
      customDateInput.classList.remove("hidden");
      customDateInput.focus();
    } else {
      customDateInput.classList.add("hidden");
    }
    // Reaplicar sello si ya hay uno cargado
    if (stampInput.files.length > 0) {
      const evt = new Event("change");
      stampInput.dispatchEvent(evt);
    }
  });
});
customDateInput.addEventListener("input", () => {
  if (stampInput.files.length > 0) {
    const evt = new Event("change");
    stampInput.dispatchEvent(evt);
  }
});

// --- Arrastrar sello ---
draggableStamp.addEventListener("mousedown", (e) => {
  if (selloFijado) return;
  dragging = true;
  const rect = draggableStamp.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
});

// --- Arrastrar texto ---
draggableText.addEventListener("mousedown", (e) => {
  if (textoFijado) return;
  draggingText = true;
  const rect = draggableText.getBoundingClientRect();
  offsetTextX = e.clientX - rect.left;
  offsetTextY = e.clientY - rect.top;
});

document.addEventListener("mousemove", (e) => {
  if (dragging && !selloFijado) {
    const parentRect = pdfCard.getBoundingClientRect();
    let newX = e.clientX - parentRect.left - offsetX;
    let newY = e.clientY - parentRect.top - offsetY;
    draggableStamp.style.left = `${newX}px`;
    draggableStamp.style.top = `${newY}px`;
  }
  
  if (draggingText && !textoFijado) {
    const parentRect = pdfCard.getBoundingClientRect();
    let newX = e.clientX - parentRect.left - offsetTextX;
    let newY = e.clientY - parentRect.top - offsetTextY;
    draggableText.style.left = `${newX}px`;
    draggableText.style.top = `${newY}px`;
  }
});

document.addEventListener("mouseup", () => {
  dragging = false;
  draggingText = false;
});

// --- Escalar y rotar sello ---
function updateTransform() {
  const scale = scaleInput.value;
  const rotate = rotInput.value;
  draggableStamp.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
}

scaleInput.addEventListener("input", updateTransform);
rotInput.addEventListener("input", updateTransform);

// --- Fijar/desfijar sello ---
let fixedX = 0, fixedY = 0;

fijarButton.addEventListener("click", () => {
  selloFijado = !selloFijado;
  textoFijado = !textoFijado;

  if (selloFijado) {
    // Fijar posición del sello
    const rect = draggableStamp.getBoundingClientRect();
    const parentRect = pdfCard.getBoundingClientRect();
    fixedX = rect.left - parentRect.left;
    fixedY = rect.top - parentRect.top;
    draggableStamp.style.left = `${fixedX}px`;
    draggableStamp.style.top = `${fixedY}px`;
    
    // Guardar posición del texto para todos los PDFs
    const textRect = draggableText.getBoundingClientRect();
    const textX = textRect.left - parentRect.left;
    const textY = textRect.top - parentRect.top;
    
    // Aplicar la misma posición a todos los PDFs
    pdfFiles.forEach((_, index) => {
      textPositions[index] = {
        left: `${textX}px`,
        top: `${textY}px`
      };
    });

    // Desactivar punteros
    draggableStamp.style.pointerEvents = "none";
    draggableText.style.pointerEvents = "none";
    fijarButton.textContent = "Desbloquear sello y texto";
  } else {
    // Reactivar movimiento
    draggableStamp.style.pointerEvents = "auto";
    draggableText.style.pointerEvents = "auto";
    fijarButton.textContent = "Fijar sello y texto";
  }
});

// --- Función para aplicar sello y texto a un PDF ---
async function applyStampToPdf(pdfFile, index) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  
  // Primera página
  const page = pdfDoc.getPages()[0];
  const { width: pageW, height: pageH } = page.getSize();
  
  // Embebe el PNG del sello si existe
  if (selloBase64) {
    const pngBytes = await fetch(selloBase64).then(r => r.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngBytes);

    // Dimensiones en pantalla
    const cardRect = pdfCard.getBoundingClientRect();
    const stampRect = draggableStamp.getBoundingClientRect();

    // Tamaño en puntos PDF manteniendo proporción
    const wPt = (stampRect.width / cardRect.width) * pageW;
    const aspect = pngImage.height / pngImage.width;
    const hPt = wPt * aspect;

    // Posición en puntos PDF
    const xPt = ((stampRect.left - cardRect.left) / cardRect.width) * pageW;
    const yOffsetCSS = 25;
    const yOffsetPDF = yOffsetCSS / cardRect.height * pageH;
    const yPt = pageH - ((stampRect.top - cardRect.top) / cardRect.height) * pageH - hPt - yOffsetPDF;

    // Dibuja el sello con rotación
    const rotation = parseFloat(rotInput.value);
    page.drawImage(pngImage, {
      x: xPt,
      y: yPt,
      width: wPt,
      height: hPt,
      rotate: PDFLib.degrees(rotation),
    });
  }
  
  // Agregar texto personalizado si existe
  const customText = pdfTexts[index];
  if (customText) {
    const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    // Obtener posición del texto
    const textPosition = textPositions[index] || { left: "50px", top: "50px" };
    const cardRect = pdfCard.getBoundingClientRect();
    
    // Convertir posición CSS a puntos PDF
    const textX = (parseFloat(textPosition.left) / cardRect.width) * pageW;
    const textY = pageH - (parseFloat(textPosition.top) / cardRect.height) * pageH;
    
    // Dibujar texto
    page.drawText(customText, {
      x: textX,
      y: textY,
      size: 16,
      font: helveticaFont,
      color: PDFLib.rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

// --- Descargar PDFs ---
downloadButton.addEventListener("click", async () => {
  // Validación
  if (pdfFiles.length === 0) {
    alert("Primero selecciona PDF(s).");
    return;
  }

  downloadButton.textContent = "Procesando...";
  downloadButton.disabled = true;

  try {
    if (pdfFiles.length === 1) {
      // Un solo PDF
      const modifiedBytes = await applyStampToPdf(pdfFiles[0], 0);
      const blob = new Blob([modifiedBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const originalName = pdfFiles[0].name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      link.download = `${nameWithoutExt}_sellado.pdf`;
      link.click();
    } else {
      // Múltiples PDFs - crear ZIP
      const zip = new JSZip();
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const modifiedBytes = await applyStampToPdf(file, i);
        const originalName = file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        zip.file(`${nameWithoutExt}_sellado.pdf`, modifiedBytes);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "pdfs_sellados.zip";
      link.click();
    }
  } catch (error) {
    console.error("Error al procesar PDFs:", error);
    alert("Ocurrió un error al procesar los PDFs. Por favor, intenta de nuevo.");
  } finally {
    downloadButton.textContent = "Descargar PDF";
    downloadButton.disabled = false;
  }
});