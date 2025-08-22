// Debug script for family service statistics issue
const { app, BrowserWindow } = require('electron');
const path = require('path');

async function testFamilyServiceStats() {
    console.log('🧪 [Debug] 开始测试家庭服务统计功能...');
    
    // 创建一个窗口
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preload.js')
        }
    });
    
    // 加载主页面
    await win.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
    
    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🎯 [Debug] 页面已加载，开始测试导航...');
    
    // 在渲染进程中执行调试代码
    const result = await win.webContents.executeJavaScript(`
        (async function() {
            console.log('🔍 [Debug] 开始前端调试...');
            
            // 检查app对象是否存在
            console.log('📱 [Debug] app对象存在:', typeof app !== 'undefined');
            
            if (typeof app !== 'undefined') {
                // 检查navigateToFamilyServiceStatistics方法是否存在
                console.log('🚀 [Debug] navigateToFamilyServiceStatistics方法存在:', typeof app.navigateToFamilyServiceStatistics === 'function');
                
                // 检查loadFamilyServiceStatistics方法是否存在
                console.log('📊 [Debug] loadFamilyServiceStatistics方法存在:', typeof app.loadFamilyServiceStatistics === 'function');
                
                // 检查关键DOM元素是否存在
                const elements = {
                    monthlyAvg: document.getElementById('fsStatMonthlyAverage'),
                    totalRecords: document.getElementById('fsStatTotalRecords'),
                    totalFamilies: document.getElementById('fsStatTotalFamilies'),
                    totalServiceDays: document.getElementById('fsStatTotalServiceDays'),
                    loading: document.getElementById('familyServiceStatisticsLoading'),
                    content: document.getElementById('familyServiceStatisticsContent')
                };
                
                console.log('🔍 [Debug] DOM元素检查结果:');
                for (const [name, element] of Object.entries(elements)) {
                    console.log(\`  \${name}: \${element ? '✅ 存在' : '❌ 不存在'}\`);
                }
                
                // 尝试直接调用统计加载函数
                if (typeof app.loadFamilyServiceStatistics === 'function') {
                    console.log('🎯 [Debug] 尝试直接调用loadFamilyServiceStatistics...');
                    try {
                        await app.loadFamilyServiceStatistics();
                        console.log('✅ [Debug] loadFamilyServiceStatistics调用成功');
                        
                        // 检查DOM元素的值
                        console.log('📊 [Debug] DOM元素值检查:');
                        for (const [name, element] of Object.entries(elements)) {
                            if (element && name.startsWith('fs')) {
                                console.log(\`  \${name}: \${element.textContent}\`);
                            }
                        }
                        
                        return { success: true, message: '直接调用成功' };
                    } catch (error) {
                        console.error('❌ [Debug] loadFamilyServiceStatistics调用失败:', error);
                        return { success: false, error: error.message };
                    }
                } else {
                    return { success: false, error: 'loadFamilyServiceStatistics方法不存在' };
                }
            } else {
                return { success: false, error: 'app对象不存在' };
            }
        })();
    `);
    
    console.log('🎯 [Debug] 前端测试结果:', result);
    
    // 保持窗口打开一段时间以便观察
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    win.close();
}

// 运行测试
if (require.main === module) {
    app.whenReady().then(() => {
        testFamilyServiceStats().then(() => {
            console.log('🏁 [Debug] 测试完成');
            app.quit();
        }).catch(error => {
            console.error('💥 [Debug] 测试失败:', error);
            app.quit();
        });
    });
}