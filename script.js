class PDFConverter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.selectedFiles = [];
    }

    initializeElements() {
        this.elements = {
            imageInput: document.getElementById('imageInput'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileCount: document.getElementById('fileCount'),
            clearFiles: document.getElementById('clearFiles'),
            convertBtn: document.getElementById('convertBtn'),
            progressContainer: document.getElementById('progressContainer'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            resultSection: document.getElementById('resultSection'),
            downloadLink: document.getElementById('downloadLink'),
            newConversionBtn: document.getElementById('newConversionBtn')
        };
    }

    bindEvents() {
        // File input change
        this.elements.imageInput.addEventListener('change', (e) => this.handleFileSelection(e));
        
        // Drag and drop events
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Button events
        this.elements.convertBtn.addEventListener('click', () => this.convertToPDF());
        this.elements.clearFiles.addEventListener('click', () => this.clearSelection());
        this.elements.newConversionBtn.addEventListener('click', () => this.resetToInitialState());
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDragOver(e) {
        this.elements.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        this.elements.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        this.elements.dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        
        if (files.length > 0) {
            this.elements.imageInput.files = this.createFileList(files);
            this.handleFileSelection({ target: this.elements.imageInput });
        } else {
            this.showNotification('Please drop only image files.', 'error');
        }
    }

    createFileList(files) {
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        return dt.files;
    }

    handleFileSelection(e) {
        const files = Array.from(e.target.files);
        this.selectedFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (this.selectedFiles.length !== files.length) {
            this.showNotification('Some non-image files were filtered out.', 'warning');
        }
        
        this.updateUI();
    }

    updateUI() {
        const fileCount = this.selectedFiles.length;
        
        if (fileCount > 0) {
            this.elements.fileCount.textContent = `${fileCount} image${fileCount > 1 ? 's' : ''} selected`;
            this.elements.fileInfo.style.display = 'flex';
            this.elements.convertBtn.disabled = false;
        } else {
            this.elements.fileInfo.style.display = 'none';
            this.elements.convertBtn.disabled = true;
        }
    }

    clearSelection() {
        this.selectedFiles = [];
        this.elements.imageInput.value = '';
        this.updateUI();
    }

    async convertToPDF() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('Please select image files first.', 'error');
            return;
        }

        try {
            this.showProgress();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            for (let i = 0; i < this.selectedFiles.length; i++) {
                await this.processImage(doc, this.selectedFiles[i], i);
                this.updateProgress((i + 1) / this.selectedFiles.length * 100);
            }

            await this.finalizePDF(doc);
            this.showResult();
            
        } catch (error) {
            console.error('Error converting to PDF:', error);
            this.showNotification('An error occurred during conversion. Please try again.', 'error');
            this.hideProgress();
        }
    }

    processImage(doc, file, index) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    try {
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();
                        const margin = 10; // 10mm margin
                        const availableWidth = pageWidth - (margin * 2);
                        const availableHeight = pageHeight - (margin * 2);
                        
                        // Calculate dimensions while maintaining aspect ratio
                        let imgWidth = img.width;
                        let imgHeight = img.height;
                        const aspectRatio = imgWidth / imgHeight;
                        
                        // Fit to available space
                        if (imgWidth > availableWidth) {
                            imgWidth = availableWidth;
                            imgHeight = imgWidth / aspectRatio;
                        }
                        
                        if (imgHeight > availableHeight) {
                            imgHeight = availableHeight;
                            imgWidth = imgHeight * aspectRatio;
                        }
                        
                        // Center the image
                        const x = (pageWidth - imgWidth) / 2;
                        const y = (pageHeight - imgHeight) / 2;
                        
                        if (index > 0) {
                            doc.addPage();
                        }
                        
                        doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            };
            
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
        });
    }    async finalizePDF(doc) {
        const pdfBlob = doc.output('blob');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const fileName = `images-to-pdf-${timestamp}.pdf`;
        
        this.elements.downloadLink.href = URL.createObjectURL(pdfBlob);
        this.elements.downloadLink.download = fileName;
        
        // Add click event listener for download
        this.elements.downloadLink.addEventListener('click', () => {
            // Optional: Reset to initial state after download
            setTimeout(() => {
                this.resetToInitialState();
            }, 1000);
        }, { once: true }); // Use 'once' to ensure the event listener is removed after first click
    }

    showProgress() {
        this.elements.convertBtn.style.display = 'none';
        this.elements.progressContainer.style.display = 'block';
        this.updateProgress(0);
    }

    updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${Math.round(percentage)}%`;
    }

    hideProgress() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.convertBtn.style.display = 'flex';
    }

    showResult() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.resultSection.style.display = 'block';
    }

    resetToInitialState() {
        this.clearSelection();
        this.elements.resultSection.style.display = 'none';
        this.elements.convertBtn.style.display = 'flex';
        this.elements.progressContainer.style.display = 'none';
        
        // Clean up the blob URL
        if (this.elements.downloadLink.href) {
            URL.revokeObjectURL(this.elements.downloadLink.href);
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        if (type === 'error') {
            notification.style.background = '#ef4444';
        } else if (type === 'warning') {
            notification.style.background = '#f59e0b';
        } else {
            notification.style.background = '#10b981';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFConverter();
});
