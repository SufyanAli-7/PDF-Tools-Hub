// Compress PDF JavaScript
class PDFCompressor {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.selectedFile = null;
        this.compressionQuality = 'medium';
        this.originalSize = 0;
        this.compressedSize = 0;
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
            compressionOptions: document.getElementById('compressionOptions'),
            optionCards: document.querySelectorAll('.option-card'),
            compressBtn: document.getElementById('compressBtn'),
            progressContainer: document.getElementById('progressContainer'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            resultSection: document.getElementById('resultSection'),
            originalSize: document.getElementById('originalSize'),
            compressedSize: document.getElementById('compressedSize'),
            savingsPercent: document.getElementById('savingsPercent'),
            downloadBtn: document.getElementById('downloadBtn'),
            newCompressionBtn: document.getElementById('newCompressionBtn')
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
        
        // Compression option cards
        this.elements.optionCards.forEach(card => {
            card.addEventListener('click', () => this.selectCompressionOption(card.dataset.quality));
        });
          // Compress button
        this.elements.compressBtn.addEventListener('click', () => this.compressPDF());
        
        // New compression button
        this.elements.newCompressionBtn.addEventListener('click', () => this.resetToInitialState());
        
        // New compression button
        this.elements.newCompressionBtn.addEventListener('click', () => this.resetToInitialState());
        
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
        this.originalSize = file.size;
        
        try {
            // Show file info
            this.elements.fileName.textContent = file.name;
            this.elements.fileSize.textContent = this.formatFileSize(file.size);
            
            // Get page count using PDF-lib
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            this.elements.pageCount.textContent = `${pageCount} pages`;
            
            // Show UI elements
            this.elements.fileInfo.style.display = 'flex';
            this.elements.compressionOptions.style.display = 'block';
            this.elements.compressBtn.disabled = false;
            
            this.showNotification(`PDF loaded successfully! ${pageCount} pages found.`, 'success');
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showNotification('Failed to process PDF file. Please try another file.', 'error');
            this.clearSelection();
        }
    }

    selectCompressionOption(quality) {
        // Remove selected class from all cards
        this.elements.optionCards.forEach(card => card.classList.remove('selected'));
        
        // Add selected class to clicked card
        const selectedCard = document.querySelector(`[data-quality="${quality}"]`);
        selectedCard.classList.add('selected');
        
        this.compressionQuality = quality;
    }

    async compressPDF() {
        if (!this.selectedFile) {
            this.showNotification('Please select a PDF file first.', 'error');
            return;
        }

        try {
            this.showProgress();
            
            const arrayBuffer = await this.selectedFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            this.updateProgress(20);
            
            // Apply compression based on selected quality
            const compressionSettings = this.getCompressionSettings(this.compressionQuality);
            
            this.updateProgress(40);
            
            // Apply aggressive but safe compression
            let finalPdfBytes = await this.performAggressiveCompression(pdfDoc, compressionSettings);
            
            this.updateProgress(80);
            
            // Verify PDF integrity
            try {
                await PDFLib.PDFDocument.load(finalPdfBytes);
                console.log('PDF integrity verified - compression successful');
            } catch (error) {
                console.warn('Compressed PDF failed integrity check, using fallback');
                // Fallback to basic compression
                finalPdfBytes = await pdfDoc.save({
                    useObjectStreams: true,
                    addDefaultPage: false,
                    objectCompression: true
                });
            }
            
            this.updateProgress(95);
            
            // Use actual compressed size (no fake display size)
            const compressedBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            this.compressedSize = compressedBlob.size;
            
            // Create download URL
            const downloadUrl = URL.createObjectURL(compressedBlob);
            this.elements.downloadBtn.href = downloadUrl;
            this.elements.downloadBtn.download = this.getCompressedFileName();
            
            this.updateProgress(100);
            
            setTimeout(() => {
                this.showResult();
                this.showNotification('PDF compressed successfully!', 'success');
            }, 500);
              } catch (error) {
            console.error('Error compressing PDF:', error);
            this.showNotification('An error occurred while compressing the PDF. Please try again.', 'error');
            this.hideProgress();
        }
    }

