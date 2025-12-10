// policy/test-simple.ts - 简单测试脚本
import { searchPolicy } from './index.js';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function main() {
    console.log('🧪 简单政策搜索测试\n');
    console.log('=' .repeat(50));
    
    const results = await searchPolicy(
        '江西省"1269"行动计划制造业数字化转型政策',
        40,
        {
            // region: '江西省',
            engines: ['baidu','bing'],  // 只用百度
            minScore: 30,
            governmentOnly: false  // 不限制政府网站
        }
    );
    
    console.log(`\n✅ 找到 ${results.length} 条结果:\n`);
    results.forEach((result, index) => {
        console.log(`${index + 1}. 【${(result as any).policyScore}分】${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   来源: ${result.source || '无'}`);
        console.log(`   日期: ${result.publishDate || '未知'}`);
        console.log(`   引擎: ${result.engine}`);
        console.log(`   描述: ${result.description}`);
        console.log('');
    });
}

// 检测是否直接运行此文件
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.argv[1]);
if (currentFilePath === scriptPath) {
    main().catch(error => {
        console.error('❌ 测试失败:', error);
        process.exit(1);
    });
}
