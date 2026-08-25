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

// استقبال الملف
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
            updateCanvasDimensions();
            renderImage();
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

// تغيير الأبعاد بناءً على الجودة المختارة من القائمة
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

// رسم الصور بالدقة المختارة
function renderImage() {
    if (currentFileType !== 'image') return;
    updateLabels();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const bright = brightnessInput.value;
    const contrast = contrastInput.value;
    const saturate = saturationInput.value;
    const sharp = parseInt(sharpnessInput.value);

    ctx.filter = `
        brightness(${bright}%) 
        contrast(${contrast}%) 
        saturate(${saturate}%)
        contrast(${100 + sharp / 4}%)
    `;

    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
}

// رسم الفيديوهات
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

// الاستماع لتغيير دقة الجودة من القائمة
qualitySelect.addEventListener('change', () => {
    updateCanvasDimensions();
    if (currentFileType === 'image') renderImage();
});

// الاستماع لأشرطة التعديل
[sharpnessInput, contrastInput, brightnessInput, saturationInput].forEach(input => {
    input.addEventListener('input', () => {
        if (currentFileType === 'image') renderImage();
    });
});

// إعادة الضبط
document.getElementById('resetBtn').addEventListener('click', () => {
    qualitySelect.value = "1080";
    sharpnessInput.value = 60;
    contrastInput.value = 120;
    brightnessInput.value = 105;
    saturationInput.value = 125;
    updateCanvasDimensions();
    if (currentFileType === 'image') renderImage();
});

// التنزيل بالدقة والأبعاد المختارة
downloadBtn.addEventListener('click', () => {
    if (currentFileType === 'image') {
        const link = document.createElement('a');
        link.download = `Enhanced_${qualitySelect.value}p_${canvas.width}x${canvas.height}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } else {
        alert("تأكد من اختيار صورة للتنزيل.");
    }
});