/**
 * ===================== 增强上传系统 v2.0 =====================
 * 基于UI优化工作流程 - 阶段1：优化数据导入流程界面
 */

class EnhancedUpload {
  constructor(containerSelector = '.upload-container') {
    this.container = document.querySelector(containerSelector);
    this.files = [];
    this.validationResults = null;
    this.uploadProgress = {};
    
    this.supportedTypes = [
      '.xlsx', '.xls', '.csv'
    ];
    
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxFiles = 10;
    
    if (this.container) {
      this.init();
    }
  }

  init() {
    this.createUploadInterface();
    this.bindEvents();
  }

  createUploadInterface() {
    this.container.innerHTML = `
      <div class="drag-drop-area" id="dragDropArea">
        <div class="upload-icon">
          <span data-icon="upload-cloud" data-icon-size="2xl" data-icon-class="icon-upload-cloud"></span>
        </div>
        <div class="upload-text">
          <h3 class="upload-title">拖拽文件到此处</h3>
          <p class="upload-subtitle">或者点击下方按钮选择文件</p>
          <button type="button" class="file-select-btn" id="fileSelectBtn">
            <span data-icon="upload" data-icon-size="sm"></span>
            选择Excel文件
          </button>
          <p class="upload-hint">
            支持 .xlsx, .xls, .csv 格式，最大 50MB，最多 ${this.maxFiles} 个文件
          </p>
        </div>
        <input type="file" id="fileInput" class="file-input" multiple 
               accept=".xlsx,.xls,.csv" aria-label="选择Excel文件">
      </div>

      <div class="files-preview" id="filesPreview">
        <h4 class="files-preview-title">
          <span data-icon="file-text" data-icon-size="base"></span>
          已选择的文件
        </h4>
        <div id="filesList"></div>
      </div>

      <div class="upload-progress" id="uploadProgress">
        <div id="progressList"></div>
      </div>

      <div class="validation-results" id="validationResults">
        <div class="validation-summary" id="validationSummary"></div>
        <div class="validation-errors" id="validationErrors" style="display: none;">
          <h4 class="errors-title">
            <span data-icon="alert-triangle" data-icon-size="base" data-icon-class="icon-warning"></span>
            需要修复的问题
          </h4>
          <div id="errorsList"></div>
        </div>
      </div>

      <div class="import-actions" id="importActions" style="display: none;">
        <div class="import-options">
          <label class="import-checkbox">
            <input type="checkbox" id="skipErrors" checked>
            跳过错误数据，仅导入有效数据
          </label>
          <label class="import-checkbox">
            <input type="checkbox" id="createBackup" checked>
            导入前创建数据备份
          </label>
        </div>
        <div class="import-buttons">
          <button type="button" class="import-btn secondary" id="cancelImport">
            <span data-icon="x" data-icon-size="sm"></span>
            取消
          </button>
          <button type="button" class="import-btn primary" id="startImport">
            <span data-icon="download" data-icon-size="sm"></span>
            开始导入
          </button>
        </div>
      </div>
    `;

    // 初始化图标
    if (window.IconLibrary) {
      window.IconLibrary.replaceIcons(this.container);
    }
  }

