class ImageEnhancer {
    constructor() {
        this.originalImage = null;
        this.enhancedImage = null;
        this.currentImageFile = null;
        this.enhancedImageUrl = null;
        this.backendUrl = "https://your-pythonanywhere-backend.com";
        
        // Mobile detection
        this.isMobile = this.checkIfMobile();
        
        // Initialize immediately
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSliders();
        this.setCurrentYear();
        this.checkBackendConnection();
        this.setupModalListeners();
        
        // Mobile-specific setup
        if (this.isMobile) {
            this.setupMobileFeatures();
        }
        
        console.log("✅ ImageEnhancer initialized");
    }

    checkIfMobile() {
        return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupMobileFeatures() {
        console.log("📱 Mobile device detected - optimizing interface");
        
        // Adjust UI for mobile
        this.adjustMobileUI();
        
        // Add mobile gestures
        this.setupMobileGestures();
        
        // Show mobile tips
        setTimeout(() => {
            this.showStatus('📱 Controls are stacked for better mobile experience', 'info');
        }, 2000);
    }

    adjustMobileUI() {
        // Limit super resolution on mobile
        const superResSelect = document.getElementById('superResSelect');
        const option8x = superResSelect.querySelector('option[value="8"]');
        
        if (option8x) {
            option8x.disabled = true;
            option8x.textContent = '8x Upscale (Not available on mobile)';
        }
        
        // Adjust file size limit for mobile
        this.maxFileSize = 5 * 1024 * 1024; // 5MB for mobile
    }

    setupMobileGestures() {
        // Add double tap to zoom
        this.setupDoubleTapZoom();
        
        // Add pull to refresh prevention
        this.preventPullToRefresh();
    }

    setupDoubleTapZoom() {
        const images = ['originalImage', 'enhancedImage'];
        
        images.forEach(imgId => {
            const img = document.getElementById(imgId);
            if (img) {
                let lastTap = 0;
                img.addEventListener('touchstart', (e) => {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    
                    if (tapLength < 300 && tapLength > 0) {
                        // Double tap detected
                        e.preventDefault();
                        if (img.style.transform === 'scale(2)') {
                            img.style.transform = 'scale(1)';
                            img.style.transformOrigin = 'center center';
                        } else {
                            const touch = e.touches[0];
                            const rect = img.getBoundingClientRect();
                            const x = (touch.clientX - rect.left) / rect.width * 100;
                            const y = (touch.clientY - rect.top) / rect.height * 100;
                            
                            img.style.transform = 'scale(2)';
                            img.style.transformOrigin = `${x}% ${y}%`;
                        }
                    }
                    lastTap = currentTime;
                });
            }
        });
    }

    preventPullToRefresh() {
        let lastTouchY = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY;
                lastTouchY = touchStartY;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchYDelta = touchY - lastTouchY;
            
            // If the user is scrolling up from the top, prevent pull-to-refresh
            if (window.scrollY === 0 && touchYDelta > 0 && touchY - touchStartY > 50) {
                e.preventDefault();
                return false;
            }
            
            lastTouchY = touchY;
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            lastTouchY = 0;
            touchStartY = 0;
        }, { passive: true });
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Get elements
        const imageInput = document.getElementById('imageInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const dropArea = document.getElementById('dropArea');
        
        // 1. UPLOAD BUTTON - SIMPLE CLICK
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Upload button clicked");
            imageInput.click();
        });
        
        // 2. FILE INPUT
        imageInput.addEventListener('change', (e) => {
            console.log("File input changed, files:", e.target.files);
            this.handleFileInputChange(e);
        }, false);
        
        // 3. DRAG & DROP
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.remove('drag-over');
            }, false);
        });

        dropArea.addEventListener('drop', (e) => {
            console.log("File dropped");
            if (e.dataTransfer.files.length) {
                this.handleImageFile(e.dataTransfer.files[0]);
            }
        }, false);
        
        // 4. CLICK ON DROP AREA (except on buttons)
        dropArea.addEventListener('click', (e) => {
            // Only trigger if click is not on a button
            if (!e.target.closest('button')) {
                console.log("Drop area clicked");
                imageInput.click();
            }
        }, false);
        
        // 5. SLIDERS - Mobile optimized
        const sliders = ['sharpnessSlider', 'contrastSlider', 'brightnessSlider', 'colorSlider'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                // Input event for desktop
                slider.addEventListener('input', (e) => {
                    const valueId = sliderId.replace('Slider', 'Value');
                    document.getElementById(valueId).textContent = `${e.target.value}x`;
                });
                
                // Touch events for mobile
                if (this.isMobile) {
                    slider.addEventListener('touchstart', (e) => {
                        slider.style.cursor = 'grabbing';
                    }, { passive: true });
                    
                    slider.addEventListener('touchend', () => {
                        slider.style.cursor = 'grab';
                    }, { passive: true });
                }
            }
        });
        
        // 6. SUPER RESOLUTION SELECT
        document.getElementById('superResSelect').addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            this.showStatus(`Super resolution: ${value}x selected`, 'success');
        });
        
        // 7. MAIN BUTTONS
        document.getElementById('enhanceBtn').addEventListener('click', () => {
            console.log("Enhance button clicked");
            this.enhanceImage();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', () => {
            console.log("Download button clicked");
            this.downloadImage();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            console.log("Reset button clicked");
            this.resetAll();
        });
        
        // 8. AUTO ENHANCE CHECKBOX
        document.getElementById('autoEnhanceCheckbox').addEventListener('change', (e) => {
            if (e.target.checked && this.currentImageFile) {
                this.showStatus("Auto-enhance enabled. Apply default enhancements.", 'info');
            }
        });
        
        console.log("✅ Event listeners setup complete");
    }

    setupModalListeners() {
        // Close error modal
        document.getElementById('closeErrorBtn')?.addEventListener('click', () => {
            this.hideModal('errorModal');
        });
        
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.hideModal('loadingModal');
            this.showStatus("Enhancement cancelled", 'info');
        });
        
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.hideModal('errorModal');
            if (this.currentImageFile) {
                this.enhanceImage();
            }
        });
        
        // Swipe to close modals on mobile
        if (this.isMobile) {
            this.setupModalSwipeGestures();
        }
    }

    setupModalSwipeGestures() {
        const modals = ['errorModal', 'loadingModal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                let startY = 0;
                
                modal.addEventListener('touchstart', (e) => {
                    startY = e.touches[0].clientY;
                }, { passive: true });
                
                modal.addEventListener('touchmove', (e) => {
                    const currentY = e.touches[0].clientY;
                    const diffY = currentY - startY;
                    
                    // Swipe down to close
                    if (diffY > 100) {
                        this.hideModal(modalId);
                    }
                }, { passive: true });
            }
        });
    }

    setCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }

    handleFileInputChange(e) {
        const fileInput = e.target;
        console.log("File input element:", fileInput);
        console.log("Files available:", fileInput.files);
        
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log("Processing file:", file.name, file.type, file.size);
            this.handleImageFile(file);
            
            // Reset input to allow same file selection
            setTimeout(() => {
                fileInput.value = '';
                console.log("File input reset");
            }, 100);
        } else {
            console.log("No file selected");
            this.showStatus("No file selected", "error");
        }
    }

    handleImageFile(file) {
        console.log("=== START handleImageFile ===");
        
        if (!file) {
            this.showStatus("No file provided", "error");
            return;
        }
        
        // Validate file type
        if (!file.type.match('image.*')) {
            this.showStatus('Please select an image file (JPG, PNG, etc.)', 'error');
            return;
        }
        
        // Check file size - MOBILE ADJUSTMENT
        const maxSize = this.isMobile ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const maxMB = this.isMobile ? '5MB' : '10MB';
            this.showStatus(`File too large! Please select image under ${maxMB}.`, 'error');
            return;
        }
        
        console.log("File validation passed:", file.name);
        this.currentImageFile = file;
        
        // Create FileReader
        const reader = new FileReader();
        
        reader.onloadstart = () => {
            console.log("Starting to read file...");
            this.showStatus('Loading image...', 'loading');
        };
        
        reader.onload = (e) => {
            console.log("File read successfully");
            this.originalImage = e.target.result;
            
            // Display image
            this.displayImage('originalPreview', this.originalImage, 'originalImage');
            
            // Update stats
            this.updateImageStats('originalStats', file);
            
            // Reset enhanced preview
            this.resetEnhancedPreview();
            
            // Enable enhance button
            document.getElementById('enhanceBtn').disabled = false;
            document.getElementById('downloadBtn').disabled = true;
            
            // Show file info
            document.getElementById('fileInfo').innerHTML = `
                <div><strong>📄 ${file.name}</strong></div>
                <div>Size: ${this.formatFileSize(file.size)}</div>
                <div>Type: ${file.type.split('/')[1].toUpperCase()}</div>
            `;
            
            this.showStatus('✅ Image loaded! Adjust settings and click "Enhance Image"', 'success');
            console.log("=== END handleImageFile ===");
        };
        
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            this.showStatus('❌ Failed to load image', 'error');
        };
        
        reader.onabort = () => {
            console.log("File reading aborted");
            this.showStatus('❌ Image loading cancelled', 'error');
        };
        
        // Start reading
        reader.readAsDataURL(file);
    }

    displayImage(previewId, imageUrl, imgElementId) {
        console.log(`Displaying image in ${previewId} with element ${imgElementId}`);
        const preview = document.getElementById(previewId);
        
        // Create or get img element
        let img = document.getElementById(imgElementId);
        if (!img) {
            img = document.createElement('img');
            img.id = imgElementId;
            img.alt = imgElementId.includes('original') ? 'Original Image' : 'Enhanced Image';
            preview.appendChild(img);
        }
        
        // Set image source
        img.src = imageUrl;
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        img.style.objectFit = 'contain';
        img.style.margin = '0 auto';
        
        // Hide placeholder elements
        const placeholder = preview.querySelector('.placeholder-content');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        console.log("Image displayed successfully");
    }

    updateImageStats(statsId, file) {
        const stats = document.getElementById(statsId);
        const img = new Image();
        
        img.onload = () => {
            const superResSelect = document.getElementById('superResSelect');
            const scaleFactor = parseInt(superResSelect.value);
            const newWidth = img.width * scaleFactor;
            const newHeight = img.height * scaleFactor;
            
            stats.innerHTML = `
                <div><strong>Current Size:</strong> ${img.width} × ${img.height}px</div>
                <div><strong>Enhanced Size:</strong> ${newWidth} × ${newHeight}px</div>
                <div><strong>File Size:</strong> ${this.formatFileSize(file.size)}</div>
                <div><strong>Format:</strong> ${file.type.split('/')[1].toUpperCase()}</div>
            `;
            stats.style.display = 'block';
        };
        
        img.onerror = () => {
            stats.innerHTML = `<div>Unable to get image dimensions</div>`;
            stats.style.display = 'block';
        };
        
        img.src = URL.createObjectURL(file);
    }

    async enhanceImage() {
        console.log("=== START enhanceImage ===");
        
        if (!this.currentImageFile) {
            this.showStatus('Please select an image first', 'error');
            return;
        }
        
        console.log("Current file:", this.currentImageFile.name);
        
        // MOBILE: Show warning for large upscaling
        const superResValue = parseInt(document.getElementById('superResSelect').value);
        if (this.isMobile && superResValue >= 4) {
            if (!confirm(`⚠️ ${superResValue}x upscaling may be slow on mobile. Continue?`)) {
                return;
            }
        }
        
        // Show loading with appropriate message
        let loadingMessage = 'Enhancing image... Please wait.';
        
        if (superResValue === 4) {
            loadingMessage = 'Applying 4x super resolution... This may take longer.';
        } else if (superResValue === 8) {
            loadingMessage = 'Applying 8x super resolution... Please be patient.';
        }
        
        // MOBILE: Add processing indicator
        if (this.isMobile) {
            this.showMobileProcessing(true, loadingMessage);
        }
        
        document.getElementById('loadingMessage').textContent = loadingMessage;
        this.showLoading(true);
        this.showStatus(loadingMessage, 'loading');
        
        console.log("Enhancement parameters:", {
            sharpness: document.getElementById('sharpnessSlider').value,
            contrast: document.getElementById('contrastSlider').value,
            brightness: document.getElementById('brightnessSlider').value,
            color: document.getElementById('colorSlider').value,
            denoise: document.getElementById('denoiseCheckbox').checked,
            super_resolution: superResValue
        });

        try {
            const formData = new FormData();
            formData.append('file', this.currentImageFile);
            
            // Get enhancement parameters
            const params = new URLSearchParams({
                sharpness: document.getElementById('sharpnessSlider').value,
                contrast: document.getElementById('contrastSlider').value,
                brightness: document.getElementById('brightnessSlider').value,
                color: document.getElementById('colorSlider').value,
                denoise: document.getElementById('denoiseCheckbox').checked,
                super_resolution: superResValue
            });

            console.log("Sending request to backend...");
            const response = await fetch(`${this.backendUrl}/enhance-advanced?${params}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            // Get enhanced image as blob
            const blob = await response.blob();
            console.log("Received blob size:", blob.size);
            
            // Clean up previous URL if exists
            if (this.enhancedImageUrl) {
                URL.revokeObjectURL(this.enhancedImageUrl);
            }
            
            this.enhancedImageUrl = URL.createObjectURL(blob);
            console.log("Created object URL for enhanced image");
            
            // Display enhanced image
            this.displayImage('enhancedPreview', this.enhancedImageUrl, 'enhancedImage');
            
            // Update enhanced stats
            const enhancedStats = document.getElementById('enhancedStats');
            const originalImg = new Image();
            originalImg.onload = () => {
                const scale = superResValue;
                const newWidth = originalImg.width * scale;
                const newHeight = originalImg.height * scale;
                
                enhancedStats.innerHTML = `
                    <div><strong>✅ Enhanced Successfully</strong></div>
                    <div><strong>New Size:</strong> ${newWidth} × ${newHeight}px</div>
                    <div><strong>Scale Factor:</strong> ${scale}x</div>
                    <div><strong>Download:</strong> Click Download to save your image</div>
                `;
                enhancedStats.style.display = 'block';
            };
            originalImg.src = this.originalImage;
            
            // Enable download button
            document.getElementById('downloadBtn').disabled = false;
            
            let successMessage = '✅ Image enhanced successfully! Click Download to save.';
            if (superResValue > 1) {
                successMessage = `✅ Image enhanced with ${superResValue}x super resolution! Click Download to save.`;
            }
            
            this.showStatus(successMessage, 'success');
            
            // Increment processed count
            if (window.incrementProcessedCount) {
                window.incrementProcessedCount();
            }
            
            console.log("=== END enhanceImage ===");
            
        } catch (error) {
            console.error('Enhancement error:', error);
            this.showErrorModal(`Enhancement failed: ${error.message}`);
        } finally {
            this.showLoading(false);
            // MOBILE: Hide processing indicator
            if (this.isMobile) {
                this.showMobileProcessing(false);
            }
        }
    }

    showMobileProcessing(show, message = 'Processing...') {
        let indicator = document.getElementById('mobileProcessingIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'mobileProcessingIndicator';
            indicator.className = 'enhance-processing';
            indicator.innerHTML = `
                <div class="loader-spinner"></div>
                <h3>${message}</h3>
                <p>Please keep the app open</p>
            `;
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.9);
                display: ${show ? 'flex' : 'none'};
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                text-align: center;
                padding: 20px;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = show ? 'flex' : 'none';
        if (show && indicator.querySelector('h3')) {
            indicator.querySelector('h3').textContent = message;
        }
    }

    downloadImage() {
        if (!this.enhancedImageUrl) {
            this.showStatus('No enhanced image to download', 'error');
            return;
        }
        
        const originalName = this.currentImageFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
        const superResValue = parseInt(document.getElementById('superResSelect').value);
        const scaleSuffix = superResValue > 1 ? `_${superResValue}x` : '';
        const filename = `enhanced${scaleSuffix}_${nameWithoutExt}_${timestamp}.png`;
        
        const a = document.createElement('a');
        a.href = this.enhancedImageUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
        
        this.showStatus(`📥 Download started: ${filename}`, 'success');
    }

    resetEnhancedPreview() {
        const preview = document.getElementById('enhancedPreview');
        const img = document.getElementById('enhancedImage');
        const placeholder = preview.querySelector('.placeholder-content');
        
        if (img) {
            img.style.display = 'none';
            img.src = '';
        }
        
        if (placeholder) placeholder.style.display = 'block';
        
        document.getElementById('enhancedStats').style.display = 'none';
        
        // Clean up URL
        if (this.enhancedImageUrl) {
            URL.revokeObjectURL(this.enhancedImageUrl);
            this.enhancedImageUrl = null;
        }
    }

    resetAll() {
        console.log("Resetting everything...");
        
        // Clear file input
        const fileInput = document.getElementById('imageInput');
        fileInput.value = '';
        
        // Reset previews
        this.resetImagePreview('originalPreview', 'originalImage');
        this.resetImagePreview('enhancedPreview', 'enhancedImage');
        
        // Reset stats
        document.getElementById('originalStats').style.display = 'none';
        document.getElementById('enhancedStats').style.display = 'none';
        
        // Reset file info
        document.getElementById('fileInfo').innerHTML = '';
        
        // Reset buttons
        document.getElementById('enhanceBtn').disabled = true;
        document.getElementById('downloadBtn').disabled = true;
        
        // Reset sliders to default
        document.getElementById('sharpnessSlider').value = 2.0;
        document.getElementById('contrastSlider').value = 1.2;
        document.getElementById('brightnessSlider').value = 1.1;
        document.getElementById('colorSlider').value = 1.1;
        document.getElementById('denoiseCheckbox').checked = false;
        document.getElementById('superResSelect').value = '1';
        document.getElementById('autoEnhanceCheckbox').checked = true;
        document.getElementById('formatSelect').value = 'png';
        
        this.updateSliders();
        
        // Clear variables
        this.originalImage = null;
        this.enhancedImage = null;
        this.currentImageFile = null;
        
        if (this.enhancedImageUrl) {
            URL.revokeObjectURL(this.enhancedImageUrl);
            this.enhancedImageUrl = null;
        }
        
        this.showStatus('Reset complete. Upload a new image to start.', 'success');
        console.log("Reset complete");
    }

    resetImagePreview(previewId, imgId) {
        const preview = document.getElementById(previewId);
        const img = document.getElementById(imgId);
        const placeholder = preview.querySelector('.placeholder-content');
        
        if (img) {
            img.style.display = 'none';
            img.src = '';
            img.style.transform = 'scale(1)';
        }
        
        if (placeholder) placeholder.style.display = 'block';
    }

    updateSliders() {
        document.getElementById('sharpnessValue').textContent = 
            `${document.getElementById('sharpnessSlider').value}x`;
        document.getElementById('contrastValue').textContent = 
            `${document.getElementById('contrastSlider').value}x`;
        document.getElementById('brightnessValue').textContent = 
            `${document.getElementById('brightnessSlider').value}x`;
        document.getElementById('colorValue').textContent = 
            `${document.getElementById('colorSlider').value}x`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showStatus(message, type = 'success') {
        const status = document.getElementById('statusText');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
    }

    showLoading(show) {
        const modal = document.getElementById('loadingModal');
        modal.style.display = show ? 'flex' : 'none';
    }

    showErrorModal(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showModal('errorModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async checkBackendConnection() {
        try {
            const backendStatus = document.getElementById('backendStatus');
            const response = await fetch(`${this.backendUrl}/health`);
            if (response.ok) {
                console.log('✅ Backend connection successful');
                backendStatus.innerHTML = '<i class="fas fa-check-circle"></i> Backend connected';
                backendStatus.style.color = '#10b981';
            } else {
                console.warn('⚠️ Backend connection issue');
                backendStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Backend connection issue';
                backendStatus.style.color = '#f59e0b';
            }
        } catch (error) {
            console.error('❌ Backend not reachable:', error);
            const backendStatus = document.getElementById('backendStatus');
            backendStatus.innerHTML = '<i class="fas fa-times-circle"></i> Backend not reachable. Make sure backend is running on port 8000.';
            backendStatus.style.color = '#ef4444';
        }
    }
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM fully loaded, initializing ImageEnhancer...");
        window.imageEnhancer = new ImageEnhancer();
    });
} else {
    // DOM already loaded
    console.log("DOM already loaded, initializing ImageEnhancer...");
    window.imageEnhancer = new ImageEnhancer();
}