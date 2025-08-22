/**
 * Database Performance Optimizer
 * 数据库性能优化器 - 索引管理与查询优化
 */

class DatabaseOptimizer {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.indexCache = new Map();
        this.queryMetrics = new Map();
        this.optimizationHistory = [];
        
        this.init();
    }

    init() {
        this.analyzeCurrentSchema();
        this.identifyOptimizationOpportunities();
        this.setupQueryMonitoring();
    }

    async analyzeCurrentSchema() {
        try {
            // Get current table structure and existing indexes
            const tables = await this.getTables();
            const indexes = await this.getExistingIndexes();
            
            console.log('Current database schema analysis:');
            console.log('Tables:', tables);
            console.log('Existing indexes:', indexes);
            
            this.currentSchema = { tables, indexes };
            
        } catch (error) {
            console.error('Failed to analyze database schema:', error);
        }
    }

    async getTables() {
        // SQL to get all tables
        const query = `
            SELECT name, sql 
            FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%'
        `;
        
        if (window.electronAPI && window.electronAPI.executeQuery) {
            return await window.electronAPI.executeQuery(query);
        }
        
        // Mock data for development
        return [
            { name: 'patients', sql: 'CREATE TABLE patients (...)' },
            { name: 'admissions', sql: 'CREATE TABLE admissions (...)' },
            { name: 'treatments', sql: 'CREATE TABLE treatments (...)' }
        ];
    }

    async getExistingIndexes() {
        // SQL to get all indexes
        const query = `
            SELECT name, tbl_name, sql 
            FROM sqlite_master 
            WHERE type='index' 
            AND name NOT LIKE 'sqlite_%'
        `;
        
        if (window.electronAPI && window.electronAPI.executeQuery) {
            return await window.electronAPI.executeQuery(query);
        }
        
        // Mock data for development
        return [
            { name: 'idx_patients_name', tbl_name: 'patients', sql: 'CREATE INDEX idx_patients_name ON patients(姓名)' }
        ];
    }

    identifyOptimizationOpportunities() {
        const recommendations = [];
        
        // Check for missing indexes on commonly queried fields
        const criticalFields = {
            patients: ['姓名', '身份证号', '入住医院', '主要诊断', '入住日期'],
            admissions: ['患者ID', '入住日期', '出院日期', '医院'],
            treatments: ['患者ID', '治疗日期', '治疗类型']
        };
        
        Object.entries(criticalFields).forEach(([table, fields]) => {
            fields.forEach(field => {
                if (!this.hasIndexOnField(table, field)) {
                    recommendations.push({
                        type: 'index',
                        table,
                        field,
                        priority: this.calculateIndexPriority(table, field),
                        sql: this.generateIndexSQL(table, field)
                    });
                }
            });
        });
        
        // Check for missing compound indexes
        const compoundIndexes = [
            { table: 'patients', fields: ['入住医院', '入住日期'], name: 'hospital_admission_date' },
            { table: 'patients', fields: ['主要诊断', '年龄'], name: 'diagnosis_age' },
            { table: 'treatments', fields: ['患者ID', '治疗日期'], name: 'patient_treatment_date' }
        ];
        
        compoundIndexes.forEach(indexDef => {
            if (!this.hasCompoundIndex(indexDef.table, indexDef.fields)) {
                recommendations.push({
                    type: 'compound_index',
                    table: indexDef.table,
                    fields: indexDef.fields,
                    name: indexDef.name,
                    priority: 'high',
                    sql: this.generateCompoundIndexSQL(indexDef)
                });
            }
        });
        
        this.optimizationRecommendations = recommendations;
        console.log('Database optimization recommendations:', recommendations);
        
        return recommendations;
    }

    hasIndexOnField(table, field) {
        if (!this.currentSchema || !this.currentSchema.indexes) return false;
        
        return this.currentSchema.indexes.some(index => 
            index.tbl_name === table && 
            index.sql && index.sql.includes(field)
        );
    }

    hasCompoundIndex(table, fields) {
        if (!this.currentSchema || !this.currentSchema.indexes) return false;
        
        return this.currentSchema.indexes.some(index => {
            if (index.tbl_name !== table || !index.sql) return false;
            
            return fields.every(field => index.sql.includes(field));
        });
    }

    calculateIndexPriority(table, field) {
        // Calculate priority based on field type and usage patterns
        const highPriorityFields = ['姓名', '身份证号', '入住日期'];
        const mediumPriorityFields = ['入住医院', '主要诊断'];
        
        if (highPriorityFields.includes(field)) return 'high';
        if (mediumPriorityFields.includes(field)) return 'medium';
        return 'low';
    }

    generateIndexSQL(table, field) {
        const indexName = `idx_${table}_${field.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${field})`;
    }

    generateCompoundIndexSQL(indexDef) {
        const indexName = `idx_${indexDef.table}_${indexDef.name}`;
        const fieldsList = indexDef.fields.join(', ');
        return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${indexDef.table}(${fieldsList})`;
    }

    async applyOptimizations() {
        if (!this.optimizationRecommendations || this.optimizationRecommendations.length === 0) {
            console.log('No optimization recommendations to apply');
            return;
        }
        
        const results = [];
        
        for (const recommendation of this.optimizationRecommendations) {
            try {
                console.log(`Applying optimization: ${recommendation.sql}`);
                
                const start = performance.now();
                await this.executeQuery(recommendation.sql);
                const duration = performance.now() - start;
                
                results.push({
                    recommendation,
                    success: true,
                    duration,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ Index created successfully: ${recommendation.sql}`);
                
            } catch (error) {
                console.error(`❌ Failed to create index: ${recommendation.sql}`, error);
                
                results.push({
                    recommendation,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        this.optimizationHistory.push(...results);
        
        // Analyze performance improvement
        await this.analyzeOptimizationImpact();
        
        return results;
    }

    async executeQuery(sql) {
        if (window.electronAPI && window.electronAPI.executeQuery) {
            return await window.electronAPI.executeQuery(sql);
        } else {
            // Mock execution for development
            console.log(`Mock execution: ${sql}`);
            return { success: true };
        }
    }

    setupQueryMonitoring() {
        // Monitor query performance if API is available
        if (window.electronAPI && window.electronAPI.monitorQueries) {
            window.electronAPI.monitorQueries((queryData) => {
                this.recordQueryMetrics(queryData);
            });
        }
    }

    recordQueryMetrics(queryData) {
        const { sql, duration, rows, timestamp } = queryData;
        
        const key = this.normalizeQuery(sql);
        
        if (!this.queryMetrics.has(key)) {
            this.queryMetrics.set(key, {
                sql: sql,
                executions: [],
                averageDuration: 0,
                maxDuration: 0,
                totalRows: 0
            });
        }
        
        const metrics = this.queryMetrics.get(key);
        metrics.executions.push({ duration, rows, timestamp });
        
        // Update aggregated metrics
        const executions = metrics.executions;
        metrics.averageDuration = executions.reduce((sum, exec) => sum + exec.duration, 0) / executions.length;
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);
        metrics.totalRows += rows || 0;
        
        // Flag slow queries
        if (duration > 1000) { // > 1 second
            console.warn(`Slow query detected: ${duration}ms for ${sql.substring(0, 100)}...`);
            this.suggestQueryOptimization(sql, duration);
        }
    }

    normalizeQuery(sql) {
        // Normalize SQL for grouping similar queries
        return sql
            .replace(/\s+/g, ' ')
            .replace(/\d+/g, '?')
            .replace(/'[^']*'/g, '?')
            .trim()
            .toLowerCase();
    }

    suggestQueryOptimization(sql, duration) {
        const suggestions = [];
        
        // Analyze query patterns and suggest optimizations
        if (sql.toLowerCase().includes('select * from')) {
            suggestions.push('避免使用 SELECT *，只选择需要的列');
        }
        
        if (sql.toLowerCase().includes('where') && !sql.toLowerCase().includes('index')) {
            suggestions.push('考虑在 WHERE 子句的列上添加索引');
        }
        
        if (sql.toLowerCase().includes('order by')) {
            suggestions.push('考虑在 ORDER BY 列上添加索引');
        }
        
        if (sql.toLowerCase().includes('like %')) {
            suggestions.push('避免以通配符开头的 LIKE 查询，考虑全文搜索');
        }
        
        if (suggestions.length > 0) {
            console.group(`Query Optimization Suggestions (${duration}ms)`);
            suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
            console.groupEnd();
        }
    }

    async analyzeOptimizationImpact() {
        console.log('Analyzing optimization impact...');
        
        // Run test queries to measure performance improvement
        const testQueries = [
            "SELECT COUNT(*) FROM patients WHERE 姓名 LIKE '张%'",
            "SELECT * FROM patients WHERE 入住医院 = '北京儿童医院' ORDER BY 入住日期 DESC LIMIT 10",
            "SELECT 主要诊断, COUNT(*) as count FROM patients GROUP BY 主要诊断 ORDER BY count DESC"
        ];
        
        const results = [];
        
        for (const query of testQueries) {
            try {
                const start = performance.now();
                await this.executeQuery(query);
                const duration = performance.now() - start;
                
                results.push({
                    query: query.substring(0, 50) + '...',
                    duration: duration.toFixed(2),
                    status: 'success'
                });
                
            } catch (error) {
                results.push({
                    query: query.substring(0, 50) + '...',
                    duration: 0,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        console.table(results);
        return results;
    }

    // Query Optimization Methods
    async optimizeCommonQueries() {
        const optimizations = [
            {
                name: '患儿姓名搜索优化',
                original: "SELECT * FROM patients WHERE 姓名 LIKE ?",
                optimized: "SELECT 患者ID, 姓名, 年龄, 入住医院 FROM patients WHERE 姓名 LIKE ? LIMIT 50",
                indexRequired: "CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(姓名)"
            },
            {
                name: '入住日期范围查询优化',
                original: "SELECT * FROM patients WHERE 入住日期 BETWEEN ? AND ?",
                optimized: "SELECT 患者ID, 姓名, 入住日期, 入住医院 FROM patients WHERE 入住日期 BETWEEN ? AND ? ORDER BY 入住日期 DESC",
                indexRequired: "CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(入住日期)"
            },
            {
                name: '医院统计查询优化',
                original: "SELECT 入住医院, COUNT(*) FROM patients GROUP BY 入住医院",
                optimized: "SELECT 入住医院, COUNT(*) as patient_count FROM patients WHERE 入住医院 IS NOT NULL GROUP BY 入住医院 ORDER BY patient_count DESC",
                indexRequired: "CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(入住医院)"
            },
            {
                name: '诊断分类统计优化',
                original: "SELECT 主要诊断, COUNT(*) FROM patients GROUP BY 主要诊断",
                optimized: "SELECT 主要诊断, COUNT(*) as diagnosis_count FROM patients WHERE 主要诊断 IS NOT NULL GROUP BY 主要诊断 ORDER BY diagnosis_count DESC",
                indexRequired: "CREATE INDEX IF NOT EXISTS idx_patients_diagnosis ON patients(主要诊断)"
            }
        ];
        
        for (const optimization of optimizations) {
            try {
                // Create required index
                await this.executeQuery(optimization.indexRequired);
                console.log(`✅ Created index for: ${optimization.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to create index for ${optimization.name}:`, error);
            }
        }
        
        return optimizations;
    }

    async createCriticalIndexes() {
        const criticalIndexes = [
            // Primary search indexes
            "CREATE INDEX IF NOT EXISTS idx_patients_name_pinyin ON patients(姓名)",
            "CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(身份证号)",
            
            // Date-based indexes for timeline queries
            "CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(入住日期)",
            "CREATE INDEX IF NOT EXISTS idx_patients_discharge_date ON patients(出院日期)",
            
            // Hospital and medical indexes
            "CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(入住医院)",
            "CREATE INDEX IF NOT EXISTS idx_patients_diagnosis ON patients(主要诊断)",
            "CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(入住状态)",
            
            // Compound indexes for common query patterns
            "CREATE INDEX IF NOT EXISTS idx_patients_hospital_date ON patients(入住医院, 入住日期)",
            "CREATE INDEX IF NOT EXISTS idx_patients_diagnosis_age ON patients(主要诊断, 年龄)",
            "CREATE INDEX IF NOT EXISTS idx_patients_status_hospital ON patients(入住状态, 入住医院)",
            
            // Age-based indexing for statistics
            "CREATE INDEX IF NOT EXISTS idx_patients_age_group ON patients(年龄)",
            
            // Treatment tracking indexes (if treatments table exists)
            "CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(患者ID)",
            "CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(治疗日期)",
            "CREATE INDEX IF NOT EXISTS idx_treatments_type ON treatments(治疗类型)"
        ];
        
        const results = [];
        let successCount = 0;
        
        for (const indexSQL of criticalIndexes) {
            try {
                const start = performance.now();
                await this.executeQuery(indexSQL);
                const duration = performance.now() - start;
                
                results.push({
                    sql: indexSQL,
                    success: true,
                    duration: duration.toFixed(2),
                    timestamp: new Date().toISOString()
                });
                
                successCount++;
                console.log(`✅ Index created: ${indexSQL}`);
                
            } catch (error) {
                results.push({
                    sql: indexSQL,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`❌ Index creation failed: ${indexSQL}`, error);
            }
        }
        
        console.log(`Database indexing completed: ${successCount}/${criticalIndexes.length} indexes created successfully`);
        
        return {
            totalIndexes: criticalIndexes.length,
            successfulIndexes: successCount,
            results
        };
    }

    async optimizeQueryPerformance() {
        const optimizations = [];
        
        // VACUUM to reclaim space and optimize storage
        try {
            console.log('Running VACUUM to optimize database storage...');
            const start = performance.now();
            await this.executeQuery('VACUUM');
            const duration = performance.now() - start;
            
            optimizations.push({
                operation: 'VACUUM',
                success: true,
                duration: duration.toFixed(2),
                benefit: 'Reclaimed unused space and optimized storage'
            });
            
            console.log(`✅ VACUUM completed in ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            optimizations.push({
                operation: 'VACUUM',
                success: false,
                error: error.message
            });
            console.error('❌ VACUUM failed:', error);
        }
        
        // ANALYZE to update query planner statistics
        try {
            console.log('Running ANALYZE to update statistics...');
            const start = performance.now();
            await this.executeQuery('ANALYZE');
            const duration = performance.now() - start;
            
            optimizations.push({
                operation: 'ANALYZE',
                success: true,
                duration: duration.toFixed(2),
                benefit: 'Updated query planner statistics'
            });
            
            console.log(`✅ ANALYZE completed in ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            optimizations.push({
                operation: 'ANALYZE',
                success: false,
                error: error.message
            });
            console.error('❌ ANALYZE failed:', error);
        }
        
        // Optimize common slow queries
        await this.optimizeSlowQueries();
        
        return optimizations;
    }

    async optimizeSlowQueries() {
        // Identify and optimize slow queries based on metrics
        const slowQueries = Array.from(this.queryMetrics.entries())
            .filter(([key, metrics]) => metrics.averageDuration > 500)
            .sort((a, b) => b[1].averageDuration - a[1].averageDuration);
        
        console.log(`Found ${slowQueries.length} slow queries to optimize`);
        
        for (const [queryKey, metrics] of slowQueries.slice(0, 5)) { // Top 5 slowest
            await this.optimizeSpecificQuery(metrics.sql, metrics);
        }
    }

    async optimizeSpecificQuery(sql, metrics) {
        // Analyze query execution plan
        try {
            const explainQuery = `EXPLAIN QUERY PLAN ${sql}`;
            const plan = await this.executeQuery(explainQuery);
            
            console.log(`Query plan for slow query (${metrics.averageDuration.toFixed(2)}ms avg):`, plan);
            
            // Suggest specific optimizations based on execution plan
            this.suggestQueryOptimizations(sql, plan, metrics);
            
        } catch (error) {
            console.error('Failed to get query plan:', error);
        }
    }

    suggestQueryOptimizations(sql, plan, metrics) {
        const suggestions = [];
        
        // Analyze execution plan for optimization opportunities
        if (plan && Array.isArray(plan)) {
            plan.forEach(step => {
                if (step.detail && step.detail.includes('SCAN TABLE')) {
                    suggestions.push('查询正在进行全表扫描，建议添加相关索引');
                }
                
                if (step.detail && step.detail.includes('USING TEMP B-TREE')) {
                    suggestions.push('查询使用临时B树，建议优化ORDER BY或GROUP BY的索引');
                }
                
                if (step.detail && step.detail.includes('NO QUERY SOLUTION')) {
                    suggestions.push('查询优化器找不到好的执行计划，检查索引配置');
                }
            });
        }
        
        // General optimization suggestions
        if (sql.toLowerCase().includes('select *')) {
            suggestions.push('避免使用SELECT *，只选择需要的列以减少数据传输');
        }
        
        if (sql.toLowerCase().includes('order by') && !sql.toLowerCase().includes('limit')) {
            suggestions.push('ORDER BY查询建议添加LIMIT限制结果集大小');
        }
        
        if (suggestions.length > 0) {
            console.group(`Query Optimization Suggestions (Avg: ${metrics.averageDuration.toFixed(2)}ms)`);
            suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
            console.groupEnd();
        }
    }

    async analyzeOptimizationImpact() {
        // Run benchmark queries to measure improvement
        const benchmarkQueries = [
            {
                name: '患儿姓名搜索',
                sql: "SELECT COUNT(*) FROM patients WHERE 姓名 LIKE '张%'"
            },
            {
                name: '医院统计查询',
                sql: "SELECT 入住医院, COUNT(*) FROM patients GROUP BY 入住医院"
            },
            {
                name: '日期范围查询',
                sql: "SELECT COUNT(*) FROM patients WHERE 入住日期 >= date('now', '-30 days')"
            }
        ];
        
        const benchmarkResults = [];
        
        for (const benchmark of benchmarkQueries) {
            try {
                const start = performance.now();
                await this.executeQuery(benchmark.sql);
                const duration = performance.now() - start;
                
                benchmarkResults.push({
                    name: benchmark.name,
                    duration: duration.toFixed(2),
                    status: 'success'
                });
                
            } catch (error) {
                benchmarkResults.push({
                    name: benchmark.name,
                    duration: 0,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        console.log('Post-optimization benchmark results:');
        console.table(benchmarkResults);
        
        return benchmarkResults;
    }

    // Cache Management
    setupQueryCache() {
        this.queryCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        
        // Cache cleanup interval
        setInterval(() => {
            this.cleanupQueryCache();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    cacheQuery(sql, params, result) {
        const cacheKey = this.generateCacheKey(sql, params);
        
        this.queryCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            accessCount: 1
        });
        
        // Limit cache size
        if (this.queryCache.size > 100) {
            this.evictOldestCacheEntry();
        }
    }

    getCachedQuery(sql, params) {
        const cacheKey = this.generateCacheKey(sql, params);
        const cached = this.queryCache.get(cacheKey);
        
        if (cached) {
            // Check if cache is still valid (5 minutes)
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                cached.accessCount++;
                this.cacheStats.hits++;
                return cached.result;
            } else {
                this.queryCache.delete(cacheKey);
            }
        }
        
        this.cacheStats.misses++;
        return null;
    }

    generateCacheKey(sql, params) {
        return `${sql}|${JSON.stringify(params || {})}`;
    }

    cleanupQueryCache() {
        const maxAge = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();
        
        this.queryCache.forEach((value, key) => {
            if (now - value.timestamp > maxAge) {
                this.queryCache.delete(key);
                this.cacheStats.evictions++;
            }
        });
    }

    evictOldestCacheEntry() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        this.queryCache.forEach((value, key) => {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        });
        
        if (oldestKey) {
            this.queryCache.delete(oldestKey);
            this.cacheStats.evictions++;
        }
    }

    // Public API Methods
    async runFullOptimization() {
        console.log('🚀 Starting full database optimization...');
        
        const results = {
            indexCreation: await this.createCriticalIndexes(),
            queryOptimization: await this.optimizeQueryPerformance(),
            impact: await this.analyzeOptimizationImpact(),
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Database optimization completed:', results);
        
        return results;
    }

    getOptimizationReport() {
        return {
            schema: this.currentSchema,
            recommendations: this.optimizationRecommendations,
            history: this.optimizationHistory,
            queryMetrics: Object.fromEntries(this.queryMetrics),
            cacheStats: this.cacheStats,
            timestamp: new Date().toISOString()
        };
    }

    exportOptimizationReport() {
        const report = this.getOptimizationReport();
        
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `数据库优化报告_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Database optimization report exported');
    }

    // Monitoring and Alerting
    startPerformanceAlerts() {
        setInterval(() => {
            this.checkPerformanceThresholds();
        }, 30000); // Check every 30 seconds
    }

    checkPerformanceThresholds() {
        // Check recent query performance
        const recentQueries = this.getRecentQueries(60000); // Last minute
        const slowQueries = recentQueries.filter(q => q.duration > 1000);
        
        if (slowQueries.length > 3) {
            console.warn(`Performance alert: ${slowQueries.length} slow queries in the last minute`);
            this.triggerPerformanceAlert('slow_queries', slowQueries.length);
        }
        
        // Check cache hit rate
        const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
        if (totalCacheRequests > 10) {
            const hitRate = (this.cacheStats.hits / totalCacheRequests) * 100;
            if (hitRate < 50) {
                console.warn(`Low cache hit rate: ${hitRate.toFixed(1)}%`);
                this.triggerPerformanceAlert('low_cache_hit_rate', hitRate);
            }
        }
    }

    getRecentQueries(timeWindowMs) {
        const cutoff = Date.now() - timeWindowMs;
        const recentQueries = [];
        
        this.queryMetrics.forEach(metrics => {
            const recent = metrics.executions.filter(exec => exec.timestamp > cutoff);
            recentQueries.push(...recent);
        });
        
        return recentQueries;
    }

    triggerPerformanceAlert(type, value) {
        // Could integrate with monitoring systems
        console.warn(`Performance Alert - ${type}: ${value}`);
        
        // Show notification in development mode
        if (window.location.search.includes('dev=true')) {
            if (window.performanceOptimizer && window.performanceOptimizer.showNotification) {
                window.performanceOptimizer.showNotification(
                    `性能警告: ${type} = ${value}`, 
                    'warning'
                );
            }
        }
    }

    // Cleanup
    destroy() {
        // Stop monitoring intervals
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
        
        // Clear caches
        this.queryCache.clear();
        this.indexCache.clear();
        
        console.log('Database optimizer destroyed');
    }
}

// Database Optimization Configuration
class DatabaseConfig {
    static getOptimalSettings() {
        return {
            // SQLite PRAGMA settings for optimization
            pragmas: [
                'PRAGMA journal_mode = WAL',           // Write-Ahead Logging for better concurrency
                'PRAGMA synchronous = NORMAL',         // Balance between safety and performance
                'PRAGMA cache_size = 10000',          // 10MB cache size
                'PRAGMA temp_store = MEMORY',         // Store temporary tables in memory
                'PRAGMA mmap_size = 268435456',       // 256MB memory mapping
                'PRAGMA optimize',                    // Run optimization routines
            ],
            
            // Connection pool settings
            connectionPool: {
                min: 1,
                max: 10,
                idleTimeoutMillis: 30000,
                acquireTimeoutMillis: 60000
            },
            
            // Query optimization settings
            queryOptimization: {
                enableCache: true,
                cacheSize: 100,
                cacheTTL: 300000, // 5 minutes
                slowQueryThreshold: 1000, // 1 second
                enableQueryLogging: false // Enable in development only
            }
        };
    }

    static async applyOptimalSettings() {
        const settings = this.getOptimalSettings();
        const results = [];
        
        for (const pragma of settings.pragmas) {
            try {
                if (window.electronAPI && window.electronAPI.executeQuery) {
                    await window.electronAPI.executeQuery(pragma);
                    results.push({ pragma, success: true });
                    console.log(`✅ Applied: ${pragma}`);
                } else {
                    console.log(`Mock: ${pragma}`);
                    results.push({ pragma, success: true, mock: true });
                }
            } catch (error) {
                results.push({ pragma, success: false, error: error.message });
                console.error(`❌ Failed to apply: ${pragma}`, error);
            }
        }
        
        return results;
    }
}

// Initialize database optimizer
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we have database access
    if (window.electronAPI) {
        window.databaseOptimizer = new DatabaseOptimizer();
        
        // Apply optimal database settings
        DatabaseConfig.applyOptimalSettings()
            .then(results => {
                console.log('Database configuration applied:', results);
            })
            .catch(error => {
                console.error('Failed to apply database configuration:', error);
            });
    } else {
        console.log('Database optimizer initialized in mock mode');
        window.databaseOptimizer = new DatabaseOptimizer();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseOptimizer, DatabaseConfig };
}