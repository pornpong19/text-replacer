class TextReplacerApp {
    constructor() {
        this.selectedFiles = [];
        this.selectedFolders = [];
        this.currentProfile = 'default';
        this.profiles = {
            'default': []
        };
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // File selection
        document.getElementById('selectFilesBtn').addEventListener('click', () => {
            this.selectFiles();
        });

        // Folder selection
        document.getElementById('selectFoldersBtn').addEventListener('click', () => {
            this.selectFolders();
        });

        // Add replacement rules
        document.getElementById('addReplaceBtn').addEventListener('click', () => {
            this.addReplaceRow();
        });

        document.getElementById('addDeleteBtn').addEventListener('click', () => {
            this.addDeleteRow();
        });

        // Process files
        document.getElementById('processReplaceBtn').addEventListener('click', () => {
            this.processFiles('replace');
        });

        document.getElementById('processDeleteBtn').addEventListener('click', () => {
            this.processFiles('delete');
        });

        document.getElementById('processAllBtn').addEventListener('click', () => {
            this.processFiles('all');
        });

        // Handle removal of rule rows
        this.setupRuleRowHandlers();

        // Setup drag and drop
        this.setupDragAndDrop();

        // Profile controls - delegate event for dynamic buttons
        document.getElementById('profileButtons').addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-btn')) {
                const profileName = e.target.dataset.profile;
                this.switchProfile(profileName);
            }
        });

        document.getElementById('newProfileBtn').addEventListener('click', () => {
            this.createNewProfile();
        });

        document.getElementById('renameProfileBtn').addEventListener('click', () => {
            this.renameProfile();
        });

        document.getElementById('deleteProfileBtn').addEventListener('click', () => {
            this.deleteProfile();
        });

        // Auto-save when rules change
        document.addEventListener('input', (e) => {
            if (e.target.matches('.rule-input')) {
                this.saveCurrentProfile();
                this.saveSettings();
            }
        });

        // Handle rule removal
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-rule')) {
                const ruleRow = e.target.closest('.rule-row');
                if (ruleRow) {
                    this.removeRule(ruleRow);
                }
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
                const btn = e.target.matches('.tab-btn') ? e.target : e.target.closest('.tab-btn');
                this.switchTab(btn.dataset.tab);
            }
        });

        // Text mode event listeners
        document.getElementById('convertReplaceBtn').addEventListener('click', () => {
            this.convertText('replace');
        });

        document.getElementById('convertDeleteBtn').addEventListener('click', () => {
            this.convertText('delete');
        });

        document.getElementById('convertAllBtn').addEventListener('click', () => {
            this.convertText('all');
        });

        document.getElementById('copyOutputBtn').addEventListener('click', () => {
            this.copyOutput();
        });

        document.getElementById('saveTextBtn').addEventListener('click', () => {
            this.saveTextFile();
        });

        // Text mode profile controls
        document.getElementById('textProfileButtons').addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-btn')) {
                const profileName = e.target.dataset.profile;
                this.switchProfile(profileName);
            }
        });

        document.getElementById('textNewProfileBtn').addEventListener('click', () => {
            this.createNewProfile();
        });

        document.getElementById('textRenameProfileBtn').addEventListener('click', () => {
            this.renameProfile();
        });

        document.getElementById('textDeleteProfileBtn').addEventListener('click', () => {
            this.deleteProfile();
        });

        // Export/Import preset controls - File mode
        document.getElementById('exportPresetBtn').addEventListener('click', () => {
            this.exportPresets();
        });

        document.getElementById('importPresetBtn').addEventListener('click', () => {
            this.importPresets();
        });

        // Export/Import preset controls - Text mode
        document.getElementById('textExportPresetBtn').addEventListener('click', () => {
            this.exportPresets();
        });

        document.getElementById('textImportPresetBtn').addEventListener('click', () => {
            this.importPresets();
        });
    }

    async selectFiles() {
        try {
            const files = await window.electronAPI.selectFiles();
            this.selectedFiles = files;

            // Clear folder selection when selecting individual files
            this.selectedFolders = [];
            document.getElementById('selectedFolders').innerHTML = '';

            this.displaySelectedFiles();
            this.updateProcessButton();
        } catch (error) {
            console.error('Error selecting files:', error);
            this.showError('เกิดข้อผิดพลาดในการเลือกไฟล์');
        }
    }

    displaySelectedFiles() {
        const container = document.getElementById('selectedFiles');

        if (this.selectedFiles.length === 0) {
            container.innerHTML = '';
            return;
        }

        const filesHtml = this.selectedFiles.map(filePath => `
            <div class="file-item">
                <svg class="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <span class="file-path">${filePath}</span>
            </div>
        `).join('');

        container.innerHTML = filesHtml;
    }

    async selectFolders() {
        try {
            const folders = await window.electronAPI.selectFolders();
            this.selectedFolders = folders;

            // Clear individual file selection when selecting folders
            this.selectedFiles = [];
            document.getElementById('selectedFiles').innerHTML = '';

            // Collect all files from all folders
            const allFiles = [];
            folders.forEach(folder => {
                allFiles.push(...folder.files);
            });
            this.selectedFiles = allFiles;

            this.displaySelectedFolders();
            this.updateProcessButton();
        } catch (error) {
            console.error('Error selecting folders:', error);
            this.showError('เกิดข้อผิดพลาดในการเลือกโฟลเดอร์');
        }
    }

    displaySelectedFolders() {
        const container = document.getElementById('selectedFolders');

        if (this.selectedFolders.length === 0) {
            container.innerHTML = '';
            return;
        }

        const foldersHtml = this.selectedFolders.map(folder => `
            <div class="folder-item">
                <svg class="folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="folder-name">${folder.folderName}</span>
                <span class="folder-file-count">(${folder.files.length} ไฟล์)</span>
            </div>
        `).join('');

        container.innerHTML = foldersHtml;
    }

    addReplaceRow(oldWord = '', newWord = '', shouldSave = true) {
        const container = document.getElementById('replaceList');
        const rowDiv = document.createElement('div');
        rowDiv.className = 'rule-row';
        rowDiv.dataset.type = 'replace';

        rowDiv.innerHTML = `
            <input type="text" class="rule-input" data-field="old" placeholder="คำเดิม" value="${oldWord}">
            <input type="text" class="rule-input" data-field="new" placeholder="คำใหม่" value="${newWord}">
            <button class="remove-rule" title="ลบกฎ">×</button>
        `;

        container.appendChild(rowDiv);
        this.setupRuleRowHandlers();

        // Focus on the old word input if it's a new empty row
        if (!oldWord && !newWord) {
            rowDiv.querySelector('input[data-field="old"]').focus();
        }

        // Save settings after adding new row
        if (shouldSave) {
            this.saveCurrentProfile();
            this.saveSettings();
        }

        return rowDiv;
    }

    addDeleteRow(word = '', shouldSave = true) {
        const container = document.getElementById('deleteList');
        const rowDiv = document.createElement('div');
        rowDiv.className = 'rule-row delete-row';
        rowDiv.dataset.type = 'delete';

        rowDiv.innerHTML = `
            <input type="text" class="rule-input" data-field="word" placeholder="คำที่จะลบ" value="${word}">
            <button class="remove-rule" title="ลบกฎ">×</button>
        `;

        container.appendChild(rowDiv);
        this.setupRuleRowHandlers();

        // Focus on the input if it's a new empty row
        if (!word) {
            rowDiv.querySelector('input').focus();
        }

        // Save settings after adding new row
        if (shouldSave) {
            this.saveCurrentProfile();
            this.saveSettings();
        }

        return rowDiv;
    }

    removeRule(ruleRow) {
        const container = ruleRow.parentElement;

        // Always allow removal, but ensure at least one empty row remains
        ruleRow.remove();

        // If this was the last row in the container, add a new empty one
        if (container.children.length === 0) {
            if (container.id === 'replaceList') {
                this.addReplaceRow('', '', false);
            } else if (container.id === 'deleteList') {
                this.addDeleteRow('', false);
            }
        }

        this.saveCurrentProfile();
        this.saveSettings();
        this.updateProcessButton();
    }

    setupRuleRowHandlers() {
        // Update process button when inputs change
        document.querySelectorAll('.rule-input').forEach(input => {
            input.removeEventListener('input', this.updateProcessButton);
            input.addEventListener('input', this.updateProcessButton.bind(this));
        });
    }

    getReplacements(mode = 'all') {
        const replacements = {};

        // Get replace rules
        if (mode === 'all' || mode === 'replace') {
            const replaceRows = document.querySelectorAll('#replaceList .rule-row');
            replaceRows.forEach(row => {
                const oldWord = row.querySelector('input[data-field="old"]').value.trim();
                const newWord = row.querySelector('input[data-field="new"]').value.trim();

                if (oldWord && newWord && oldWord !== newWord) {
                    // Check for replacement characters and warn user
                    if (oldWord.includes('�') || newWord.includes('�')) {
                        console.warn('Replacement contains invalid characters:', oldWord, '->', newWord);
                        return;
                    }
                    replacements[oldWord] = newWord;
                }
            });
        }

        // Get delete rules
        if (mode === 'all' || mode === 'delete') {
            const deleteRows = document.querySelectorAll('#deleteList .rule-row');
            deleteRows.forEach(row => {
                const word = row.querySelector('input[data-field="word"]').value.trim();

                if (word) {
                    // Check for replacement characters and warn user
                    if (word.includes('�')) {
                        console.warn('Delete word contains invalid characters:', word);
                        return;
                    }
                    replacements[word] = '';
                }
            });
        }

        return replacements;
    }

    updateProcessButton() {
        const hasFiles = this.selectedFiles.length > 0;
        const replaceReplacements = this.getReplacements('replace');
        const deleteReplacements = this.getReplacements('delete');
        const allReplacements = this.getReplacements('all');

        // Update individual buttons
        const processReplaceBtn = document.getElementById('processReplaceBtn');
        const processDeleteBtn = document.getElementById('processDeleteBtn');
        const processAllBtn = document.getElementById('processAllBtn');

        processReplaceBtn.disabled = !hasFiles || Object.keys(replaceReplacements).length === 0;
        processDeleteBtn.disabled = !hasFiles || Object.keys(deleteReplacements).length === 0;
        processAllBtn.disabled = !hasFiles || Object.keys(allReplacements).length === 0;
    }

    async processFiles(mode = 'all') {
        const replacements = this.getReplacements(mode);

        if (this.selectedFiles.length === 0) {
            this.showError('กรุณาเลือกไฟล์ก่อน');
            return;
        }

        if (Object.keys(replacements).length === 0) {
            let errorMsg = '';
            if (mode === 'replace') {
                errorMsg = 'กรุณาระบุกฎการแทนที่คำ';
            } else if (mode === 'delete') {
                errorMsg = 'กรุณาระบุคำที่จะลบ';
            } else {
                errorMsg = 'กรุณาระบุกฎการแทนที่หรือคำที่จะลบ';
            }
            this.showError(errorMsg);
            return;
        }

        // Get overwrite option
        const overwriteOriginal = document.getElementById('overwriteOriginal').checked;

        // Show processing indicator
        this.showProcessing(true);

        try {
            const data = {
                files: this.selectedFiles,
                replacements: replacements,
                overwrite_original: overwriteOriginal
            };

            const result = await window.electronAPI.processFiles(data);
            this.displayResults(result, mode);
        } catch (error) {
            console.error('Error processing files:', error);
            this.showError(`เกิดข้อผิดพลาดในการดำเนินการ: ${error.message}`);
        } finally {
            this.showProcessing(false);
        }
    }

    showProcessing(show) {
        const indicator = document.getElementById('processingIndicator');
        const processReplaceBtn = document.getElementById('processReplaceBtn');
        const processDeleteBtn = document.getElementById('processDeleteBtn');
        const processAllBtn = document.getElementById('processAllBtn');

        if (show) {
            indicator.classList.remove('hidden');
            processReplaceBtn.disabled = true;
            processDeleteBtn.disabled = true;
            processAllBtn.disabled = true;
        } else {
            indicator.classList.add('hidden');
            this.updateProcessButton();
        }
    }

    displayResults(result, mode = 'all') {
        const resultsSection = document.getElementById('resultsSection');
        const container = document.getElementById('resultsContainer');

        if (!result.success) {
            container.innerHTML = `
                <div class="result-item error">
                    <div class="result-file">ข้อผิดพลาด</div>
                    <div class="result-details">${result.error}</div>
                </div>
            `;
            resultsSection.classList.remove('hidden');
            return;
        }

        const resultsHtml = result.results.map(fileResult => {
            const isSuccess = fileResult.success;
            const statusClass = isSuccess ? 'success' : 'error';

            let detailsHtml = '';
            if (isSuccess) {
                if (fileResult.replacements.length > 0) {
                    detailsHtml = fileResult.replacements.map(rep => {
                        if (rep.operation === 'delete' || rep.new === '') {
                            return `<div class="replacement-detail">ลบ "${rep.old}" (${rep.count} ครั้ง)</div>`;
                        } else {
                            return `<div class="replacement-detail">แทนที่ "${rep.old}" → "${rep.new}" (${rep.count} ครั้ง)</div>`;
                        }
                    }).join('');
                } else {
                    detailsHtml = '<div class="replacement-detail">ไม่พบคำที่ต้องแทนที่หรือลบ</div>';
                }

                // Add file information
                if (fileResult.new_file) {
                    if (fileResult.overwritten) {
                        detailsHtml += `<div class="replacement-detail overwritten-info">✓ บันทึกทับไฟล์เดิมแล้ว</div>`;
                    } else {
                        detailsHtml += `<div class="replacement-detail new-file-info">ไฟล์ใหม่: ${fileResult.new_file}</div>`;
                    }
                }
            } else {
                detailsHtml = `<div class="replacement-detail">ข้อผิดพลาด: ${fileResult.error}</div>`;
            }

            return `
                <div class="result-item ${statusClass}">
                    <div class="result-file">${fileResult.file}</div>
                    <div class="result-details">${detailsHtml}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = resultsHtml;
        resultsSection.classList.remove('hidden');

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showError(message) {
        // Simple error display - you could enhance this with a proper modal
        const resultsSection = document.getElementById('resultsSection');
        const container = document.getElementById('resultsContainer');

        container.innerHTML = `
            <div class="result-item error">
                <div class="result-file">ข้อผิดพลาด</div>
                <div class="result-details">${message}</div>
            </div>
        `;
        resultsSection.classList.remove('hidden');
    }

    setupDragAndDrop() {
        const fileSelector = document.querySelector('.file-selector');
        const selectBtn = document.getElementById('selectFilesBtn');

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileSelector.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            fileSelector.addEventListener(eventName, () => {
                fileSelector.classList.add('drag-over');
                selectBtn.textContent = 'วางไฟล์ที่นี่';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileSelector.addEventListener(eventName, () => {
                fileSelector.classList.remove('drag-over');
                selectBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    เลือกไฟล์ .txt
                `;
            }, false);
        });

        // Handle dropped files
        fileSelector.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleDroppedFiles(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleDroppedFiles(files) {
        try {
            // Convert FileList to array of objects with path and name
            const fileItems = Array.from(files).map(file => ({
                path: file.path,
                name: file.name
            }));

            // Use IPC to safely get file paths
            const paths = await window.electronAPI.getFilePaths(fileItems);

            if (paths.length === 0) {
                this.showError('กรุณาเลือกเฉพาะไฟล์ .txt เท่านั้น');
                return;
            }

            this.selectedFiles = paths;
            this.displaySelectedFiles();
            this.updateProcessButton();
        } catch (error) {
            console.error('Error handling dropped files:', error);
            this.showError('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
        }
    }

    saveCurrentProfile() {
        const rules = [];

        // Save replace rules
        const replaceRows = document.querySelectorAll('#replaceList .rule-row');
        replaceRows.forEach(row => {
            const oldWord = row.querySelector('input[data-field="old"]').value.trim();
            const newWord = row.querySelector('input[data-field="new"]').value.trim();

            if (oldWord || newWord) {
                rules.push({
                    type: 'replace',
                    old: oldWord,
                    new: newWord
                });
            }
        });

        // Save delete rules
        const deleteRows = document.querySelectorAll('#deleteList .rule-row');
        deleteRows.forEach(row => {
            const word = row.querySelector('input[data-field="word"]').value.trim();

            if (word) {
                rules.push({
                    type: 'delete',
                    word: word
                });
            }
        });

        this.profiles[this.currentProfile] = rules;
    }

    saveSettings() {
        this.saveCurrentProfile();

        try {
            localStorage.setItem('textReplacer_settings', JSON.stringify({
                profiles: this.profiles,
                currentProfile: this.currentProfile,
                version: '2.0'
            }));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('textReplacer_settings');
            if (saved) {
                const settings = JSON.parse(saved);

                // Handle new format (v2.0)
                if (settings.profiles && settings.version === '2.0') {
                    this.profiles = settings.profiles;
                    this.currentProfile = settings.currentProfile || 'default';
                }
                // Migrate old format (v1.0)
                else if (settings.replacements && Array.isArray(settings.replacements)) {
                    this.profiles = {
                        'default': settings.replacements
                    };
                    this.currentProfile = 'default';
                }
                // No valid settings
                else {
                    this.profiles = {
                        'default': [{ old: 'เบาๆ', new: 'เบาเบา' }]
                    };
                    this.currentProfile = 'default';
                }
            } else {
                // No saved settings
                this.profiles = {
                    'default': [{ old: 'เบาๆ', new: 'เบาเบา' }]
                };
                this.currentProfile = 'default';
            }

            this.updateProfileButtons();
            this.loadCurrentProfile();
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Fallback to default
            this.profiles = {
                'default': [{ old: 'เบาๆ', new: 'เบาเบา' }]
            };
            this.currentProfile = 'default';
            this.updateProfileButtons();
            this.loadCurrentProfile();
        }
    }

    updateProfileButtons() {
        // Update file mode profile buttons
        const fileContainer = document.getElementById('profileButtons');
        fileContainer.innerHTML = '';

        Object.keys(this.profiles).forEach(profileName => {
            const button = document.createElement('button');
            button.className = 'profile-btn';
            button.dataset.profile = profileName;
            button.textContent = profileName === 'default' ? 'โปรไฟล์หลัก' : profileName;

            if (profileName === this.currentProfile) {
                button.classList.add('active');
            }

            fileContainer.appendChild(button);
        });

        // Update text mode profile buttons
        const textContainer = document.getElementById('textProfileButtons');
        textContainer.innerHTML = '';

        Object.keys(this.profiles).forEach(profileName => {
            const button = document.createElement('button');
            button.className = 'profile-btn';
            button.dataset.profile = profileName;
            button.textContent = profileName === 'default' ? 'โปรไฟล์หลัก' : profileName;

            if (profileName === this.currentProfile) {
                button.classList.add('active');
            }

            textContainer.appendChild(button);
        });
    }

    loadCurrentProfile() {
        // Clear both containers
        document.getElementById('replaceList').innerHTML = '';
        document.getElementById('deleteList').innerHTML = '';

        const rules = this.profiles[this.currentProfile] || [];

        if (rules.length === 0) {
            // Add default example
            this.addReplaceRow('เบาๆ', 'เบาเบา', false);
        } else {
            // Load rules based on new format
            const isNewFormat = rules.some(rule => rule.type);

            if (isNewFormat) {
                // New format with separate replace and delete rules
                rules.forEach(rule => {
                    if (rule.type === 'replace') {
                        this.addReplaceRow(rule.old || '', rule.new || '', false);
                    } else if (rule.type === 'delete') {
                        this.addDeleteRow(rule.word || '', false);
                    }
                });
            } else {
                // Old format - migrate
                rules.forEach(rule => {
                    if (rule.ruleType === 'delete' || rule.new === '') {
                        this.addDeleteRow(rule.old || '', false);
                    } else {
                        this.addReplaceRow(rule.old || '', rule.new || '', false);
                    }
                });
            }
        }

        // Ensure we have at least one row in each section
        if (document.getElementById('replaceList').children.length === 0) {
            this.addReplaceRow('', '', false);
        }
        if (document.getElementById('deleteList').children.length === 0) {
            this.addDeleteRow('', false);
        }
    }

    switchProfile(profileName) {
        if (this.profiles[profileName]) {
            this.saveCurrentProfile();
            this.currentProfile = profileName;
            this.updateProfileButtons();
            this.loadCurrentProfile();
            this.saveSettings();
        }
    }

    createNewProfile() {
        this.showInputDialog('ชื่อโปรไฟล์ใหม่:', '', (profileName) => {
            if (profileName && profileName.trim()) {
                const name = profileName.trim();

                if (this.profiles[name]) {
                    alert('ชื่อโปรไฟล์นี้มีอยู่แล้ว');
                    return;
                }

                // Save current profile before switching
                this.saveCurrentProfile();

                // Create new profile with current replacements as template
                this.profiles[name] = [...this.profiles[this.currentProfile]];
                this.currentProfile = name;

                this.updateProfileButtons();
                this.loadCurrentProfile();
                this.saveSettings();
            }
        });
    }

    renameProfile() {
        if (this.currentProfile === 'default') {
            alert('ไม่สามารถเปลี่ยนชื่อโปรไฟล์หลักได้');
            return;
        }

        this.showInputDialog('ชื่อใหม่:', this.currentProfile, (newName) => {
            if (newName && newName.trim() && newName.trim() !== this.currentProfile) {
                const name = newName.trim();

                if (this.profiles[name]) {
                    alert('ชื่อโปรไฟล์นี้มีอยู่แล้ว');
                    return;
                }

                // Rename profile
                this.profiles[name] = this.profiles[this.currentProfile];
                delete this.profiles[this.currentProfile];
                this.currentProfile = name;

                this.updateProfileButtons();
                this.saveSettings();
            }
        });
    }

    deleteProfile() {
        if (this.currentProfile === 'default') {
            alert('ไม่สามารถลบโปรไฟล์หลักได้');
            return;
        }

        if (Object.keys(this.profiles).length <= 1) {
            alert('ต้องมีโปรไฟล์อย่างน้อย 1 อัน');
            return;
        }

        if (confirm(`ต้องการลบโปรไฟล์ "${this.currentProfile}" หรือไม่?`)) {
            delete this.profiles[this.currentProfile];
            this.currentProfile = 'default';

            this.updateProfileButtons();
            this.loadCurrentProfile();
            this.saveSettings();
        }
    }

    showInputDialog(message, defaultValue = '', callback) {
        // Create modal dialog
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'margin-bottom: 20px; font-size: 16px; color: #333;';
        messageDiv.textContent = message;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'dialogInput';
        input.value = defaultValue;
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 20px;
            box-sizing: border-box;
            outline: none;
            font-family: inherit;
        `;

        const buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'dialogCancel';
        cancelBtn.textContent = 'ยกเลิก';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 2px solid #ccc;
            background: white;
            color: #666;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
        `;

        const okBtn = document.createElement('button');
        okBtn.id = 'dialogOk';
        okBtn.textContent = 'ตกลง';
        okBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            background: #ff8c00;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
        `;

        buttonDiv.appendChild(cancelBtn);
        buttonDiv.appendChild(okBtn);

        dialog.appendChild(messageDiv);
        dialog.appendChild(input);
        dialog.appendChild(buttonDiv);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Elements are already created above

        // Use setTimeout to ensure element is rendered before focusing
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);

        const handleOk = () => {
            const value = input.value.trim();
            document.body.removeChild(overlay);
            callback(value);
        };

        const handleCancel = () => {
            document.body.removeChild(overlay);
            callback(null);
        };

        okBtn.onclick = handleOk;
        cancelBtn.onclick = handleCancel;

        input.onkeydown = (e) => {
            if (e.key === 'Enter') handleOk();
            if (e.key === 'Escape') handleCancel();
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) handleCancel();
        };
    }

    // Tab switching functionality
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
    }

    // Text conversion functionality
    convertText(mode = 'all') {
        const inputText = document.getElementById('inputText').value;
        if (!inputText.trim()) {
            alert('กรุณาใส่ข้อความที่ต้องการแปลง');
            return;
        }

        let outputText = inputText;
        const rules = this.profiles[this.currentProfile] || [];

        // Filter rules based on mode
        rules.forEach(rule => {
            if (mode === 'replace' || mode === 'all') {
                if (rule.type === 'replace' && rule.old && rule.new && rule.old !== rule.new) {
                    // Replace with new word
                    outputText = outputText.replaceAll(rule.old, rule.new);
                } else if (!rule.type && rule.old && rule.new && rule.old !== rule.new) {
                    // Handle old format replace
                    outputText = outputText.replaceAll(rule.old, rule.new);
                }
            }

            if (mode === 'delete' || mode === 'all') {
                if (rule.type === 'delete' && rule.word) {
                    // Delete the word by replacing with empty string
                    outputText = outputText.replaceAll(rule.word, '');
                } else if (!rule.type && rule.ruleType === 'delete' && rule.old) {
                    // Handle old format delete
                    outputText = outputText.replaceAll(rule.old, '');
                }
            }
        });

        document.getElementById('outputText').value = outputText;

        // Enable copy and save buttons
        document.getElementById('copyOutputBtn').disabled = false;
        document.getElementById('saveTextBtn').disabled = false;
    }

    // Copy output text to clipboard
    async copyOutput() {
        const outputText = document.getElementById('outputText').value;
        if (!outputText) {
            alert('ไม่มีข้อความให้คัดลอก');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputText);

            // Show temporary success feedback
            const btn = document.getElementById('copyOutputBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                คัดลอกแล้ว
            `;
            btn.style.background = '#28a745';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (err) {
            alert('ไม่สามารถคัดลอกได้: ' + err.message);
        }
    }

    // Save text to file
    saveTextFile() {
        const outputText = document.getElementById('outputText').value;
        if (!outputText) {
            alert('ไม่มีข้อความให้บันทึก');
            return;
        }

        // Create downloadable file
        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `text_converted_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success feedback
        const btn = document.getElementById('saveTextBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            บันทึกแล้ว
        `;
        btn.style.background = '#28a745';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }

    // Export presets to file
    async exportPresets() {
        try {
            // Save current profile before exporting
            this.saveCurrentProfile();

            // Get file path from save dialog
            const filePath = await window.electronAPI.savePresetDialog();

            if (!filePath) {
                return; // User cancelled
            }

            // Prepare export data
            const exportData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                profiles: this.profiles,
                currentProfile: this.currentProfile
            };

            // Write to file
            const result = await window.electronAPI.writePresetFile(
                filePath,
                JSON.stringify(exportData, null, 2)
            );

            if (result.success) {
                alert('ส่งออก Preset สำเร็จ!');
            } else {
                alert('เกิดข้อผิดพลาดในการส่งออก: ' + result.error);
            }
        } catch (error) {
            console.error('Error exporting presets:', error);
            alert('เกิดข้อผิดพลาดในการส่งออก: ' + error.message);
        }
    }

    // Import presets from file
    async importPresets() {
        try {
            // Get file path from open dialog
            const filePath = await window.electronAPI.openPresetDialog();

            if (!filePath) {
                return; // User cancelled
            }

            // Read file content
            const result = await window.electronAPI.readPresetFile(filePath);

            if (!result.success) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + result.error);
                return;
            }

            // Parse JSON
            let importData;
            try {
                importData = JSON.parse(result.content);
            } catch (error) {
                alert('ไฟล์ไม่ถูกต้อง: ไม่สามารถอ่าน JSON ได้');
                return;
            }

            // Validate import data
            if (!importData.profiles || typeof importData.profiles !== 'object') {
                alert('ไฟล์ไม่ถูกต้อง: ไม่พบข้อมูล profiles');
                return;
            }

            // Ask user for import mode
            const importMode = confirm(
                'คุณต้องการรวม Preset เข้ากับที่มีอยู่ (OK) หรือแทนที่ทั้งหมด (Cancel)?'
            );

            if (importMode) {
                // Merge mode
                Object.keys(importData.profiles).forEach(profileName => {
                    if (this.profiles[profileName]) {
                        // Profile already exists, ask to overwrite
                        const overwrite = confirm(
                            `โปรไฟล์ "${profileName}" มีอยู่แล้ว คุณต้องการแทนที่หรือไม่?`
                        );
                        if (overwrite) {
                            this.profiles[profileName] = importData.profiles[profileName];
                        }
                    } else {
                        // New profile, just add it
                        this.profiles[profileName] = importData.profiles[profileName];
                    }
                });
            } else {
                // Replace mode
                const confirmReplace = confirm(
                    'คุณแน่ใจหรือไม่ว่าต้องการลบ Preset ทั้งหมดและแทนที่ด้วยไฟล์ที่นำเข้า?'
                );
                if (!confirmReplace) {
                    return;
                }
                this.profiles = importData.profiles;
                this.currentProfile = importData.currentProfile || 'default';

                // Ensure default profile exists
                if (!this.profiles['default']) {
                    this.profiles['default'] = [];
                }
            }

            // Update UI
            this.updateProfileButtons();
            this.loadCurrentProfile();
            this.saveSettings();

            alert('นำเข้า Preset สำเร็จ!');
        } catch (error) {
            console.error('Error importing presets:', error);
            alert('เกิดข้อผิดพลาดในการนำเข้า: ' + error.message);
        }
    }

}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextReplacerApp();
});