/**
 * 验证修复是否生效
 * 检查修改后的代码是否包含正确的逻辑
 */

const fs = require('fs');
const path = require('path');

function verifyFix() {
    console.log('🔍 验证修复是否生效');
    
    try {
        const appJsPath = path.join(__dirname, 'src/renderer/js/app.js');
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');
        
        console.log('\n📋 检查修复内容:');
        
        // 检查1: 函数是否改为async
        if (appJsContent.includes('async updateHomeStatistics()')) {
            console.log('✅ updateHomeStatistics 函数已改为 async');
        } else {
            console.log('❌ updateHomeStatistics 函数未改为 async');
        }
        
        // 检查2: 是否添加了家庭服务统计调用
        if (appJsContent.includes('window.electronAPI.familyService.getOverviewStats()')) {
            console.log('✅ 已添加家庭服务统计API调用');
        } else {
            console.log('❌ 未添加家庭服务统计API调用');
        }
        
        // 检查3: 是否更新了homeFamilyCount
        if (appJsContent.includes('this.elements.homeFamilyCount.textContent')) {
            console.log('✅ 已添加 homeFamilyCount 更新逻辑');
        } else {
            console.log('❌ 未添加 homeFamilyCount 更新逻辑');
        }
        
        // 检查4: 是否更新了homeServiceCount
        if (appJsContent.includes('this.elements.homeServiceCount.textContent')) {
            console.log('✅ 已添加 homeServiceCount 更新逻辑');
        } else {
            console.log('❌ 未添加 homeServiceCount 更新逻辑');
        }
        
        // 检查5: setPage函数是否改为async
        if (appJsContent.includes('async setPage(pageName, addToHistory = true)')) {
            console.log('✅ setPage 函数已改为 async');
        } else {
            console.log('❌ setPage 函数未改为 async');
        }
        
        // 检查6: 是否有错误处理
        if (appJsContent.includes('catch (error)') && appJsContent.includes('加载家庭服务统计失败')) {
            console.log('✅ 已添加错误处理逻辑');
        } else {
            console.log('❌ 未添加错误处理逻辑');
        }
        
        console.log('\n📄 显示修复的关键代码片段:');
        const lines = appJsContent.split('\\n');
        let inFunction = false;
        let functionLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('async updateHomeStatistics()')) {
                inFunction = true;
                functionLines.push(`${i + 1}: ${line}`);
            } else if (inFunction && line.trim() === '}' && !line.includes('if') && !line.includes('else')) {
                functionLines.push(`${i + 1}: ${line}`);
                break;
            } else if (inFunction) {
                functionLines.push(`${i + 1}: ${line}`);
            }
        }
        
        if (functionLines.length > 0) {
            console.log('\\n修复后的 updateHomeStatistics 函数:');
            console.log('...');
            functionLines.slice(-15).forEach(line => console.log(line));
            console.log('...');
        }
        
        console.log('\\n🎉 修复验证完成！');
        console.log('\\n📝 下一步操作:');
        console.log('1. 重启应用程序: npm start');
        console.log('2. 打开主页，查看家庭服务统计卡片');
        console.log('3. 应该显示: 家庭数量 618, 服务人次 3035');
        
    } catch (error) {
        console.error('❌ 验证过程出错:', error.message);
    }
}

if (require.main === module) {
    verifyFix();
}

module.exports = verifyFix;