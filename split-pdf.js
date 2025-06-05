// Split PDF JavaScript
class PDFSplitter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.selectedFile = null;
        this.pageCount = 0;
        this.splitMode = null;
        this.splitResults = [];
    }

    initializeElements() {
        this.elements = {
            pdfInput: document.getElementById('pdfInput'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            pageCount: document.getElementById('pageCount'),
            clearFile: document.getElementById('clearFile'),
            splitOptions: document.getElementById('splitOptions'),
            optionCards: document.querySelectorAll('.option-card'),
            rangeInput: document.getElementById('rangeInput'),
            pageRange: document.getElementById('pageRange'),
            splitBtn: document.getElementById('splitBtn'),
            progressContainer: document.getElementById('progressContainer'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            resultSection: document.getElementById('resultSection'),
            downloadList: document.getElementById('downloadList'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            newSplitBtn: document.getElementById('newSplitBtn')
        };
    }

    bindEvents() {
        // File input change
        this.elements.pdfInput.addEventListener('change', (e) => this.handleFileSelection(e));
        
        // Drag and drop events
        this.elements.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Clear file button
        this.elements.clearFile.addEventListener('click', () => this.clearSelection());
        
        // Split option cards
        this.elements.optionCards.forEach(card => {
            card.addEventListener('click', () => this.selectSplitOption(card.dataset.option));
        });
        
        // Page range input
        this.elements.pageRange.addEventListener('input', () => this.validatePageRange());
        
        // Split button
        this.elements.splitBtn.addEventListener('click', () => this.splitPDF());
        
        // Download all button
        this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllAsZip());
        
        // New split button
        this.elements.newSplitBtn.addEventListener('click', () => this.resetToInitialState());
        
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
        this.elements.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (!this.elements.dropZone.contains(e.relatedTarget)) {
            this.elements.dropZone.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        this.elements.dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');
        
        if (pdfFile) {
            this.processFile(pdfFile);
        } else {
            this.showNotification('Please select a PDF file.', 'error');
        }
    }

    handleFileSelection(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.processFile(file);
        } else {
            this.showNotification('Please select a valid PDF file.', 'error');
        }
    }

    async processFile(file) {
        this.selectedFile = file;
        
        try {
            // Show file info
            this.elements.fileName.textContent = file.name;
            this.elements.fileSize.textContent = this.formatFileSize(file.size);
            
            // Get page count
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            this.pageCount = pdfDoc.getPageCount();
            this.elements.pageCount.textContent = `${this.pageCount} pages`;
            
            // Show UI elements
            this.elements.fileInfo.style.display = 'flex';
            this.elements.splitOptions.style.display = 'block';
            
            this.showNotification(`PDF loaded successfully! ${this.pageCount} pages found.`, 'success');
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showNotification('Failed to process PDF file. Please try another file.', 'error');
            this.clearSelection();
        }
    }

    selectSplitOption(option) {
        // Remove selected class from all cards
        this.elements.optionCards.forEach(card => card.classList.remove('selected'));
        
        // Add selected class to clicked card
        const selectedCard = document.querySelector(`[data-option="${option}"]`);
        selectedCard.classList.add('selected');
        
        this.splitMode = option;
        
        // Show/hide range input based on selection
        if (option === 'range') {
            this.elements.rangeInput.style.display = 'block';
            this.elements.pageRange.placeholder = `1-${this.pageCount}`;
        } else {
            this.elements.rangeInput.style.display = 'none';
        }
        
        this.validateSplitOptions();
    }

    validatePageRange() {
        const range = this.elements.pageRange.value.trim();
        const isValid = this.isValidPageRange(range);
        
        if (range && !isValid) {
            this.elements.pageRange.style.borderColor = '#ef4444';
            this.elements.splitBtn.disabled = true;
        } else {
            this.elements.pageRange.style.borderColor = '#d1d5db';
            this.validateSplitOptions();
        }
    }

    isValidPageRange(range) {
        if (!range) return false;
        
        const parts = range.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            
            // Check for range (e.g., "1-5")
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
                if (isNaN(start) || isNaN(end) || start < 1 || end > this.pageCount || start > end) {
                    return false;
                }
            } 
            // Check for single page (e.g., "3")
            else {
                const page = parseInt(trimmed);
                if (isNaN(page) || page < 1 || page > this.pageCount) {
                    return false;
                }
            }
        }
        return true;
    }

    validateSplitOptions() {
        let isValid = false;
        
        if (this.splitMode === 'all') {
            isValid = true;
        } else if (this.splitMode === 'range') {
            const range = this.elements.pageRange.value.trim();
            isValid = this.isValidPageRange(range);
        }
        
        this.elements.splitBtn.disabled = !isValid;
    }    parsePageRange(range) {
        const pageGroups = [];
        const parts = range.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
                const rangePages = [];
                for (let i = start; i <= end; i++) {
                    rangePages.push(i);
                }
                pageGroups.push(rangePages);
            } else {
                pageGroups.push([parseInt(trimmed)]);
            }
        }
        
        return pageGroups;
    }

    async splitPDF() {
        if (!this.selectedFile || !this.splitMode) {
            this.showNotification('Please select a file and split option.', 'error');
            return;
        }

        try {
            this.showProgress();
            
            const arrayBuffer = await this.selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            let pagesToExtract = [];
              if (this.splitMode === 'all') {
                // Extract all pages individually
                for (let i = 1; i <= this.pageCount; i++) {
                    pagesToExtract.push([i]);
                }
            } else if (this.splitMode === 'range') {
                const range = this.elements.pageRange.value.trim();
                const pageGroups = this.parsePageRange(range);
                
                // Create separate PDFs for each range group
                pagesToExtract = pageGroups;
            }
            
            this.splitResults = [];
            
            for (let i = 0; i < pagesToExtract.length; i++) {
                const pages = pagesToExtract[i];
                const newPdf = await PDFLib.PDFDocument.create();
                
                // Copy pages to new PDF
                const copiedPages = await newPdf.copyPages(pdfDoc, pages.map(p => p - 1));
                copiedPages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                  let fileName;
                if (this.splitMode === 'all') {
                    fileName = `${this.getFileNameWithoutExtension()}_page_${pages[0]}.pdf`;
                } else {
                    if (pages.length === 1) {
                        fileName = `${this.getFileNameWithoutExtension()}_page_${pages[0]}.pdf`;
                    } else {
                        // For ranges, create a descriptive name
                        const isConsecutive = pages.every((page, index) => 
                            index === 0 || page === pages[index - 1] + 1
                        );
                        
                        if (isConsecutive) {
                            fileName = `${this.getFileNameWithoutExtension()}_pages_${pages[0]}-${pages[pages.length - 1]}.pdf`;
                        } else {
                            fileName = `${this.getFileNameWithoutExtension()}_pages_${pages.join(',')}.pdf`;
                        }
                    }
                }
                
                this.splitResults.push({
                    fileName,
                    blob,
                    url: URL.createObjectURL(blob),
                    pages: pages.length
                });
                
                this.updateProgress((i + 1) / pagesToExtract.length * 100);
            }
            
            this.showResult();
            this.showNotification(`PDF split successfully into ${this.splitResults.length} files!`, 'success');
            
        } catch (error) {
            console.error('Error splitting PDF:', error);
            this.showNotification('An error occurred while splitting the PDF. Please try again.', 'error');
            this.hideProgress();
        }
    }

    getFileNameWithoutExtension() {
        return this.selectedFile.name.replace(/\.[^/.]+$/, '');
    }    showProgress() {
        this.elements.splitOptions.style.display = 'none';
        this.elements.progressContainer.style.display = 'block';
        this.updateProgress(0);
        
        // Reset progress info to normal layout (not centered)
        const progressInfoContainer = this.elements.progressContainer.querySelector('.progress-info');
        if (progressInfoContainer) {
            progressInfoContainer.classList.remove('centered');
        }
        // Reset the progress text to initial state
        const progressInfo = this.elements.progressContainer.querySelector('.progress-info span');
        if (progressInfo) {
            progressInfo.textContent = 'Splitting PDF...';
        }
    }updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
        if (Math.round(percentage) >= 100) {
            // Update both the static text and progress text to show completion
            const progressInfo = this.elements.progressContainer.querySelector('.progress-info span');
            const progressInfoContainer = this.elements.progressContainer.querySelector('.progress-info');
            if (progressInfo) {
                progressInfo.textContent = 'Splitting PDF...Complete!';
            }
            // Center the completion message
            if (progressInfoContainer) {
                progressInfoContainer.classList.add('centered');
            }
            this.elements.progressText.textContent = '';
        } else {
            this.elements.progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    hideProgress() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.splitOptions.style.display = 'block';
    }    showResult() {
        // Keep progress container visible to show completed conversion progress
        // this.elements.progressContainer.style.display = 'none';
        this.elements.resultSection.style.display = 'block';
        
        // Generate download list
        this.elements.downloadList.innerHTML = this.splitResults.map(result => `
            <div class="download-item">
                <div class="download-info">
                    <div class="download-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="download-name">${result.fileName}</div>
                </div>
                <a href="${result.url}" download="${result.fileName}" class="download-btn-small">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Download
                </a>
            </div>
        `).join('');
    }

    async downloadAllAsZip() {
        if (this.splitResults.length === 0) return;
        
        try {
            const zip = new JSZip();
            
            // Add each PDF to the zip
            for (const result of this.splitResults) {
                zip.file(result.fileName, result.blob);
            }
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Create download link
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const zipFileName = `${this.getFileNameWithoutExtension()}_split_${timestamp}.zip`;
            
            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = zipFileName;
            downloadLink.click();
            
            // Clean up
            URL.revokeObjectURL(zipUrl);
            
            this.showNotification('ZIP file downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating ZIP:', error);
            this.showNotification('Failed to create ZIP file.', 'error');
        }
    }

    clearSelection() {
        this.selectedFile = null;
        this.pageCount = 0;
        this.splitMode = null;
        
        // Reset form
        this.elements.pdfInput.value = '';
        this.elements.pageRange.value = '';
        
        // Hide UI elements
        this.elements.fileInfo.style.display = 'none';
        this.elements.splitOptions.style.display = 'none';
        this.elements.rangeInput.style.display = 'none';
        
        // Remove selected class from option cards
        this.elements.optionCards.forEach(card => card.classList.remove('selected'));
        
        // Reset button state
        this.elements.splitBtn.disabled = true;
    }

    resetToInitialState() {
        this.clearSelection();
        this.elements.resultSection.style.display = 'none';
        this.elements.progressContainer.style.display = 'none';
        
        // Clean up blob URLs
        this.splitResults.forEach(result => {
            URL.revokeObjectURL(result.url);
        });
        this.splitResults = [];
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
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
    window.pdfSplitter = new PDFSplitter();
});