  bindEvents() {
    const dragDropArea = this.container.querySelector('#dragDropArea');
    const fileInput = this.container.querySelector('#fileInput');
    const fileSelectBtn = this.container.querySelector('#fileSelectBtn');

    // 拖拽事件
    dragDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragDropArea.classList.add('dragover');
    });

    dragDropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!dragDropArea.contains(e.relatedTarget)) {
        dragDropArea.classList.remove('dragover');
      }
    });

    dragDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dragDropArea.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    // 点击选择文件
    dragDropArea.addEventListener('click', () => {
      fileInput.click();
    });

    fileSelectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // 导入操作事件
    const startImportBtn = this.container.querySelector('#startImport');
    const cancelImportBtn = this.container.querySelector('#cancelImport');

    if (startImportBtn) {
      startImportBtn.addEventListener('click', () => {
        this.startImport();
      });
    }

    if (cancelImportBtn) {
      cancelImportBtn.addEventListener('click', () => {
        this.cancelImport();
      });
    }
  }

  /**
   * 处理文件选择
   */
  handleFiles(files) {
    const fileArray = Array.from(files);
    
    // 验证文件数量
    if (this.files.length + fileArray.length > this.maxFiles) {
      this.showError(`最多只能选择 ${this.maxFiles} 个文件`);
      return;
    }

    // 验证每个文件
    const validFiles = [];
    fileArray.forEach(file => {
      if (this.validateFile(file)) {
        validFiles.push({
          file,
          id: this.generateFileId(),
          size: file.size,
          type: file.type,
          name: file.name
        });
      }
    });

    if (validFiles.length > 0) {
      this.files.push(...validFiles);
      this.updateFilesDisplay();
      this.startValidation();
    }
  }

  /**
   * 验证单个文件
   */
  validateFile(file) {
    // 检查文件类型
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.supportedTypes.includes(fileExtension)) {
      this.showError(`不支持的文件格式: ${file.name}。请选择 Excel 或 CSV 文件。`);
      return false;
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      this.showError(`文件过大: ${file.name}。最大支持 50MB。`);
      return false;
    }

    // 检查重复文件
    if (this.files.some(f => f.name === file.name && f.size === file.size)) {
      this.showError(`文件已存在: ${file.name}`);
      return false;
    }

    return true;
  }

  /**
   * 更新文件列表显示
   */
  updateFilesDisplay() {
    const filesPreview = this.container.querySelector('#filesPreview');
    const filesList = this.container.querySelector('#filesList');

    if (this.files.length === 0) {
      filesPreview.classList.remove('show');
      return;
    }

    filesPreview.classList.add('show');
    
    filesList.innerHTML = this.files.map(fileObj => `
      <div class="file-item" data-file-id="${fileObj.id}">
        <div class="file-info">
          <div class="file-icon">
            <span data-icon="file-text" data-icon-size="lg" data-icon-class="icon-file-text"></span>
          </div>
          <div class="file-details">
            <div class="file-name">${fileObj.name}</div>
            <div class="file-meta">
              <div class="file-size">
                <span data-icon="info" data-icon-size="xs"></span>
                ${this.formatFileSize(fileObj.size)}
              </div>
              <div class="file-type">
                <span data-icon="file-text" data-icon-size="xs"></span>
                ${fileObj.file.type || '未知类型'}
              </div>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <button class="file-remove-btn" onclick="enhancedUpload.removeFile('${fileObj.id}')" 
                  title="移除文件">
            <span data-icon="x" data-icon-size="sm"></span>
          </button>
        </div>
      </div>
    `).join('');

    // 更新图标
    if (window.IconLibrary) {
      window.IconLibrary.replaceIcons(filesList);
    }
  }

  /**
   * 移除文件
   */
  removeFile(fileId) {
    this.files = this.files.filter(f => f.id !== fileId);
    this.updateFilesDisplay();
    
    if (this.files.length === 0) {
      this.hideValidationResults();
      this.hideImportActions();
    } else {
      this.startValidation();
    }
  }

  /**
   * 开始验证
   */
  async startValidation() {
    if (this.files.length === 0) return;

    this.showProgress('正在验证文件...');

    try {
      // 模拟验证过程
      await this.simulateProgress();
      
      // 调用后端验证API
      const validationResults = await this.validateFiles();
      
      this.validationResults = validationResults;
      this.showValidationResults(validationResults);
      this.showImportActions();
      
    } catch (error) {
      console.error('文件验证失败:', error);
      this.showError('文件验证失败，请检查文件格式是否正确');
    } finally {
      this.hideProgress();
    }
  }

  /**
   * 验证文件内容
   */
  async validateFiles() {
    // 这里应该调用后端API进行实际验证
    // 暂时返回模拟数据
    
    if (window.electronAPI && window.electronAPI.validateExcelFiles) {
      const fileData = await Promise.all(
        this.files.map(async fileObj => ({
          name: fileObj.name,
          data: await this.readFileAsArrayBuffer(fileObj.file)
        }))
      );
      
      return await window.electronAPI.validateExcelFiles(fileData);
    }

    // 模拟验证结果
    return {
      totalRecords: 150,
      validRecords: 145,
      invalidRecords: 5,
      warnings: 3,
      errors: [
        {
          file: this.files[0]?.name || '文件1',
          row: 23,
          column: 'B',
          field: '年龄',
          message: '年龄值无效: "abc"',
          suggestion: '请输入有效的数字'
        },
        {
          file: this.files[0]?.name || '文件1',
          row: 45,
          column: 'C',
          field: '身份证号',
          message: '身份证号格式错误',
          suggestion: '请检查身份证号是否为18位'
        }
      ],
      canImport: true
    };
  }

  /**
   * 显示验证结果
   */
  showValidationResults(results) {
    const validationResults = this.container.querySelector('#validationResults');
    const validationSummary = this.container.querySelector('#validationSummary');
    const validationErrors = this.container.querySelector('#validationErrors');
    const errorsList = this.container.querySelector('#errorsList');

    validationResults.classList.add('show');

    // 显示统计摘要
    validationSummary.innerHTML = `
      <div class="validation-card success">
        <div class="validation-icon">
          <span data-icon="check-circle" data-icon-size="xl" data-icon-class="icon-check"></span>
        </div>
        <div class="validation-number">${results.validRecords}</div>
        <div class="validation-label">有效记录</div>
      </div>
      <div class="validation-card ${results.invalidRecords > 0 ? 'error' : 'success'}">
        <div class="validation-icon">
          <span data-icon="${results.invalidRecords > 0 ? 'x-circle' : 'check-circle'}" 
                data-icon-size="xl" 
                data-icon-class="icon-${results.invalidRecords > 0 ? 'error' : 'check'}"></span>
        </div>
        <div class="validation-number">${results.invalidRecords}</div>
        <div class="validation-label">错误记录</div>
      </div>
      <div class="validation-card ${results.warnings > 0 ? 'warning' : 'success'}">
        <div class="validation-icon">
          <span data-icon="${results.warnings > 0 ? 'alert-triangle' : 'check-circle'}" 
                data-icon-size="xl" 
                data-icon-class="icon-${results.warnings > 0 ? 'warning' : 'check'}"></span>
        </div>
        <div class="validation-number">${results.warnings}</div>
        <div class="validation-label">警告</div>
      </div>
      <div class="validation-card">
        <div class="validation-icon">
          <span data-icon="file-text" data-icon-size="xl"></span>
        </div>
        <div class="validation-number">${results.totalRecords}</div>
        <div class="validation-label">总记录数</div>
      </div>
    `;

    // 显示错误详情
    if (results.errors && results.errors.length > 0) {
      validationErrors.style.display = 'block';
      errorsList.innerHTML = results.errors.map(error => `
        <div class="error-item">
          <div class="error-message">${error.message}</div>
          <div class="error-location">
            文件: ${error.file} | 行: ${error.row} | 列: ${error.column} | 字段: ${error.field}
          </div>
          ${error.suggestion ? `<div class="error-suggestion">建议: ${error.suggestion}</div>` : ''}
        </div>
      `).join('');
    } else {
      validationErrors.style.display = 'none';
    }

    // 更新图标
    if (window.IconLibrary) {
      window.IconLibrary.replaceIcons(validationResults);
    }
  }

  /**
   * 显示/隐藏相关元素
   */
  showProgress(message = '处理中...') {
    const progressContainer = this.container.querySelector('#uploadProgress');
    const progressList = this.container.querySelector('#progressList');
    
    progressContainer.classList.add('show');
    progressList.innerHTML = `
      <div class="progress-item">
        <div class="progress-header">
          <div class="progress-file-name">${message}</div>
          <div class="progress-percentage">0%</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
        <div class="progress-status">正在处理...</div>
      </div>
    `;
  }

  hideProgress() {
    const progressContainer = this.container.querySelector('#uploadProgress');
    progressContainer.classList.remove('show');
  }

  showImportActions() {
    const importActions = this.container.querySelector('#importActions');
    importActions.style.display = 'flex';
  }

  hideImportActions() {
    const importActions = this.container.querySelector('#importActions');
    importActions.style.display = 'none';
  }

  hideValidationResults() {
    const validationResults = this.container.querySelector('#validationResults');
    validationResults.classList.remove('show');
  }

  /**
   * 开始导入
   */
  async startImport() {
    if (!this.validationResults || !this.validationResults.canImport) {
      this.showError('验证未通过，无法导入');
      return;
    }

    const skipErrors = this.container.querySelector('#skipErrors').checked;
    const createBackup = this.container.querySelector('#createBackup').checked;

    try {
      this.showProgress('正在导入数据...');
      
      // 模拟导入进度
      await this.simulateImportProgress();
      
      // 调用后端导入API
      const result = await this.importData({
        files: this.files,
        options: {
          skipErrors,
          createBackup
        }
      });

      this.showSuccess(`导入成功！共导入 ${result.imported} 条记录。`);
      
      // 重置界面
      this.reset();
      
    } catch (error) {
      console.error('导入失败:', error);
      this.showError('导入失败: ' + error.message);
    } finally {
      this.hideProgress();
    }
  }

  /**
   * 取消导入
   */
  cancelImport() {
    this.reset();
  }

  /**
   * 重置界面
   */
  reset() {
    this.files = [];
    this.validationResults = null;
    this.updateFilesDisplay();
    this.hideValidationResults();
    this.hideImportActions();
    this.hideProgress();
    
    // 重置文件输入
    const fileInput = this.container.querySelector('#fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * 工具方法
   */
  generateFileId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async simulateProgress() {
    const progressBar = this.container.querySelector('.progress-bar');
    const progressPercentage = this.container.querySelector('.progress-percentage');
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (progressBar) progressBar.style.width = i + '%';
      if (progressPercentage) progressPercentage.textContent = i + '%';
    }
  }

  async simulateImportProgress() {
    const progressBar = this.container.querySelector('.progress-bar');
    const progressPercentage = this.container.querySelector('.progress-percentage');
    const progressStatus = this.container.querySelector('.progress-status');
    
    const steps = [
      { progress: 20, status: '创建备份...' },
      { progress: 40, status: '验证数据...' },
      { progress: 60, status: '处理记录...' },
      { progress: 80, status: '保存到数据库...' },
      { progress: 100, status: '导入完成' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (progressBar) progressBar.style.width = step.progress + '%';
      if (progressPercentage) progressPercentage.textContent = step.progress + '%';
      if (progressStatus) progressStatus.textContent = step.status;
    }
  }

  async importData(params) {
    // 这里应该调用实际的导入API
    if (window.electronAPI && window.electronAPI.importExcelData) {
      return await window.electronAPI.importExcelData(params);
    }

    // 模拟导入结果
    return {
      imported: this.validationResults.validRecords,
      skipped: this.validationResults.invalidRecords,
      success: true
    };
  }

  showError(message) {
    // 可以添加toast通知或其他错误显示机制
    console.error(message);
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    // 可以添加toast通知或其他成功显示机制
    console.log(message);
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'success');
    } else {
      alert(message);
    }
  }
}

// 创建全局实例
window.EnhancedUpload = EnhancedUpload;

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查是否存在上传容器
  if (document.querySelector('.upload-container')) {
    window.enhancedUpload = new EnhancedUpload();
  }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedUpload;
}