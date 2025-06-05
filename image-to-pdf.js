class PDFConverter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.selectedFiles = [];
    }    initializeElements() {
        this.elements = {
            imageInput: document.getElementById('imageInput'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileCount: document.getElementById('fileCount'),
            fileList: document.getElementById('fileList'),
            fileListSection: document.getElementById('fileListSection'),
            actionSection: document.getElementById('actionSection'),
            filesContainer: document.getElementById('filesContainer'),
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
    }    async handleFileSelection(e) {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length !== files.length) {
            this.showNotification('Some non-image files were filtered out.', 'warning');
        }
        
        // Process files and create file objects with metadata
        this.selectedFiles = [];
        for (const file of imageFiles) {
            await this.addFile(file);
        }
        
        this.updateUI();
    }    async addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: this.formatFileSize(file.size),
            dimensions: 'Loading...'
        };
        this.selectedFiles.push(fileObj);
        
        // Get image dimensions asynchronously
        await this.getImageDimensions(fileObj);
    }

    getImageDimensions(fileObj) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(fileObj.file);
            
            img.onload = () => {
                fileObj.dimensions = `${img.width} × ${img.height}`;
                this.updateFileDisplay(fileObj);
                URL.revokeObjectURL(url);
                resolve();
            };
            
            img.onerror = () => {
                fileObj.dimensions = 'Unknown';
                this.updateFileDisplay(fileObj);
                URL.revokeObjectURL(url);
                resolve();
            };
            
            img.src = url;
        });
    }

    updateFileDisplay(fileObj) {
        const container = this.elements.filesContainer;
        if (!container) return;
        
        const fileItem = container.querySelector(`[data-file-id="${fileObj.id}"]`);
        if (fileItem) {
            const dimensionsElement = fileItem.querySelector('.file-dimensions');
            if (dimensionsElement) {
                dimensionsElement.textContent = fileObj.dimensions;
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }    updateUI() {
        const fileCount = this.selectedFiles.length;
        
        if (fileCount > 0) {
            this.elements.fileCount.textContent = `${fileCount} image${fileCount > 1 ? 's' : ''} selected`;
            this.elements.fileInfo.style.display = 'flex';
            this.elements.fileList.style.display = 'block';
            this.elements.fileListSection.style.display = 'block';
            this.elements.actionSection.style.display = 'block';
            this.elements.convertBtn.disabled = false;
        } else {
            this.elements.fileInfo.style.display = 'none';
            this.elements.fileList.style.display = 'none';
            this.elements.fileListSection.style.display = 'none';
            this.elements.actionSection.style.display = 'none';
            this.elements.convertBtn.disabled = true;
        }
        
        this.renderFileList();
    }

    renderFileList() {
        const container = this.elements.filesContainer;
        if (!container) return;

        if (this.selectedFiles.length === 0) {
            container.innerHTML = '<p class="no-files">No image files selected</p>';
            return;
        }

        container.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item" draggable="true" data-index="${index}" data-file-id="${file.id}">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
                        <polyline points="21,15 16,10 5,21" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${file.size}</span>
                        <span class="file-dimensions">${file.dimensions || 'Loading...'}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <div class="drag-handle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/>
                            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/>
                            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <button class="remove-btn" onclick="imageConverter.removeFile(${file.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');        // Add drag and drop for reordering
        this.addDragAndDropForReordering();
    }

    addDragAndDropForReordering() {
        const container = this.elements.filesContainer;
        if (!container) return;
        
        const fileItems = container.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.index);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const container = this.elements.filesContainer;
                const draggingItem = container.querySelector('.dragging');
                if (draggingItem !== item) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(item.dataset.index);
                
                if (fromIndex !== toIndex) {
                    this.moveFile(fromIndex, toIndex);
                }
            });
        });
    }

    moveFile(fromIndex, toIndex) {
        const file = this.selectedFiles.splice(fromIndex, 1)[0];
        this.selectedFiles.splice(toIndex, 0, file);
        this.updateUI();
    }

    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
        this.updateUI();
    }

    clearSelection() {
        this.selectedFiles = [];
        this.elements.imageInput.value = '';
        this.updateUI();
    }    async convertToPDF() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('Please select image files first.', 'error');
            return;
        }

        try {
            this.showProgress();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            for (let i = 0; i < this.selectedFiles.length; i++) {
                // Use the .file property from the file object
                await this.processImage(doc, this.selectedFiles[i].file, i);
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
                
                img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));            };
            
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
        });
    }

    async finalizePDF(doc) {
        const pdfBlob = doc.output('blob');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const fileName = `images-to-pdf-${timestamp}.pdf`;
        
        this.elements.downloadLink.href = URL.createObjectURL(pdfBlob);
        this.elements.downloadLink.download = fileName;
    }    showProgress() {
        this.elements.progressContainer.style.display = 'block';
        this.elements.actionSection.style.display = 'none';
        // this.elements.fileListSection.style.display = 'none';
        // Keep fileInfo visible during conversion to show "Selected Images" info
        // this.elements.fileInfo.style.display = 'none';
        this.elements.resultSection.style.display = 'none';
        this.elements.progressBar.style.width = '0%';
        this.elements.progressText.textContent = '0%';
        
        // Reset progress info to normal layout (not centered)
        const progressInfoContainer = this.elements.progressContainer.querySelector('.progress-info');
        if (progressInfoContainer) {
            progressInfoContainer.classList.remove('centered');
        }
        // Reset the progress text to initial state
        const progressInfo = this.elements.progressContainer.querySelector('.progress-info span');
        if (progressInfo) {
            progressInfo.textContent = 'Converting images to PDF...';
        }
    }updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
        if (Math.round(percentage) >= 100) {
            // Update both the static text and progress text to show completion
            const progressInfo = this.elements.progressContainer.querySelector('.progress-info span');
            const progressInfoContainer = this.elements.progressContainer.querySelector('.progress-info');
            if (progressInfo) {
                progressInfo.textContent = 'Converting images to PDF...Complete!';
            }
            // Center the completion message
            if (progressInfoContainer) {
                progressInfoContainer.classList.add('centered');
            }
            this.elements.progressText.textContent = '';
        } else {
            this.elements.progressText.textContent = `${Math.round(percentage)}%`;
        }
    }hideProgress() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.actionSection.style.display = 'block';
        this.elements.fileInfo.style.display = 'flex';
        this.elements.fileListSection.style.display = 'block';    }showResult() {
        // Keep progress container visible to show completed conversion progress
        // this.elements.progressContainer.style.display = 'none';
        this.elements.actionSection.style.display = 'none';
        this.elements.fileInfo.style.display = 'flex';
        this.elements.fileListSection.style.display = 'block';
        this.elements.resultSection.style.display = 'block';
    }resetToInitialState() {
        this.clearSelection();
        this.elements.resultSection.style.display = 'none';
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

// Navigation function
function goBack() {
    window.location.href = 'index.html';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageConverter = new PDFConverter();
});