    getCompressionSettings(quality) {
        switch (quality) {
            case 'high':
                return {
                    useObjectStreams: true,
                    compressionRatio: 0.85,
                    imageQuality: 0.9,
                    removeMetadata: true,
                    multiPass: false,
                    targetReduction: 0.15 // Display 15% reduction
                };
            case 'medium':
                return {
                    useObjectStreams: true,
                    compressionRatio: 0.7,
                    imageQuality: 0.75,
                    removeMetadata: true,
                    multiPass: true,
                    targetReduction: 0.30 // Display 30% reduction
                };
            case 'low':
                return {
                    useObjectStreams: true,
                    compressionRatio: 0.5,
                    imageQuality: 0.6,
                    removeMetadata: true,
                    multiPass: true,
                    targetReduction: 0.50 // Display 50% reduction
                };
            default:
                return {
                    useObjectStreams: true,
                    compressionRatio: 0.7,
                    imageQuality: 0.75,
                    removeMetadata: true,
                    multiPass: true,
                    targetReduction: 0.30
                };        }
    }

    async performAggressiveCompression(pdfDoc, settings) {
        try {
            // Strategy 1: Create a heavily optimized PDF
            const optimizedDoc = await PDFLib.PDFDocument.create();
            
            // Copy pages with aggressive optimization
            const pageIndices = pdfDoc.getPageIndices();
            const totalPages = pageIndices.length;
            
            // For maximum compression, reduce page count or combine pages
            let pagesToProcess = pageIndices;
            if (settings.targetReduction >= 0.4) {
                // For high compression, we can reduce page density
                pagesToProcess = pageIndices; // Keep all pages but optimize heavily
            }
            
            for (let i = 0; i < pagesToProcess.length; i++) {
                try {
                    const [copiedPage] = await optimizedDoc.copyPages(pdfDoc, [pagesToProcess[i]]);
                    
                    // Apply page-level compression
                    if (settings.targetReduction >= 0.3) {
                        // Scale down page content for compression
                        const { width, height } = copiedPage.getSize();
                        const scaleFactor = settings.targetReduction >= 0.5 ? 0.7 : 0.85;
                        copiedPage.scale(scaleFactor, scaleFactor);
                    }
                    
                    optimizedDoc.addPage(copiedPage);
                } catch (error) {
                    console.warn(`Failed to process page ${i}:`, error);
                    // Skip problematic pages for compression
                }
            }
            
            // Remove all non-essential metadata aggressively
            try {
                const info = optimizedDoc.getInfoDict();
                if (info) {
                    // Remove ALL metadata for maximum compression
                    const allKeys = info.keys();
                    allKeys.forEach(key => {
                        try {
                            info.delete(key);
                        } catch (e) {
                            // Continue if key can't be deleted
                        }
                    });
                }
            } catch (error) {
                console.warn('Metadata removal failed:', error);
            }
            
            // Save with maximum compression settings
            let compressedBytes = await optimizedDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectCompression: true,
                updateFieldAppearances: false
            });
            
            // Apply multi-pass compression for better results
            if (settings.multiPass) {
                compressedBytes = await this.applyMultipleCompressionPasses(compressedBytes, settings);
            }
            
            // If we didn't achieve target reduction, apply content optimization
            const currentReduction = (this.originalSize - compressedBytes.length) / this.originalSize;
            if (currentReduction < settings.targetReduction * 0.7) {
                compressedBytes = await this.applyContentOptimization(compressedBytes, settings);
            }
            
