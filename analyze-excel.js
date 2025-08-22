#!/usr/bin/env node

// Excel文件内容分析工具
const XLSX = require('xlsx');
const path = require('path');

function analyzeExcelFile(filePath) {
    console.log('📊 Excel文件内容分析');
    console.log('====================');
    console.log(`文件路径: ${filePath}`);
    
    try {
        // 读取Excel文件
        const workbook = XLSX.readFile(filePath);
        console.log(`工作表数量: ${workbook.SheetNames.length}`);
        console.log(`工作表名称: ${workbook.SheetNames.join(', ')}`);
        
        // 分析第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        console.log(`\n📋 分析工作表: ${sheetName}`);
        
        // 转换为数组格式
        const rawData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // 使用数组而不是对象
            defval: null // 空单元格返回null
        });
        
        console.log(`总行数: ${rawData.length}`);
        
        if (rawData.length === 0) {
            console.log('❌ 文件为空');
            return;
        }
        
        // 分析表头结构
        console.log('\n🏷️  表头结构分析:');
        const maxRows = Math.min(3, rawData.length); // 分析前3行作为表头
        
        for (let i = 0; i < maxRows; i++) {
            const row = rawData[i] || [];
            console.log(`\n第${i + 1}行 (${row.length}列):`);
            row.forEach((cell, index) => {
                const cellValue = cell ? String(cell).trim() : '';
                console.log(`  列${index + 1}: "${cellValue}"`);
            });
        }
        
        // 分析数据行样例
        if (rawData.length > 3) {
            console.log('\n📝 数据行样例:');
            const dataStartRow = 3; // 假设第4行开始是数据
            const sampleRows = Math.min(3, rawData.length - dataStartRow);
            
            for (let i = 0; i < sampleRows; i++) {
                const rowIndex = dataStartRow + i;
                const row = rawData[rowIndex] || [];
                console.log(`\n数据行${rowIndex + 1} (${row.length}列):`);
                row.forEach((cell, index) => {
                    const cellValue = cell ? String(cell).trim() : '';
                    if (cellValue) { // 只显示非空单元格
                        console.log(`  列${index + 1}: "${cellValue}"`);
                    }
                });
            }
        }
        
        // 寻找可能的关键字段
        console.log('\n🔍 关键字段检索:');
        const keywords = ['姓名', '患者', '母亲', '父亲', '性别', '出生', '籍贯', '身份证', '电话', '手机'];
        
        for (let rowIndex = 0; rowIndex < Math.min(5, rawData.length); rowIndex++) {
            const row = rawData[rowIndex] || [];
            row.forEach((cell, colIndex) => {
                const cellValue = cell ? String(cell).trim() : '';
                for (const keyword of keywords) {
                    if (cellValue.includes(keyword)) {
                        console.log(`  发现关键词 "${keyword}": 第${rowIndex + 1}行第${colIndex + 1}列 = "${cellValue}"`);
                    }
                }
            });
        }
        
        return {
            sheetNames: workbook.SheetNames,
            totalRows: rawData.length,
            headers: rawData.slice(0, 3),
            sampleData: rawData.slice(3, 6),
            rawData: rawData
        };
        
    } catch (error) {
        console.error('❌ 分析Excel文件失败:', error.message);
        return null;
    }
}

// 分析b.xlsx文件
const excelPath = path.join(__dirname, 'b.xlsx');
const result = analyzeExcelFile(excelPath);

if (result) {
    console.log('\n✅ Excel文件分析完成');
} else {
    console.log('\n❌ Excel文件分析失败');
}