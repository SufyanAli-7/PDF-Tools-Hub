class PDFMerger {    constructor() {
        this.selectedFiles = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('pdfInput');
        this.fileList = document.getElementById('fileList');
        this.filesContainer = document.getElementById('filesContainer');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileCount = document.getElementById('fileCount');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.newMergeBtn = document.getElementById('newMergeBtn');        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.downloadSection = document.querySelector('.download-section');
        
        // New elements for modern structure
        this.fileListSection = document.getElementById('fileListSection');
        this.actionSection = document.getElementById('actionSection');
        this.resultSection = document.getElementById('resultSection');
    }

    attachEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
          // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Button events
        this.mergeBtn?.addEventListener('click', () => this.mergePDFs());
        this.clearBtn?.addEventListener('click', () => this.clearFiles());
        this.newMergeBtn?.addEventListener('click', () => this.startNewMerge());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
    }

    async handleFileDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        if (files.length > 0) {
            await this.processFiles(files);
        } else {
            this.showError('Please drop only PDF files.');
        }
    }    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        await this.processFiles(files);
    }

    async processFiles(files) {
        for (const file of files) {
            if (file.type === 'application/pdf') {
                await this.addFile(file);
            }
        }        this.updateUI();
    }

    async addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: this.formatFileSize(file.size),
            pageCount: 'Loading...'
        };
        this.selectedFiles.push(fileObj);
          // Get page count asynchronously
        this.getPageCount(fileObj);
    }

    async getPageCount(fileObj) {
        try {
            // Load pdf-lib if not already loaded
            const { PDFDocument } = await this.loadPDFLib();
            
            // Convert file to array buffer
            const arrayBuffer = await this.fileToArrayBuffer(fileObj.file);
            
            // Load PDF and get page count
            const pdf = await PDFDocument.load(arrayBuffer);
            const pageCount = pdf.getPageCount();
            
            // Update the file object with page count
            fileObj.pageCount = `${pageCount} page${pageCount !== 1 ? 's' : ''}`;
            
            // Update just this specific file's display instead of re-rendering the entire list
            this.updateFileDisplay(fileObj);
            
        } catch (error) {
            console.error('Error getting page count for', fileObj.name, ':', error);
            fileObj.pageCount = 'Pages: N/A';
            this.updateFileDisplay(fileObj);
        }
    }

    updateFileDisplay(fileObj) {
        const container = this.filesContainer || this.fileList;
        if (!container) return;
        
        const fileItem = container.querySelector(`[data-file-id="${fileObj.id}"]`);
        if (fileItem) {
            const pagesElement = fileItem.querySelector('.file-pages');
            if (pagesElement) {
                pagesElement.textContent = fileObj.pageCount;
                pagesElement.classList.remove('loading');
            }
        }
    }

    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
        this.updateUI();
    }

    moveFile(fromIndex, toIndex) {
        const file = this.selectedFiles.splice(fromIndex, 1)[0];
        this.selectedFiles.splice(toIndex, 0, file);        this.updateUI();
    }

    updateUI() {
        const fileCount = this.selectedFiles.length;
        
        // Update file count display
        if (this.fileCount) {
            this.fileCount.textContent = `${fileCount} PDF${fileCount !== 1 ? 's' : ''} selected`;
        }
        
        // Show/hide sections based on file count
        if (fileCount > 0) {
            // Show file list section and action section
            if (this.fileListSection) {
                this.fileListSection.style.display = 'block';
            }
            if (this.actionSection) {
                this.actionSection.style.display = 'block';
            }
            
            // Legacy support for old structure
            if (this.fileInfo) {
                this.fileInfo.style.display = 'flex';
            }
            if (this.fileList) {
                this.fileList.style.display = 'block';
            }
        } else {
            // Hide file list section and action section
            if (this.fileListSection) {
                this.fileListSection.style.display = 'none';
            }
            if (this.actionSection) {
                this.actionSection.style.display = 'none';
            }
            
            // Legacy support for old structure
            if (this.fileInfo) {
                this.fileInfo.style.display = 'none';
            }
            if (this.fileList) {
                this.fileList.style.display = 'none';
            }
        }
        
        this.renderFileList();        this.updateButtons();
    }

    renderFileList() {
        const container = this.filesContainer || this.fileList;
        if (!container) return;

        if (this.selectedFiles.length === 0) {
            container.innerHTML = '<p class="no-files">No PDF files selected</p>';
            return;
        }        container.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item" draggable="true" data-index="${index}" data-file-id="${file.id}">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${file.size}</span>
                        <span class="file-pages ${file.pageCount === 'Loading...' ? 'loading' : ''}">${file.pageCount || 'Loading...'}</span>
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
                    <button class="remove-btn" onclick="pdfMerger.removeFile(${file.id})" title="Remove file">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add drag and drop for reordering
        this.addDragAndDropForReordering();
    }

    addDragAndDropForReordering() {
        const container = this.filesContainer || this.fileList;
        if (!container) return;
        
        const fileItems = container.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.index);
                e.target.classList.add('dragging');
            });            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const container = this.filesContainer || this.fileList;
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
    }    updateButtons() {
        if (this.mergeBtn) {
            this.mergeBtn.disabled = this.selectedFiles.length < 2;
        }
        
        if (this.clearBtn) {
            this.clearBtn.disabled = this.selectedFiles.length === 0;
        }
    }

    clearFiles() {
        this.selectedFiles = [];
        this.fileInput.value = '';        this.updateUI();
        this.hideProgress();
        this.hideDownload();
    }

    startNewMerge() {
        // Reset the application state for a new merge operation
        this.clearFiles();
        this.hideDownload();
        this.hideProgress();
        
        // Hide sections for new structure
        if (this.resultSection) {
            this.resultSection.style.display = 'none';
        }
        
        // Scroll to top to show the upload section
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async mergePDFs() {
        if (this.selectedFiles.length < 2) {
            this.showError('Please select at least 2 PDF files to merge.');
            return;
        }

        try {
            this.showProgress();
            this.updateProgress(0, 'Loading PDF library...');

            // Load pdf-lib from CDN
            const { PDFDocument } = await this.loadPDFLib();
            
            this.updateProgress(10, 'Creating merged document...');
            const mergedPdf = await PDFDocument.create();

            // Process each PDF file
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const fileObj = this.selectedFiles[i];
                const progress = 10 + (i / this.selectedFiles.length) * 80;
                
                this.updateProgress(progress, `Processing ${fileObj.name}...`);
                
                const arrayBuffer = await this.fileToArrayBuffer(fileObj.file);
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                pages.forEach(page => mergedPdf.addPage(page));
            }

            this.updateProgress(95, 'Generating final PDF...');
            const pdfBytes = await mergedPdf.save();
            
            this.updateProgress(100, 'Complete!');
            this.createDownloadLink(pdfBytes);
            
        } catch (error) {
            console.error('Error merging PDFs:', error);
            this.showError('Failed to merge PDFs. Please try again.');
            this.hideProgress();
        }
    }

    async loadPDFLib() {
        // Load pdf-lib from CDN if not already loaded
        if (window.PDFLib) {
            return window.PDFLib;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
            script.onload = () => resolve(window.PDFLib);
            script.onerror = () => reject(new Error('Failed to load PDF library'));
            document.head.appendChild(script);        });
    }

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);        });
    }    createDownloadLink(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `merged-pdf-${timestamp}.pdf`;
        
        // Update the existing download link
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            downloadLink.href = url;
            downloadLink.download = filename;
        }
        
        // Hide the action section (merge button)
        if (this.actionSection) {
            this.actionSection.style.display = 'none';
        }
        
        // Show the result section
        if (this.resultSection) {
            this.resultSection.style.display = 'block';
        }

        // Clean up URL after download
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    showProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'block';
        }
    }

    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
    }    hideDownload() {
        if (this.resultSection) {
            this.resultSection.style.display = 'none';
        }
    }

    updateProgress(percentage, text) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
    }

    showError(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Navigation function
function goBack() {
    window.location.href = 'index.html';
}

// Initialize the PDF merger when the page loads
let pdfMerger;
document.addEventListener('DOMContentLoaded', () => {
    pdfMerger = new PDFMerger();
});