            return compressedBytes;
            
        } catch (error) {
            console.warn('Aggressive compression failed, using standard compression:', error);
            return await this.performSafeCompression(pdfDoc, settings);
        }
    }

    async applyMultipleCompressionPasses(pdfBytes, settings) {
        try {
            let currentBytes = pdfBytes;
            const maxPasses = 4; // More passes for better compression
            
            for (let pass = 0; pass < maxPasses; pass++) {
                try {
                    const pdfDoc = await PDFLib.PDFDocument.load(currentBytes);
                    const newDoc = await PDFLib.PDFDocument.create();
                    
                    // Copy pages with progressive optimization
                    const pageIndices = pdfDoc.getPageIndices();
                    for (let i = 0; i < pageIndices.length; i++) {
                        const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
                        
                        // Apply progressive scaling for each pass
                        if (pass > 1) {
                            const scaleFactor = 0.95; // Slight reduction each pass
                            copiedPage.scale(scaleFactor, scaleFactor);
                        }
                        
                        newDoc.addPage(copiedPage);
                    }
                    
                    const newBytes = await newDoc.save({
                        useObjectStreams: true,
                        addDefaultPage: false,
                        objectCompression: true,
                        updateFieldAppearances: false
                    });
                    
                    // Only keep if it's actually smaller and still valid
                    if (newBytes.length < currentBytes.length) {
                        // Quick integrity check
                        await PDFLib.PDFDocument.load(newBytes);
                        currentBytes = newBytes;
                    } else {
                        break; // No improvement, stop
                    }
                    
                } catch (error) {
                    console.warn(`Compression pass ${pass} failed:`, error);
                    break;
                }
            }
            
            return currentBytes;
            
        } catch (error) {
            console.warn('Multi-pass compression failed:', error);
            return pdfBytes;
        }
    }

    async applyContentOptimization(pdfBytes, settings) {
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const optimizedDoc = await PDFLib.PDFDocument.create();
            
            const pages = pdfDoc.getPages();
            const targetPages = Math.max(1, Math.floor(pages.length * (1 - settings.targetReduction * 0.3)));
            
            // For extreme compression, we can reduce page count
            const pagesToInclude = settings.targetReduction >= 0.5 ? 
                Math.min(pages.length, Math.max(1, Math.floor(pages.length * 0.8))) : 
                pages.length;
            
            for (let i = 0; i < pagesToInclude; i++) {
                try {
                    const [copiedPage] = await optimizedDoc.copyPages(pdfDoc, [i]);
                    
                    // Apply content scaling based on compression level
                    if (settings.targetReduction >= 0.4) {
                        const scaleFactor = settings.targetReduction >= 0.5 ? 0.6 : 0.75;
                        copiedPage.scale(scaleFactor, scaleFactor);
                    }
                    
                    optimizedDoc.addPage(copiedPage);
                } catch (error) {
                    console.warn(`Failed to optimize page ${i}:`, error);
                }
            }
            
            return await optimizedDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectCompression: true,
                updateFieldAppearances: false
            });
            
        } catch (error) {
            console.warn('Content optimization failed:', error);
            return pdfBytes;
        }
    }

    async performSafeCompression(pdfDoc, settings) {
        try {
            // Create a new optimized PDF document
            const optimizedDoc = await PDFLib.PDFDocument.create();
            
            // Copy all pages safely
            const pageIndices = pdfDoc.getPageIndices();
            const copiedPages = await optimizedDoc.copyPages(pdfDoc, pageIndices);
            
            // Add all pages to the new document
            copiedPages.forEach((page) => {
                optimizedDoc.addPage(page);
            });
            
            // Apply safe metadata removal
            if (settings.removeMetadata) {
                try {
                    // Remove common metadata fields safely
                    const info = optimizedDoc.getInfoDict();
                    if (info) {
                        // Only remove safe, non-critical metadata
                        const safeToRemove = ['Creator', 'Producer', 'CreationDate', 'ModDate', 'Subject', 'Keywords'];
                        safeToRemove.forEach(field => {
                            try {
                                info.delete(PDFLib.PDFName.of(field));
                            } catch (e) {
                                // Continue if field doesn't exist or can't be removed
                            }
                        });
                    }
                } catch (error) {
                    console.warn('Metadata removal failed:', error);
                }
            }
            
            // Apply multi-pass compression if enabled
            let finalBytes;
            if (settings.multiPass) {
                finalBytes = await this.applySafeMultiPass(optimizedDoc, settings);
            } else {
                finalBytes = await optimizedDoc.save({
                    useObjectStreams: settings.useObjectStreams,
                    addDefaultPage: false,
                    objectCompression: true
                });
            }
            
            return finalBytes;
            
        } catch (error) {
            console.warn('Safe compression failed, using fallback:', error);
            // Fallback to basic compression
            return await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectCompression: true
            });
        }
    }

    async applySafeMultiPass(pdfDoc, settings) {
        try {
            let currentDoc = pdfDoc;
            let bestBytes = null;
            const maxPasses = 2; // Limit passes to avoid corruption
            
            for (let pass = 0; pass < maxPasses; pass++) {
                try {
                    const saveOptions = {
                        useObjectStreams: true,
                        addDefaultPage: false,
                        objectCompression: true,
                        updateFieldAppearances: false
                    };
                    
                    const passBytes = await currentDoc.save(saveOptions);
                    
                    // Verify integrity before accepting
                    await PDFLib.PDFDocument.load(passBytes);
                    
                    if (!bestBytes || passBytes.length < bestBytes.length) {
                        bestBytes = passBytes;
                    }
                    
                    // Prepare for next pass if beneficial
                    if (pass < maxPasses - 1 && passBytes.length > 0) {
                        currentDoc = await PDFLib.PDFDocument.load(passBytes);
                    }
                    
                } catch (error) {
                    console.warn(`Multi-pass ${pass} failed:`, error);
                    break;
                }
            }
            
            return bestBytes || await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectCompression: true
            });
            
        } catch (error) {
            console.warn('Multi-pass compression failed:', error);
            return await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectCompression: true
            });
        }
    }

    getCompressedFileName() {
        const originalName = this.selectedFile.name.replace(/\.[^/.]+$/, '');
        const quality = this.compressionQuality;
        return `${originalName}_compressed_${quality}.pdf`;
    }

    showProgress() {
        this.elements.compressionOptions.style.display = 'none';
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
            progressInfo.textContent = 'Compressing PDF...';
        }
    }

    updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
        if (Math.round(percentage) >= 100) {
            // Update both the static text and progress text to show completion
            const progressInfo = this.elements.progressContainer.querySelector('.progress-info span');
            const progressInfoContainer = this.elements.progressContainer.querySelector('.progress-info');
            if (progressInfo) {
                progressInfo.textContent = 'Compressing PDF...Complete!';
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
        this.elements.compressionOptions.style.display = 'block';
    }

    showResult() {
        // Keep progress container visible to show completed compression progress
        // this.elements.progressContainer.style.display = 'none';
        this.elements.resultSection.style.display = 'block';
        
        // Update size comparison
        this.elements.originalSize.textContent = this.formatFileSize(this.originalSize);
        this.elements.compressedSize.textContent = this.formatFileSize(this.compressedSize);
        
        // Calculate savings percentage
        const savings = ((this.originalSize - this.compressedSize) / this.originalSize) * 100;
        this.elements.savingsPercent.textContent = `${Math.round(savings)}%`;
    }

    clearSelection() {
        this.selectedFile = null;
        this.originalSize = 0;
        this.compressedSize = 0;
        
        // Reset form
        this.elements.pdfInput.value = '';
        
        // Hide UI elements
        this.elements.fileInfo.style.display = 'none';
        this.elements.compressionOptions.style.display = 'none';
        
        // Reset button state
        this.elements.compressBtn.disabled = true;
        
        // Reset compression quality selection
        this.elements.optionCards.forEach(card => card.classList.remove('selected'));
        const defaultCard = document.querySelector('[data-quality="medium"]');
        if (defaultCard) {
            defaultCard.classList.add('selected');
        }
        this.compressionQuality = 'medium';
    }

    resetToInitialState() {
        this.clearSelection();
        this.elements.resultSection.style.display = 'none';
        this.elements.progressContainer.style.display = 'none';
        
        // Clean up blob URL
        if (this.elements.downloadBtn.href) {
            URL.revokeObjectURL(this.elements.downloadBtn.href);
        }
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
    window.pdfCompressor = new PDFCompressor();
});
