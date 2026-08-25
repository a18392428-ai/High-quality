const mediaInput = document.getElementById('mediaInput');
const editorSection = document.getElementById('editorSection');
const canvas = document.getElementById('canvasPreview');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const videoElement = document.getElementById('videoElement');

const qualitySelect = document.getElementById('qualitySelect');
const sharpnessInput = document.getElementById('sharpness');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const saturationInput = document.getElementById('saturation');
const downloadBtn = document.getElementById('downloadBtn');

let currentFileType = '';
let loadedImage = new Image();
let animFrameId = null;

mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (animFrameId) cancelAnimationFrame(animFrameId);
    videoElement.pause();

    const fileURL = URL.createObjectURL(file);
    editorSection.style.display = 'grid';

    if (file.type.startsWith('image/')) {
        currentFileType = 'image';
        loadedImage = new Image();
        loadedImage.onload = () => {
            // إعدادات افتراضية مخصصة للتحسين الذكي لـ 4K
            sharpnessInput.value = 35;
            contrastInput.value = 108;
            brightnessInput.value = 102;
            saturationInput.value = 104;
            
            updateCanvasDimensions();
            renderImageWithAIEnhance();
        };
        loadedImage.src = fileURL;
    } else if (file.type.startsWith('video/')) {
        currentFileType = 'video';
        videoElement.src = fileURL;
        videoElement.loop = true;
        videoElement.muted = true;

        videoElement.onloadedmetadata = () => {
            updateCanvasDimensions();
            videoElement.play();
            renderVideo();
        };
    }
});

function updateCanvasDimensions() {
    const targetHeight = parseInt(qualitySelect.value);
    if (currentFileType === 'image') {
        const aspectRatio = loadedImage.width / loadedImage.height;
        canvas.height = targetHeight;
        canvas.width = Math.round(targetHeight * aspectRatio);
    } else if (currentFileType === 'video') {
        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        canvas.height = targetHeight;
        canvas.width = Math.round(targetHeight * aspectRatio);
    }
}

function updateLabels() {
    document.getElementById('sharpVal').innerText = sharpnessInput.value + '%';
    document.getElementById('contrastVal').innerText = contrastInput.value + '%';
    document.getElementById('brightVal').innerText = brightnessInput.value + '%';
    document.getElementById('saturateVal').innerText = saturationInput.value + '%';
}

// محاكاة تحسين الذكاء الاصطناعي لاستخراج الحواف والتفاصيل الدقيقة (Unsharp Masking Algorithm)
function applyAIEnhancements(amount) {
    if (amount <= 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const copyData = new Uint8ClampedArray(data);

    // مصفوفة تحديد وتوضيح الحواف والتفاصيل (Convolution Matrix)
    const factor = (amount / 100) * 1.5;
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) { // ألوان R, G, B
                const center = copyData[idx + c];
                const top    = copyData[((y - 1) * width + x) * 4 + c];
                const bottom = copyData[((y + 1) * width + x) * 4 + c];
                const left   = copyData[(y * width + (x - 1)) * 4 + c];
                const right  = copyData[(y * width + (x + 1)) * 4 + c];

                // حساب التباين العالي لإبراز تفاصيل الجلد والحواف
                let sharpValue = center + factor * (5 * center - top - bottom - left - right);
                data[idx + c] = Math.min(255, Math.max(0, sharpValue));
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function renderImageWithAIEnhance() {
    if (currentFileType !== 'image') return;
    updateLabels();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // تفعيل تنعيم الخوارزميات بدقة عالية
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const bright = brightnessInput.value;
    const contrast = contrastInput.value;
    const saturate = saturationInput.value;

    ctx.filter = `
        brightness(${bright}%) 
        contrast(${contrast}%) 
        saturate(${saturate}%)
    `;

    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // تطبيق خوارزمية الذكاء الاصطناعي لاستخراج التفاصيل الحادة
    const sharpAmount = parseInt(sharpnessInput.value);
    if (sharpAmount > 0) {
        applyAIEnhancements(sharpAmount);
    }
}

function renderVideo() {
    if (currentFileType === 'video' && !videoElement.paused && !videoElement.ended) {
        updateLabels();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.filter = `
            brightness(${brightnessInput.value}%) 
            contrast(${contrastInput.value}%) 
            saturate(${saturationInput.value}%)
        `;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        animFrameId = requestAnimationFrame(renderVideo);
    }
}

qualitySelect.addEventListener('change', () => {
    updateCanvasDimensions();
    if (currentFileType === 'image') renderImageWithAIEnhance();
});

[sharpnessInput, contrastInput, brightnessInput, saturationInput].forEach(input => {
    input.addEventListener('input', () => {
        if (currentFileType === 'image') renderImageWithAIEnhance();
    });
});

document.getElementById('resetBtn').addEventListener('click', () => {
    qualitySelect.value = "2160"; // 4K تلقائي
    sharpnessInput.value = 35;
    contrastInput.value = 108;
    brightnessInput.value = 102;
    saturationInput.value = 104;
    updateCanvasDimensions();
    if (currentFileType === 'image') renderImageWithAIEnhance();
});

downloadBtn.addEventListener('click', () => {
    if (currentFileType === 'image') {
        const link = document.createElement('a');
        link.download = `AI_Enhanced_4K_${qualitySelect.value}p.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } else {
        alert("تأكد من اختيار صورة أولاً.");
    }
});
