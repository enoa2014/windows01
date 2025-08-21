// Excel诊断工具 - 用于调试Excel导入问题

class ExcelDiagnostics {
    static analyzeExcelStructure(rawData) {
        console.log('📊 Excel文件结构分析');
        console.log('================');
        
        if (!rawData || rawData.length < 2) {
            console.error('❌ Excel文件数据不足，至少需要表头和数据行');
            return null;
        }
        
        // 分析表头结构
        const headerRow1 = rawData[0] || [];
        const headerRow2 = rawData[1] || [];
        
        console.log('🏷️  表头行分析:');
        console.log('  第1行:', headerRow1);
        console.log('  第2行:', headerRow2);
        
        // 合并表头
        const combinedHeaders = headerRow1.map((h1, index) => {
            const h2 = headerRow2[index] || '';
            return `${h1 || ''}${h2 || ''}`.trim();
        });
        
        console.log('🔗 合并后的表头:');
        combinedHeaders.forEach((header, index) => {
            console.log(`  列${index}: "${header}"`);
        });
        
        // 检查可能的姓名字段
        const nameColumns = [];
        combinedHeaders.forEach((header, index) => {
            if (this.couldBeName(header)) {
                nameColumns.push({ index, header, confidence: this.getNameConfidence(header) });
            }
        });
        
        console.log('👤 可能的姓名字段:');
        nameColumns.sort((a, b) => b.confidence - a.confidence).forEach(col => {
            console.log(`  列${col.index}: "${col.header}" (置信度: ${col.confidence})`);
        });
        
        // 分析数据行样例
        if (rawData.length > 2) {
            console.log('📝 数据行样例分析:');
            const sampleRow = rawData[2];
            nameColumns.forEach(col => {
                const value = sampleRow[col.index];
                console.log(`  列${col.index} ("${col.header}"): "${value}"`);
            });
        }
        
        return {
            headers: combinedHeaders,
            nameColumns,
            sampleData: rawData.length > 2 ? rawData[2] : null
        };
    }
    
    static couldBeName(header) {
        const namePatterns = [
            /姓名/,
            /患者.*姓名|患者.*名字/,
            /患儿.*姓名|患儿.*名字/,
            /病人.*姓名|病人.*名字/,
            /姓氏/,
            /名字/,
            /母亲.*姓名|母亲.*名字/, // 可能被错误标记的
            /父亲.*姓名|父亲.*名字/, // 可能被错误标记的
        ];
        
        return namePatterns.some(pattern => pattern.test(header));
    }
    
    static getNameConfidence(header) {
        // 计算字段为患者姓名的置信度
        if (/^姓名$/.test(header)) return 100;
        if (/患者姓名|患儿姓名/.test(header)) return 95;
        if (/病人姓名/.test(header)) return 90;
        if (/^名字$/.test(header)) return 85;
        if (/母亲.*姓名/.test(header)) return 10; // 很可能是母亲姓名
        if (/父亲.*姓名/.test(header)) return 10; // 很可能是父亲姓名
        return 50; // 默认中等置信度
    }
    
    static suggestFieldMapping(analysisResult) {
        console.log('💡 字段映射建议:');
        
        if (!analysisResult.nameColumns.length) {
            console.error('❌ 未找到任何可能的姓名字段！');
            return null;
        }
        
        // 选择置信度最高的作为患者姓名
        const bestNameField = analysisResult.nameColumns[0];
        console.log(`✅ 建议使用列${bestNameField.index} ("${bestNameField.header}") 作为患者姓名`);
        
        // 检查是否可能存在字段混乱
        const suspiciousFields = analysisResult.nameColumns.filter(col => 
            col.header.includes('母亲') || col.header.includes('父亲')
        );
        
        if (suspiciousFields.length > 0) {
            console.warn('⚠️  检测到可能的字段混乱:');
            suspiciousFields.forEach(col => {
                console.warn(`    列${col.index}: "${col.header}" 可能不是患者姓名`);
            });
        }
        
        return bestNameField;
    }
}

module.exports = ExcelDiagnostics;