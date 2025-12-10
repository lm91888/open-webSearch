// policy/test.ts - 政策搜索测试脚本
import { searchPolicy, searchPolicyAdvanced } from './index.js';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

async function testBasicPolicySearch() {
    console.log('🧪 测试1: 基础政策搜索');
    console.log('=' .repeat(50));
    
    const results = await searchPolicy(
        '江西省1269行动计划',
        10,
        {
            region: '江西省',
            engines: ['baidu', 'bing'],
            minScore: 30,
            governmentOnly: false
        }
    );
    
    console.log(`\n✅ 找到 ${results.length} 条政策文件:\n`);
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   来源: ${result.source}`);
        console.log(`   ${result.description.substring(0, 150)}...`);
        console.log('');
    });
}

async function testAdvancedPolicySearch() {
    console.log('\n🧪 测试2: 高级政策搜索（指定网站）');
    console.log('=' .repeat(50));
    
    const results = await searchPolicyAdvanced(
        '人工智能发展政策',
        10,
        {
            site: 'miit.gov.cn'
        }
    );
    
    console.log(`\n✅ 找到 ${results.length} 条 miit.gov.cn 的政策:\n`);
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   描述: ${result.description.substring(0, 100)}...`);
        console.log('');
    });
}

async function testSiteSearch() {
    console.log('\n🧪 测试3: 站点限定搜索');
    console.log('=' .repeat(50));
    
    const results = await searchPolicyAdvanced(
        '制造业',
        10,
        {
            site: 'www.gov.cn'
        }
    );
    
    console.log(`\n✅ 找到 ${results.length} 条 www.gov.cn 的结果:\n`);
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log('');
    });
}

async function testGovernmentOnlySearch() {
    console.log('\n🧪 测试4: 仅政府网站搜索（降低门槛）');
    console.log('=' .repeat(50));
    
    const results = await searchPolicy(
        '数字经济政策',
        10,
        {
            engines: ['baidu', 'bing'],
            minScore: 30,  // 降低到30分
            governmentOnly: true
        }
    );
    
    console.log(`\n✅ 找到 ${results.length} 条政府网站结果:\n`);
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   来源: ${result.source}`);
        console.log(`   ${result.description}`);
        console.log('');
    });
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const testType = args[0] || 'all';
    
    console.log('🚀 政策搜索引擎测试\n');
    
    try {
        switch (testType) {
            case 'basic':
                await testBasicPolicySearch();
                break;
            case 'advanced':
                await testAdvancedPolicySearch();
                break;
            case 'site':
                await testSiteSearch();
                break;
            case 'gov':
                await testGovernmentOnlySearch();
                break;
            case 'all':
            default:
                await testBasicPolicySearch();
                await testAdvancedPolicySearch();
                await testSiteSearch();
                await testGovernmentOnlySearch();
                break;
        }
        
        console.log('\n✅ 所有测试完成！');
    } catch (error) {
        console.error('\n❌ 测试失败:', error);
        process.exit(1);
    }
}

// 检测是否直接运行此文件
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.argv[1]);
if (currentFilePath === scriptPath) {
    main();
}
