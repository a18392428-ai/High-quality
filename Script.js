const mediaInput = document.getElementById('mediaInput');
const editorSection = document.getElementById('editorSection');
const canvas = document.getElementById('canvasPreview');
const ctx = canvas.getContext('2d');
const videoElement = document.getElementById('videoElement');

const sharpnessInput = document.getElementById('sharpness');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const saturationInput = document.getElementById('saturation');
const downloadBtn = document.getElementById('downloadBtn');

let currentFileType = '';
let loadedImage = new Image();
let animFrameId = null;

// عند اختيار ملف
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
            canvas.width = loadedImage.width;
            canvas.height = loadedImage.height;
            render();
        };
        loadedImage.src = fileURL;
    } else if (file.type.startsWith('video/')) {
        currentFileType = 'video';
        videoElement.src = fileURL;
        videoElement.loop = true;
        videoElement.muted = true;

        videoElement.onloadedmetadata = () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            videoElement.play();
            renderVideo();
        };
    }
});

function updateLabels() {
    document.getElementById('sharpVal').innerText = sharpnessInput.value + '%';
    document.getElementById('contrastVal').innerText = contrastInput.value + '%';
    document.getElementById('brightVal').innerText = brightnessInput.value + '%';
    document.getElementById('saturateVal').innerText = saturationInput.value + '%';
}

// رسم المعالجة للصور
function render() {
    if (currentFileType !== 'image') return;
    updateLabels();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // تطبيق الفلاتر والحدة بالـ CSS Filter المباشر (سريع وبدون أخطاء كراش)
    const sharp = parseInt(sharpnessInput.value);
    const bright = brightnessInput.value;
    const contrast = contrastInput.value;
    const saturate = saturationInput.value;

    // استخدام خوارزمية الفلترة المدمجة بالمتصفح لمنع ثقل الجهاز
    ctx.filter = `
        brightness(${bright}%) 
        contrast(${contrast}%) 
        saturate(${saturate}%) 
        drop-shadow(0 0 ${sharp / 50}px rgba(0,0,0,0.5))
    `;
    
    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
}

// رسم المعالجة للفيديوهات
function renderVideo() {
    if (currentFileType === 'video' && !videoElement.paused && !videoElement.ended) {
        updateLabels();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `
            brightness(${brightnessInput.value}%) 
            contrast(${contrastInput.value}%) 
            saturate(${saturationInput.value}%)
        `;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        animFrameId = requestAnimationFrame(renderVideo);
    }
}

// استماع للتحريك في السلايدرز
[sharpnessInput, contrastInput, brightnessInput, saturationInput].forEach(input => {
    input.addEventListener('input', () => {
        if (currentFileType === 'image') render();
    });
});

// إعادة الضبط
document.getElementById('resetBtn').addEventListener('click', () => {
    sharpnessInput.value = 50;
    contrastInput.value = 110;
    brightnessInput.value = 105;
    saturationInput.value = 120;
    if (currentFileType === 'image') render();
});

// حفظ الصورة
downloadBtn.addEventListener('click', () => {
    if (currentFileType === 'image') {
        const link = document.createElement('a');
        link.download = 'Enhanced_Image.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } else {
        alert("تأكد من اختيار صورة أولاً للحفظ.");
    }
});
