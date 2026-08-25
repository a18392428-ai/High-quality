const mediaInput = document.getElementById('mediaInput');
const editorSection = document.getElementById('editorSection');
const canvas = document.getElementById('canvasPreview');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const videoElement = document.getElementById('videoElement');

const sharpnessInput = document.getElementById('sharpness');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const saturationInput = document.getElementById('saturation');
const sharpnessGroup = document.getElementById('sharpnessGroup');

let currentType = ''; // 'image' or 'video'
let originalImage = new Image();
let animationFrameId = null;

// استقبال الملف (صورة أو فيديو)
mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    cancelAnimationFrame(animationFrameId);
    videoElement.pause();
    videoElement.src = "";

    const fileURL = URL.createObjectURL(file);
    editorSection.style.display = 'grid';

    if (file.type.startsWith('image/')) {
        currentType = 'image';
        sharpnessGroup.style.display = 'block';
        originalImage.onload = () => {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            renderImage();
        };
        originalImage.src = fileURL;
    } else if (file.type.startsWith('video/')) {
        currentType = 'video';
        sharpnessGroup.style.display = 'none'; // تعطيل الحدة المعقدة للفيديوهات للحفاظ على السلاسة
        videoElement.src = fileURL;
        videoElement.load();
        videoElement.onloadedmetadata = () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            videoElement.play();
            renderVideoFrame();
        };
    }
});

// تحديث القيم النصية
function updateLabels() {
    document.getElementById('sharpVal').innerText = sharpnessInput.value + '%';
    document.getElementById('contrastVal').innerText = contrastInput.value + '%';
    document.getElementById('brightVal').innerText = brightnessInput.value + '%';
    document.getElementById('saturateVal').innerText = saturationInput.value + '%';
}

// رسم وتحسين الصورة
function renderImage() {
    if (currentType !== 'image') return;
    updateLabels();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `
        brightness(${brightnessInput.value}%) 
        contrast(${contrastInput.value}%) 
        saturate(${saturationInput.value}%)
    `;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    if (parseInt(sharpnessInput.value) > 50) {
        applySharpness(sharpnessInput.value / 50);
    }
}

// رسم وتحسين إطارات الفيديو بلحظتها (Real-time Video Processing)
function renderVideoFrame() {
    if (currentType !== 'video') return;
    updateLabels();

    if (!videoElement.paused && !videoElement.ended) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `
            brightness(${brightnessInput.value}%) 
            contrast(${contrastInput.value}%) 
            saturate(${saturationInput.value}%)
        `;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(renderVideoFrame);
    }
}

// خوارزمية الحدة للصور
function applySharpness(amount) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;
    const mix = amount - 1;
    const kernel = [0, -mix, 0, -mix, 1 + (4 * mix), -mix, 0, -mix, 0];
    const buff = new Uint8ClampedArray(data);

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const dstOff = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
                const res = 
                    buff[((y-1)*w + (x-1))*4 + c] * kernel[0] +
                    buff[((y-1)*w + x)*4 + c]     * kernel[1] +
                    buff[((y-1)*w + (x+1))*4 + c] * kernel[2] +
                    buff[(y*w + (x-1))*4 + c]     * kernel[3] +
                    buff[(y*w + x)*4 + c]         * kernel[4] +
                    buff[(y*w + (x+1))*4 + c]     * kernel[5] +
                    buff[((y+1)*w + (x-1))*4 + c] * kernel[6] +
                    buff[((y+1)*w + x)*4 + c]     * kernel[7] +
                    buff[((y+1)*w + (x+1))*4 + c] * kernel[8];
                data[dstOff + c] = Math.min(255, Math.max(0, res));
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// تفعيل الاستماع للتعديلات
[sharpnessInput, contrastInput, brightnessInput, saturationInput].forEach(input => {
    input.addEventListener('input', () => {
        if (currentType === 'image') renderImage();
    });
});

// زر إعادة الضبط
document.getElementById('resetBtn').addEventListener('click', () => {
    sharpnessInput.value = 50;
    contrastInput.value = 110;
    brightnessInput.value = 105;
    saturationInput.value = 120;
    if (currentType === 'image') renderImage();
});

// زر التحميل والتنزيل
document.getElementById('downloadBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    if (currentType === 'image') {
        link.download = 'Enhanced_Image.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } else {
        alert("لتحميل الفيديو، يُرجى تشغيله بالكامل أثناء تطبيق الفلاتر أو استخدام أداة تسجيل الشاشة المدمجة.");
    }
});