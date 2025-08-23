/**
 * 重新设计的患者详情页面 - 核心功能模块
 * 专注于基本信息、家庭信息和入住记录三个核心模块
 */

class PatientDetailRedesigned {
    constructor() {
        this.patientData = null;
        this.medicalRecords = [];
        this.iconLib = new IconLibrary();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.showLoadingOverlay();
        
        try {
            await this.loadPatientData();
            this.hideLoadingOverlay();
        } catch (error) {
            console.error('Failed to initialize patient detail page:', error);
            this.hideLoadingOverlay();
            this.showToast('页面初始化失败，请刷新重试', 'error');
        }
    }

    setupEventListeners() {
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.textContent.trim();
                this.handleAction(action);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    async loadPatientData() {
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('id');

        if (!patientId) {
            throw new Error('未提供患者ID参数');
        }

        console.log('Loading patient data for ID:', patientId);

        if (window.electronAPI && window.electronAPI.getPatientDetail) {
            try {
                const data = await window.electronAPI.getPatientDetail(patientId);
                if (!data) {
                    throw new Error('未找到患者数据');
                }
                this.patientData = this.processPatientData(data);
                await this.loadMedicalRecords(patientId);
                this.updatePatientHeader();
                this.renderAllSections();
            } catch (error) {
                console.error('Failed to load patient data:', error);
                this.showDataLoadError('患者数据加载失败: ' + error.message);
            }
        } else {
            console.error('electronAPI not available');
            this.showDataLoadError('系统API不可用，请检查应用程序配置');
        }
    }

    async loadMedicalRecords(patientId) {
        try {
            // 先尝试从患者详情中获取医疗记录
            if (window.electronAPI && window.electronAPI.getPatientDetail) {
                const data = await window.electronAPI.getPatientDetail(patientId);
                if (data && data.medicalInfo && Array.isArray(data.medicalInfo)) {
                    this.medicalRecords = data.medicalInfo;
                    return;
                }
            }
            
            // 如果没有医疗记录，设置为空数组
            this.medicalRecords = [];
            console.log('No medical records found for patient:', patientId);
        } catch (error) {
            console.error('Failed to load medical records:', error);
            this.medicalRecords = [];
            this.showToast('医疗记录加载失败: ' + error.message, 'error');
        }
    }

    processPatientData(rawData) {
        console.log('Processing patient data:', rawData);
        
        const profile = rawData.profile || rawData || {};
        const family = rawData.family || {};
        const medical = rawData.medical || rawData.medicalInfo || {};

        const processedData = {
            // 基本信息（出生日期 籍贯 民族 身份证号）
            basic: {
                name: profile.name || profile.patient_name || '未填写',
                gender: profile.gender || profile.sex || '未填写',
                age: profile.age || this.calculateAge(profile.birth_date || profile.birthDate) || '未填写',
                birthDate: this.formatDate(profile.birth_date || profile.birthDate) || '未填写',
                hometown: profile.hometown || profile.native_place || '未填写',
                ethnicity: profile.ethnicity || profile.ethnic || '未填写',
                idCard: profile.id_card || profile.idCard || profile.identity_card || '未填写',
                phone: profile.phone || profile.contact_phone || '未填写',
                status: profile.status || medical.status || '未知'
            },
            // 家庭信息（家庭地址 父亲信息 母亲信息 家庭经济情况）
            family: {
                // 家庭地址
                address: family.home_address || family.address || family.family_address || '未填写',
                // 父亲信息
                father: {
                    name: family.father_name || family.fatherName || '未填写',
                    phone: family.father_phone || family.fatherPhone || '未填写',
                    occupation: family.father_occupation || family.fatherOccupation || '未填写',
                    education: family.father_education || family.fatherEducation || '未填写'
                },
                // 母亲信息
                mother: {
                    name: family.mother_name || family.motherName || '未填写',
                    phone: family.mother_phone || family.motherPhone || '未填写',
                    occupation: family.mother_occupation || family.motherOccupation || '未填写',
                    education: family.mother_education || family.motherEducation || '未填写'
                },
                // 家庭经济情况
                economy: {
                    monthlyIncome: family.monthly_income || family.monthlyIncome || '未填写',
                    economicStatus: family.economic_status || family.economicStatus || '未填写',
                    insuranceType: family.insurance_type || family.insuranceType || '未填写',
                    otherSupport: family.other_support || family.otherSupport || '未填写'
                }
            },
            // 医疗信息
            medical: {
                hospital: medical.hospital || medical.current_hospital || '未知医院',
                department: medical.department || medical.current_department || '未知科室',
                doctor: medical.doctor || medical.doctor_name || '未知医生'
            },
            // 原始数据保留
            raw: rawData
        };

        console.log('Processed patient data:', processedData);
        return processedData;
    }

    getGuardianRelationship(family) {
        if (family.father_name) return '父亲';
        if (family.mother_name) return '母亲';
        if (family.other_guardian) return '其他监护人';
        return '未知关系';
    }

    updatePatientHeader() {
        if (!this.patientData) return;

        const { basic } = this.patientData;

        // 更新患者姓名
        const nameEl = document.getElementById('patientName');
        if (nameEl) nameEl.textContent = basic.name || '未知姓名';

        // 更新面包屑（根据来源动态渲染）
        this.updateBreadcrumbForContext(basic.name);

        // 更新患者元数据
        const ageEl = document.getElementById('patientAge');
        const genderEl = document.getElementById('patientGender');
        
        if (ageEl) {
            const ageText = (basic.age && basic.age !== '未填写') ? 
                (typeof basic.age === 'number' ? `${basic.age}岁` : basic.age) : '未知';
            ageEl.textContent = ageText;
        }
        
        if (genderEl) {
            genderEl.textContent = (basic.gender && basic.gender !== '未填写') ? basic.gender : '未知';
        }
    }

    updateBreadcrumbForContext(patientName) {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');

        // 默认更新当前项
        const defaultCurrent = document.getElementById('breadcrumbCurrent');
        if (defaultCurrent) {
            defaultCurrent.textContent = patientName || '患者详情';
            defaultCurrent.title = patientName || '';
        }

        if (from === 'stats-age') {
            const nav = document.querySelector('nav[aria-label="面包屑导航"]');
            const ol = nav ? nav.querySelector('ol') : null;
            if (!ol) return;

            const arrow = `
                <li class=\"mx-2 text-slate-400\" aria-hidden=\"true\">
                    <svg class=\"w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                        <path fill-rule=\"evenodd\" d=\"M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z\" clip-rule=\"evenodd\"/>
                    </svg>
                </li>`;

            ol.innerHTML = `
                <li>
                    <a href=\"index.html\" class=\"text-teal-600 hover:text-teal-700 font-medium\">主页</a>
                </li>
                ${arrow}
                <li>
                    <a href=\"index.html#stats\" class=\"hover:text-slate-700\">统计分析</a>
                </li>
                ${arrow}
                <li>
                    <a href=\"index.html#age-stats\" class=\"hover:text-slate-700\">年龄段统计</a>
                </li>
                ${arrow}
                <li id=\"breadcrumbCurrent\" class=\"text-slate-700 font-medium truncate max-w-[50vw]\">${patientName || '患者详情'}</li>
            `;

            // 更新左上角返回链接与文案
            const backLink = document.getElementById('backLink');
            const backLabel = document.getElementById('backLinkLabel');
            if (backLink) backLink.href = 'index.html#age-stats';
            if (backLabel) backLabel.textContent = '返回统计分析';
        }
    }

    renderAllSections() {
        this.renderBasicInfoSection();
        this.renderFamilyInfoSection();
        this.renderAdmissionRecordsSection();
    }

    renderBasicInfoSection() {
        if (!this.patientData) return;

        const { basic } = this.patientData;
        const contentEl = document.getElementById('basicInfoContent');
        
        if (contentEl) {
            // 创建基本信息字段数组，只包含有数据的字段
            const basicInfoFields = [];
            
            if (basic.name && basic.name !== '未填写') {
                basicInfoFields.push({ label: '姓名', value: basic.name, class: '' });
            }
            
            if (basic.gender && basic.gender !== '未填写') {
                basicInfoFields.push({ label: '性别', value: basic.gender, class: '' });
            }
            
            if (basic.age && basic.age !== '未填写') {
                const ageText = typeof basic.age === 'number' ? `${basic.age}岁` : basic.age;
                basicInfoFields.push({ label: '年龄', value: ageText, class: '' });
            }
            
            if (basic.birthDate && basic.birthDate !== '未填写') {
                basicInfoFields.push({ label: '出生日期', value: basic.birthDate, class: '' });
            }
            
            if (basic.hometown && basic.hometown !== '未填写') {
                basicInfoFields.push({ label: '籍贯', value: basic.hometown, class: '' });
            }
            
            if (basic.ethnicity && basic.ethnicity !== '未填写') {
                basicInfoFields.push({ label: '民族', value: basic.ethnicity, class: '' });
            }
            
            if (basic.idCard && basic.idCard !== '未填写') {
                basicInfoFields.push({ label: '身份证号', value: this.maskIdCard(basic.idCard), class: 'sensitive' });
            }
            
            if (basic.phone && basic.phone !== '未填写') {
                basicInfoFields.push({ label: '联系电话', value: basic.phone, class: '' });
            }

            // 生成信息项HTML
            const infoItemsHTML = basicInfoFields.map(field => `
                <div class="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <span class="text-sm text-gray-600 font-medium mb-1 sm:mb-0">${field.label}</span>
                    <span class="text-gray-800 ${field.class} font-medium">${field.value}</span>
                </div>
            `).join('');

            contentEl.innerHTML = `
                <div class="grid gap-6">
                    <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <h3 class="font-medium text-gray-800">个人基本信息</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${infoItemsHTML}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderFamilyInfoSection() {
        if (!this.patientData) return;

        const { family } = this.patientData;
        const contentEl = document.getElementById('familyInfoContent');
        
        if (contentEl) {
            const cards = [];

            // 家庭地址卡片
            if (family.address && family.address !== '未填写') {
                cards.push(`
                    <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                            </div>
                            <h3 class="font-medium text-gray-800">家庭地址</h3>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <p class="text-gray-800 leading-relaxed">${family.address}</p>
                        </div>
                    </div>
                `);
            }

            // 父亲信息卡片
            const fatherFields = [];
            if (family.father.name && family.father.name !== '未填写') {
                fatherFields.push({ label: '姓名', value: family.father.name });
            }
            if (family.father.phone && family.father.phone !== '未填写') {
                fatherFields.push({ label: '联系电话', value: family.father.phone });
            }
            if (family.father.occupation && family.father.occupation !== '未填写') {
                fatherFields.push({ label: '职业', value: family.father.occupation });
            }
            if (family.father.education && family.father.education !== '未填写') {
                fatherFields.push({ label: '学历', value: family.father.education });
            }

            if (fatherFields.length > 0) {
                const fatherHTML = fatherFields.map(field => `
                    <div class="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span class="text-sm text-gray-600 font-medium mb-1 sm:mb-0">${field.label}</span>
                        <span class="text-gray-800 font-medium">${field.value}</span>
                    </div>
                `).join('');

                cards.push(`
                    <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <h3 class="font-medium text-gray-800">父亲信息</h3>
                        </div>
                        <div class="space-y-3">
                            ${fatherHTML}
                        </div>
                    </div>
                `);
            }

            // 母亲信息卡片
            const motherFields = [];
            if (family.mother.name && family.mother.name !== '未填写') {
                motherFields.push({ label: '姓名', value: family.mother.name });
            }
            if (family.mother.phone && family.mother.phone !== '未填写') {
                motherFields.push({ label: '联系电话', value: family.mother.phone });
            }
            if (family.mother.occupation && family.mother.occupation !== '未填写') {
                motherFields.push({ label: '职业', value: family.mother.occupation });
            }
            if (family.mother.education && family.mother.education !== '未填写') {
                motherFields.push({ label: '学历', value: family.mother.education });
            }

            if (motherFields.length > 0) {
                const motherHTML = motherFields.map(field => `
                    <div class="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span class="text-sm text-gray-600 font-medium mb-1 sm:mb-0">${field.label}</span>
                        <span class="text-gray-800 font-medium">${field.value}</span>
                    </div>
                `).join('');

                cards.push(`
                    <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <h3 class="font-medium text-gray-800">母亲信息</h3>
                        </div>
                        <div class="space-y-3">
                            ${motherHTML}
                        </div>
                    </div>
                `);
            }

            // 家庭经济情况卡片
            const economyFields = [];
            if (family.economy.monthlyIncome && family.economy.monthlyIncome !== '未填写') {
                economyFields.push({ label: '月收入', value: family.economy.monthlyIncome });
            }
            if (family.economy.economicStatus && family.economy.economicStatus !== '未填写') {
                economyFields.push({ label: '经济状况', value: family.economy.economicStatus });
            }
            if (family.economy.insuranceType && family.economy.insuranceType !== '未填写') {
                economyFields.push({ label: '医保类型', value: family.economy.insuranceType });
            }
            if (family.economy.otherSupport && family.economy.otherSupport !== '未填写') {
                economyFields.push({ label: '其他保障', value: family.economy.otherSupport });
            }

            if (economyFields.length > 0) {
                const economyHTML = economyFields.map(field => `
                    <div class="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span class="text-sm text-gray-600 font-medium mb-1 sm:mb-0">${field.label}</span>
                        <span class="text-gray-800 font-medium">${field.value}</span>
                    </div>
                `).join('');

                cards.push(`
                    <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>
                            <h3 class="font-medium text-gray-800">家庭经济情况</h3>
                        </div>
                        <div class="space-y-3">
                            ${economyHTML}
                        </div>
                    </div>
                `);
            }

            contentEl.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    ${cards.join('')}
                </div>
            `;
        }
    }

    renderAdmissionRecordsSection() {
        console.log('渲染入住记录区域，医疗记录数量:', this.medicalRecords?.length || 0);
        console.log('医疗记录数据:', this.medicalRecords);
        
        const contentEl = document.getElementById('admissionRecordsContent');
        
        if (!contentEl) {
            console.error('admissionRecordsContent element not found');
            return;
        }

        // 先创建容器结构
        contentEl.innerHTML = `
            <div class="space-y-4">
                <div id="medicalRecordsList">
                    <div class="bg-white rounded-xl border border-gray-200 p-8 text-center animate-pulse">
                        <div class="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                    </div>
                </div>
            </div>
        `;

        // 渲染医疗记录内容
        if (this.medicalRecords && this.medicalRecords.length > 0) {
            console.log('渲染医疗记录内容');
            this.renderMedicalRecordsContent();
        } else {
            console.log('没有医疗记录，显示空状态');
            this.renderNoMedicalRecords();
        }
    }


    renderMedicalRecordsContent() {
        const listEl = document.getElementById('medicalRecordsList');
        if (!listEl || !this.medicalRecords || this.medicalRecords.length === 0) {
            this.renderNoMedicalRecords();
            return;
        }

        const recordsHTML = this.medicalRecords.map((record, index) => {
            // 创建字段数组，只包含有数据的字段
            const fields = [];

            // 入住小家相关信息
            if (record.check_in_date || record.admission_date || record.record_date || record.recordDate) {
                fields.push({
                    label: '记录日期',
                    content: this.formatDate(record.check_in_date || record.admission_date || record.record_date || record.recordDate),
                    class: 'text-blue-600 font-medium'
                });
            }

            if (record.check_out_date || record.discharge_date) {
                fields.push({
                    label: '离开日期',
                    content: this.formatDate(record.check_out_date || record.discharge_date),
                    class: 'text-blue-600 font-medium'
                });
            }
            
            if (record.hospital) {
                fields.push({
                    label: '医院',
                    content: record.hospital,
                    class: 'text-green-600 font-medium'
                });
            }
            
            if (record.department) {
                fields.push({
                    label: '科室',
                    content: record.department,
                    class: 'text-gray-700'
                });
            }
            
            if (record.doctor_name) {
                fields.push({
                    label: '医生',
                    content: record.doctor_name,
                    class: 'text-purple-600 font-medium'
                });
            }
            
            if (record.diagnosis) {
                fields.push({
                    label: '诊断',
                    content: record.diagnosis,
                    class: 'text-orange-600 font-medium',
                    fullWidth: true
                });
            }
            
            if (record.symptoms) {
                fields.push({
                    label: '症状',
                    content: record.symptoms,
                    class: 'text-gray-700',
                    fullWidth: true
                });
            }
            
            if (record.treatment_process) {
                fields.push({
                    label: '治疗过程',
                    content: record.treatment_process,
                    class: 'text-gray-700',
                    fullWidth: true
                });
            }
            
            if (record.follow_up_plan) {
                fields.push({
                    label: '后续安排',
                    content: record.follow_up_plan,
                    class: 'text-gray-700',
                    fullWidth: true
                });
            }

            // 生成字段HTML
            const fieldsHTML = fields.map(field => `
                <div class="${field.fullWidth ? 'col-span-2' : ''} py-3 border-b border-gray-100 last:border-b-0">
                    <div class="flex flex-col sm:flex-row sm:justify-between">
                        <span class="text-sm text-gray-600 font-medium mb-1 sm:mb-0">${field.label}</span>
                        <span class="${field.class} text-right sm:max-w-md">${field.content}</span>
                    </div>
                </div>
            `).join('');

            return `
                <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                                ${index + 1}
                            </div>
                            <h4 class="text-lg font-semibold text-gray-800">第 ${index + 1} 次入住记录</h4>
                        </div>
                        <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            ${this.formatDate(record.check_in_date || record.admission_date) || '日期未知'}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-0">
                        ${fieldsHTML}
                    </div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = recordsHTML;
    }

    renderNoMedicalRecords() {
        const listEl = document.getElementById('medicalRecordsList');
        if (listEl) {
            listEl.innerHTML = `
                <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div class="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">暂无入住记录</h3>
                    <p class="text-gray-600">该患者目前还没有入住小家的记录</p>
                </div>
            `;
        }
    }

    renderRecordsSummary() {
        const totalAdmissionsEl = document.getElementById('totalAdmissions');
        const totalDaysEl = document.getElementById('totalDays');
        const currentStatusEl = document.getElementById('currentStatus');

        if (totalAdmissionsEl) {
            totalAdmissionsEl.textContent = this.admissionRecords.length.toString();
        }

        if (totalDaysEl) {
            const totalDays = this.calculateTotalHospitalDays();
            totalDaysEl.textContent = totalDays.toString();
        }

        if (currentStatusEl) {
            const status = this.patientData?.basic?.status || '未知';
            currentStatusEl.textContent = status;
            currentStatusEl.className = `summary-value status ${status === '在住' ? 'active' : 'discharged'}`;
        }
    }

    renderRecordsTimeline() {
        const timelineEl = document.getElementById('admissionTimeline');
        if (!timelineEl) return;

        if (this.admissionRecords.length === 0) {
            timelineEl.innerHTML = `
                <div class="empty-state">
                    <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <h3>暂无入住记录</h3>
                    <p>该患者目前还没有入住记录</p>
                </div>
            `;
            return;
        }

        const timelineHTML = this.admissionRecords.map((record, index) => {
            const checkInDate = this.formatDate(record.check_in_date);
            const checkOutDate = record.check_out_date ? this.formatDate(record.check_out_date) : null;
            const duration = this.calculateDuration(record.check_in_date, record.check_out_date);
            const isCurrentAdmission = !record.check_out_date;

            return `
                <div class="timeline-record ${isCurrentAdmission ? 'current' : 'completed'}">
                    <div class="timeline-marker">
                        <div class="marker-dot ${isCurrentAdmission ? 'active' : 'completed'}"></div>
                        ${index < this.admissionRecords.length - 1 ? '<div class="marker-line"></div>' : ''}
                    </div>
                    <div class="timeline-content">
                        <div class="record-header">
                            <h4 class="record-title">
                                ${isCurrentAdmission ? '当前住院' : `第 ${this.admissionRecords.length - index} 次住院`}
                            </h4>
                            <span class="record-status ${isCurrentAdmission ? 'current' : 'completed'}">
                                ${isCurrentAdmission ? '住院中' : '已出院'}
                            </span>
                        </div>
                        <div class="record-details">
                            <div class="record-dates">
                                <div class="date-item">
                                    <span class="date-label">入住日期</span>
                                    <span class="date-value">${checkInDate}</span>
                                </div>
                                ${checkOutDate ? `
                                    <div class="date-item">
                                        <span class="date-label">出院日期</span>
                                        <span class="date-value">${checkOutDate}</span>
                                    </div>
                                ` : `
                                    <div class="date-item">
                                        <span class="date-label">出院日期</span>
                                        <span class="date-value pending">住院中</span>
                                    </div>
                                `}
                                <div class="date-item">
                                    <span class="date-label">住院时长</span>
                                    <span class="date-value duration">${duration}</span>
                                </div>
                            </div>
                            ${record.hospital ? `
                                <div class="record-hospital">
                                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m4-6h4a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-4m-6 0V9c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2z"/>
                                    </svg>
                                    <span>${record.hospital}</span>
                                </div>
                            ` : ''}
                            ${record.department ? `
                                <div class="record-department">
                                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"/>
                                    </svg>
                                    <span>${record.department}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        timelineEl.innerHTML = `<div class="timeline-list">${timelineHTML}</div>`;
    }

    // Utility functions
    calculateAge(birthDate) {
        if (!birthDate) return null;
        
        try {
            let date = birthDate;
            if (birthDate.includes('.')) {
                const parts = birthDate.split('.');
                if (parts.length === 3) {
                    date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
            
            const birth = new Date(date);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        } catch (error) {
            console.error('Age calculation error:', error);
            return null;
        }
    }

    formatDate(dateStr) {
        if (!dateStr) return '未知日期';
        
        try {
            let date = dateStr;
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                    date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
            
            const d = new Date(date);
            return d.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return dateStr;
        }
    }

    maskIdCard(idCard) {
        if (!idCard || idCard.length < 8) return idCard;
        return idCard.substring(0, 4) + '****' + idCard.substring(idCard.length - 4);
    }

    calculateDuration(checkInDate, checkOutDate) {
        if (!checkInDate) return '未知';
        
        const startDate = new Date(checkInDate);
        const endDate = checkOutDate ? new Date(checkOutDate) : new Date();
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '当日';
        if (diffDays === 1) return '1天';
        return `${diffDays}天`;
    }

    calculateTotalHospitalDays() {
        return this.admissionRecords.reduce((total, record) => {
            const startDate = new Date(record.check_in_date);
            const endDate = record.check_out_date ? new Date(record.check_out_date) : new Date();
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return total + diffDays;
        }, 0);
    }

    getStatusIcon(status) {
        const iconMap = {
            '在住': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
            '已出院': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        };
        return iconMap[status] || '';
    }

    getSeverityClass(severity) {
        const classMap = {
            '轻度': 'mild',
            '中度': 'moderate',
            '重度': 'severe',
            '危重': 'critical'
        };
        return classMap[severity] || 'unknown';
    }

    getSeverityIcon(severity) {
        const iconMap = {
            '轻度': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>',
            '中度': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
            '重度': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>',
            '危重': '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        };
        return iconMap[severity] || '';
    }

    handleAction(action) {
        switch (action) {
            case '编辑':
                this.editPatient();
                break;
            case '打印':
                this.printPatientDetails();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    editPatient() {
        this.showToast('编辑功能开发中...', 'info');
    }

    printPatientDetails() {
        window.print();
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.switchTab('basic-info');
                    break;
                case '2':
                    e.preventDefault();
                    this.switchTab('family-info');
                    break;
                case '3':
                    e.preventDefault();
                    this.switchTab('admission-records');
                    break;
                case 'p':
                    e.preventDefault();
                    this.printPatientDetails();
                    break;
            }
        }
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${type === 'success' ? '<polyline points="20,6 9,17 4,12"/>' : 
                  type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' :
                  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    showDataLoadError(message) {
        // 显示数据加载错误
        const sections = ['basicInfoContent', 'familyInfoContent', 'admissionRecordsContent'];
        sections.forEach(sectionId => {
            const sectionEl = document.getElementById(sectionId);
            if (sectionEl) {
                sectionEl.innerHTML = `
                    <div class="bg-white rounded-xl border border-red-200 p-12 text-center">
                        <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">数据加载失败</h3>
                        <p class="text-gray-600 mb-4">${message}</p>
                        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" onclick="location.reload()">重新加载页面</button>
                    </div>
                `;
            }
        });
        this.showToast(message, 'error');
    }

    showMedicalRecordsError(message) {
        const listEl = document.getElementById('medicalRecordsList');
        if (listEl) {
            listEl.innerHTML = `
                <div class="bg-white rounded-xl border border-red-200 p-12 text-center">
                    <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">入住记录加载失败</h3>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors" onclick="window.patientDetailRedesigned.renderAdmissionRecordsSection()">重试加载</button>
                </div>
            `;
        }
    }



}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.patient-detail-redesigned')) {
        window.patientDetailRedesigned = new PatientDetailRedesigned();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientDetailRedesigned;
}
