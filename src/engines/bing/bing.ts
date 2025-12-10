import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResult } from '../../types.js';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

export async function searchBing(query: string, limit: number): Promise<SearchResult[]> {
    let allResults: SearchResult[] = [];
    let pn = 0;
    console.log("bing")
    while (allResults.length < limit) {
        // 简化参数，使用更真实的浏览器请求
        const response = await axios.get('https://www.bing.com/search', {
            params: {
                q: query,
                first: 1 + pn * 10
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'Referer': 'https://www.bing.com/'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const results: SearchResult[] = [];

        // 保存 HTML 到文件
        // const fs = await import('fs');
        // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // const filename = `bing-response-pn${pn}-${timestamp}.html`;
        // await fs.promises.writeFile(filename, response.data, 'utf-8');
        // console.log(`💾 HTML 已保存到: ${filename}`);

        $('#b_content').children()
            .find('#b_results').children()
            .each((i, element) => {
                const titleElement = $(element).find('h2');
                const linkElement = $(element).find('a');
                const snippetElement = $(element).find('p').first();

                if (titleElement.length && linkElement.length) {
                    const url = linkElement.attr('href');
                    if (url && url.startsWith('http')) {

                        const sourceElement = $(element).find('.b_tpcn');
                        
                        // 提取发布日期（Bing通常在 .b_caption 或 .b_attribution 中）
                        let publishDate = '';
                        const captionElement = $(element).find('.b_caption, .b_attribution');
                        const captionText = captionElement.text();
                        
                        // 匹配多种日期格式
                        const datePatterns = [
                            /\d{4}年\d{1,2}月\d{1,2}日/,  // 2024年3月8日
                            /\d{4}-\d{1,2}-\d{1,2}/,      // 2024-03-08
                            /\d{1,2}\/\d{1,2}\/\d{4}/,    // 3/8/2024
                            /\d{4}\.\d{1,2}\.\d{1,2}/     // 2024.03.08
                        ];
                        
                        for (const pattern of datePatterns) {
                            const match = captionText.match(pattern);
                            if (match) {
                                publishDate = match[0];
                                break;
                            }
                        }
                        
                        results.push({
                            title: titleElement.text(),
                            url: url,
                            description: snippetElement.text().trim() || '',
                            source: sourceElement.text().trim() || '',
                            engine: 'bing',
                            publishDate: publishDate || undefined
                        });
                    }
                }
            });

        allResults = allResults.concat(results);

        if (results.length === 0) {
            console.error('⚠️ No more results, ending early....');
            break;
        }

        pn += 1;
    }

    return allResults.slice(0, limit); // 截取最多 limit 个
}

// 单文件运行入口
async function main() {
    const args = process.argv.slice(2);
    const query = args[0] || '江西省1269行动计划12条重点产业链相关政策';
    const limit = parseInt(args[1]) || 10;

    console.log(`🔍 开始搜索: "${query}", 限制: ${limit} 条结果\n`);
    
    try {
        const results = await searchBing(query, limit);
        console.log(`✅ 成功获取 ${results.length} 条结果:\n`);
        
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   来源: ${result.source}`);
            console.log(`   描述: ${result.description.substring(0, 100)}...`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ 搜索失败:', error);
        process.exit(1);
    }
}

// 检测是否直接运行此文件
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = resolve(process.argv[1]);
if (currentFilePath === scriptPath) {
    main();
}
