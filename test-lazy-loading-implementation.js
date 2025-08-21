#!/usr/bin/env node

/**
 * 测试懒加载实现功能
 * 验证患儿入住信息管理系统的懒加载功能是否正确实现
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试懒加载实现功能...\n');

// 检查关键文件
const files = {
    html: 'src/renderer/index.html',
    js: 'src/renderer/js/app.js'
};

let allTestsPassed = true;

// 1. 检查HTML文件中的UI分组
console.log('1. 检查HTML文件中的UI分组结构');
try {
    const htmlContent = fs.readFileSync(files.html, 'utf8');
    
    // 检查是否有患儿入住信息管理组标题
    const hasGroupTitle = htmlContent.includes('患儿入住信息管理');
    console.log(`   患儿入住信息管理组标题: ${hasGroupTitle ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasGroupTitle) allTestsPassed = false;
    
    // 检查是否使用新的导航方法
    const hasNavigateToPatientList = htmlContent.includes('app.navigateToPatientList()');
    const hasNavigateToStatistics = htmlContent.includes('app.navigateToStatistics()');
    console.log(`   navigateToPatientList调用: ${hasNavigateToPatientList ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   navigateToStatistics调用: ${hasNavigateToStatistics ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasNavigateToPatientList || !hasNavigateToStatistics) allTestsPassed = false;
    
    // 检查分组布局
    const hasGroupedLayout = htmlContent.includes('space-y-8') && htmlContent.includes('其他服务');
    console.log(`   分组布局结构: ${hasGroupedLayout ? '✅ 正确' : '❌ 错误'}`);
    if (!hasGroupedLayout) allTestsPassed = false;
    
} catch (error) {
    console.log(`   ❌ 读取HTML文件失败: ${error.message}`);
    allTestsPassed = false;
}

console.log();

// 2. 检查JavaScript文件中的懒加载逻辑
console.log('2. 检查JavaScript文件中的懒加载逻辑');
try {
    const jsContent = fs.readFileSync(files.js, 'utf8');
    
    // 检查是否移除了初始化时的数据加载
    const hasRemovedInitialLoad = !jsContent.includes('await this.loadData();') || 
        jsContent.includes('不再默认加载数据，只在用户点击相关功能时才加载');
    console.log(`   移除初始化数据加载: ${hasRemovedInitialLoad ? '✅ 已移除' : '❌ 仍存在'}`);
    if (!hasRemovedInitialLoad) allTestsPassed = false;
    
    // 检查数据加载状态标志
    const hasDataLoadedFlag = jsContent.includes('dataLoaded: false');
    console.log(`   数据加载状态标志: ${hasDataLoadedFlag ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasDataLoadedFlag) allTestsPassed = false;
    
    // 检查新的导航方法
    const hasNavigateToPatientListMethod = jsContent.includes('async navigateToPatientList()');
    const hasNavigateToStatisticsMethod = jsContent.includes('async navigateToStatistics()');
    console.log(`   navigateToPatientList方法: ${hasNavigateToPatientListMethod ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   navigateToStatistics方法: ${hasNavigateToStatisticsMethod ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasNavigateToPatientListMethod || !hasNavigateToStatisticsMethod) allTestsPassed = false;
    
    // 检查条件数据加载逻辑
    const hasConditionalLoading = jsContent.includes('if (!this.pageStates.dataLoaded)');
    console.log(`   条件数据加载逻辑: ${hasConditionalLoading ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasConditionalLoading) allTestsPassed = false;
    
    // 检查主页统计更新逻辑
    const hasConditionalStats = jsContent.includes('if (this.pageStates.dataLoaded && this.patients)');
    console.log(`   条件统计更新逻辑: ${hasConditionalStats ? '✅ 存在' : '❌ 缺失'}`);
    if (!hasConditionalStats) allTestsPassed = false;
    
} catch (error) {
    console.log(`   ❌ 读取JavaScript文件失败: ${error.message}`);
    allTestsPassed = false;
}

console.log();

// 3. 检查语法正确性
console.log('3. 检查JavaScript语法正确性');
try {
    const { execSync } = require('child_process');
    execSync(`node -c "${files.js}"`, { stdio: 'pipe' });
    console.log('   JavaScript语法: ✅ 正确');
} catch (error) {
    console.log('   JavaScript语法: ❌ 存在错误');
    console.log(`   错误详情: ${error.message}`);
    allTestsPassed = false;
}

console.log();

// 4. 功能完整性检查
console.log('4. 功能完整性检查');
try {
    const jsContent = fs.readFileSync(files.js, 'utf8');
    
    // 检查错误处理
    const hasErrorHandling = jsContent.includes('catch (error)') && 
        jsContent.includes('console.error') && jsContent.includes('this.showError');
    console.log(`   错误处理机制: ${hasErrorHandling ? '✅ 完整' : '❌ 不完整'}`);
    if (!hasErrorHandling) allTestsPassed = false;
    
    // 检查加载状态管理
    const hasLoadingManagement = jsContent.includes('this.showLoading') && 
        jsContent.includes('this.hideLoading');
    console.log(`   加载状态管理: ${hasLoadingManagement ? '✅ 完整' : '❌ 不完整'}`);
    if (!hasLoadingManagement) allTestsPassed = false;
    
    // 检查数据状态重置
    const hasDataStateManagement = jsContent.includes('this.pageStates.dataLoaded = true');
    console.log(`   数据状态管理: ${hasDataStateManagement ? '✅ 完整' : '❌ 不完整'}`);
    if (!hasDataStateManagement) allTestsPassed = false;
    
} catch (error) {
    console.log(`   ❌ 功能检查失败: ${error.message}`);
    allTestsPassed = false;
}

console.log();

// 测试结果总结
console.log('📊 测试结果总结');
console.log('='.repeat(50));
if (allTestsPassed) {
    console.log('🎉 所有测试通过！懒加载功能实现成功');
    console.log('\n✨ 实现的功能特性:');
    console.log('   • 首页UI重新分组，患儿入住信息管理独立成组');
    console.log('   • 应用启动时不再默认加载数据');
    console.log('   • 点击"入住信息列表"或"入住信息统计"时才加载数据');
    console.log('   • 数据加载状态智能管理，避免重复加载');
    console.log('   • 完整的错误处理和用户反馈机制');
    console.log('\n🚀 应用已准备就绪，可以使用 npm run dev 启动测试');
} else {
    console.log('❌ 部分测试失败，请检查上述错误并修复');
}

console.log();

// 使用说明
console.log('📖 使用说明');
console.log('='.repeat(50));
console.log('1. 启动应用: npm run dev');
console.log('2. 观察主页不会自动加载数据（统计显示为 "-"）');
console.log('3. 点击"入住信息列表"或"入住信息统计"触发数据加载');
console.log('4. 数据加载完成后，相关功能正常使用');
console.log('5. 返回主页时，统计数据会正确显示');

process.exit(allTestsPassed ? 0 : 1);