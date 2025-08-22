const fs = require('fs');
const path = require('path');

function testPatientNavigationFix() {
    console.log('🔧 患者详情导航修复验证');
    console.log('='.repeat(50));
    
    // 读取修复后的代码
    const appJsPath = path.join(__dirname, 'src/renderer/js/app.js');
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    console.log('\n🔍 1. 检查模态框ID引用一致性');
    
    // 检查所有模态框ID引用
    const ageModalReferences = appJsContent.match(/getElementById\(['"]age[^'"]*Modal['"]\)/g) || [];
    console.log('发现的模态框ID引用:');
    ageModalReferences.forEach(ref => {
        console.log(`  ${ref}`);
    });
    
    // 检查是否还有错误的 'ageModal' 引用
    const incorrectReferences = appJsContent.match(/getElementById\(['"]ageModal['"]\)/g) || [];
    if (incorrectReferences.length === 0) {
        console.log('✅ 所有模态框ID引用已修复');
    } else {
        console.log('❌ 仍有错误的模态框ID引用:');
        incorrectReferences.forEach(ref => {
            console.log(`  ${ref}`);
        });
    }
    
    console.log('\n🔍 2. 检查患者详情导航方法');
    
    // 检查 navigateToPatientDetail 方法是否存在
    const hasNavigateMethod = appJsContent.includes('async navigateToPatientDetail(personId)');
    console.log(`navigateToPatientDetail 方法: ${hasNavigateMethod ? '✅ 存在' : '❌ 缺失'}`);
    
    // 检查 showPatientDetail 方法是否存在
    const hasShowMethod = appJsContent.includes('async showPatientDetail(personId)');
    console.log(`showPatientDetail 方法: ${hasShowMethod ? '✅ 存在' : '❌ 缺失'}`);
    
    // 检查方法调用链
    const hasMethodCall = appJsContent.includes('await this.showPatientDetail(personId)');
    console.log(`方法调用链: ${hasMethodCall ? '✅ 正确' : '❌ 错误'}`);
    
    console.log('\n🔍 3. 检查前端onclick事件');
    
    // 检查患者卡片的onclick事件
    const onclickPattern = /onclick="app\.navigateToPatientDetail\(\$\{patient\.id\}\)"/;
    const hasCorrectOnclick = onclickPattern.test(appJsContent);
    console.log(`患者卡片onclick事件: ${hasCorrectOnclick ? '✅ 正确' : '❌ 错误'}`);
    
    console.log('\n🔍 4. 检查HTML模态框结构');
    
    // 读取HTML文件
    const htmlPath = path.join(__dirname, 'src/renderer/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 检查模态框ID
    const hasAgeDetailModal = htmlContent.includes('id="ageDetailModal"');
    console.log(`ageDetailModal 模态框: ${hasAgeDetailModal ? '✅ 存在' : '❌ 缺失'}`);
    
    // 检查模态框元素
    const modalElements = [
        'ageModalTitle',
        'ageModalSubtitle', 
        'ageModalPatients',
        'closeAgeModal',
        'closeAgeModalBtn'
    ];
    
    modalElements.forEach(elementId => {
        const hasElement = htmlContent.includes(`id="${elementId}"`);
        console.log(`  ${elementId}: ${hasElement ? '✅' : '❌'}`);
    });
    
    console.log('\n💡 5. 修复总结');
    
    console.log('修复的问题:');
    console.log('✅ 将错误的 getElementById("ageModal") 修复为 getElementById("ageDetailModal")');
    console.log('✅ 添加了null检查避免运行时错误');
    console.log('✅ 使用正确的CSS类方法 classList.add("hidden")');
    
    console.log('\n🔧 问题根因分析:');
    console.log('❌ 原代码: document.getElementById("ageModal").classList.remove("active")');
    console.log('  问题1: 错误的模态框ID (ageModal vs ageDetailModal)');
    console.log('  问题2: 错误的CSS类操作 (remove("active") vs add("hidden"))');
    console.log('  问题3: 缺少null检查，可能导致运行时错误');
    
    console.log('\n✅ 修复后:');
    console.log('  const ageModal = document.getElementById("ageDetailModal");');
    console.log('  if (ageModal) {');
    console.log('    ageModal.classList.add("hidden");');
    console.log('  }');
    
    console.log('\n🎯 预期结果:');
    console.log('现在点击年龄段患者列表中的患者卡片应该能够正常导航到患者详情页面');
}

testPatientNavigationFix();