// policy/index.ts - 政策文件专用搜索引擎
import { json } from 'stream/consumers';
import { SearchResult } from '../../types.js';
import { searchBaidu } from '../baidu/baidu.js';
import { searchBing } from '../bing/bing.js';

/**
 * 政府网站域名白名单
 */
const GOVERNMENT_DOMAINS = [
  'gov.cn',           // 中国政府网站
  'jiangxi.gov.cn',   // 江西省政府
  'www.gov.cn',       // 中央政府
  'miit.gov.cn',      // 工信部
  'ndrc.gov.cn',      // 发改委
  'mof.gov.cn',       // 财政部
  'most.gov.cn',      // 科技部
  'mct.gov.cn',       // 文旅部
];

/**
 * 政策文件关键词
 */
const POLICY_KEYWORDS = [
  '政策', '通知', '公告', '办法', '规定', '意见',
  '方案', '计划', '条例', '指导', '措施', '文件'
];

/**
 * 判断是否为政府网站
 * 支持直接URL和百度跳转链接
 */
function isGovernmentSite(url: string, description?: string, source?: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 直接检查 URL
    if (GOVERNMENT_DOMAINS.some(domain => hostname.includes(domain))) {
      return true;
    }
    
    // 检查描述中是否包含政府网站域名
    if (description && GOVERNMENT_DOMAINS.some(domain => description.includes(domain))) {
      return true;
    }
    
    // 检查来源是否包含政府标识
    if (source && (source.includes('政府') || source.includes('gov') || source.includes('人民政府'))) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * 判断是否为政策相关标题
 */
function isPolicyRelated(title: string): boolean {
  return POLICY_KEYWORDS.some(keyword => title.includes(keyword));
}

/**
 * 计算政策相关度分数 (0-100)
 */
function calculatePolicyScore(result: SearchResult): number {
  let score = 0;
  
  // 政府网站判断 +50分（支持从URL、描述、来源识别）
  if (isGovernmentSite(result.url, result.description, result.source)) {
    score += 50;
  }
  
  // 标题包含政策关键词，每个 +10分（最多30分）
  const titleKeywordCount = POLICY_KEYWORDS.filter(kw => 
    result.title.includes(kw)
  ).length;
  score += Math.min(titleKeywordCount * 10, 30);
  
  // 描述包含政策关键词 +10分
  if (result.description && POLICY_KEYWORDS.some(kw => result.description.includes(kw))) {
    score += 10;
  }
  
  // 来源包含政府机构关键词 +10分
  if (result.source && (
    result.source.includes('政府') || 
    result.source.includes('gov') || 
    result.source.includes('人民政府') ||
    result.source.includes('发改委') ||
    result.source.includes('工信部') ||
    result.source.includes('科技部')
  )) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * 构建政策搜索查询词
 */
function buildPolicyQuery(keyword: string, region?: string): string {
  let query = keyword;
  
  // 如果没有明确的政策关键词，添加"政策"
  if (!POLICY_KEYWORDS.some(kw => keyword.includes(kw))) {
    query += ' 政策';
  }
  
  // 如果指定了地区
  if (region) {
    query = `${region} ${query}`;
  }
  
  return query;
}

/**
 * 政策文件搜索（多引擎聚合）
 */
export async function searchPolicy(
  keyword: string,
  limit: number = 10,
  options?: {
    region?: string;           // 地区限定，如"江西省"
    engines?: ('baidu' | 'bing')[]; // 使用的搜索引擎
    minScore?: number;         // 最低政策相关度分数
    governmentOnly?: boolean;  // 是否只返回政府网站
  }
): Promise<SearchResult[]> {
  const {
    region,
    engines = ['baidu', 'bing'],
    minScore = 30,
    governmentOnly = false
  } = options || {};

  console.log(`🔍 政策搜索: "${keyword}"${region ? ` (${region})` : ''}`);
  
  // 构建优化的搜索查询
  const query = buildPolicyQuery(keyword, region);
  console.log(`📝 实际搜索词: "${query}"`);
  
  // 每个引擎分配的数量（多获取一些用于过滤）
  const perEngineLimit = Math.ceil(limit * 2 / engines.length);
  
  // 并行搜索多个引擎
  console.log(`🔎 使用引擎: ${engines.join(', ')}`);
  
  const searchTasks = engines.map(engine => {
    switch (engine) {
      case 'baidu':
        console.log(`  ⏳ 开始百度搜索...`);
        return searchBaidu(query, perEngineLimit).catch(err => {
          console.error('  ❌ 百度搜索失败:', err);
          return [];
        });
      case 'bing':
        console.log(`  ⏳ 开始Bing搜索...`);
        return searchBing(query, perEngineLimit).catch(err => {
          console.error('  ❌ Bing搜索失败:', err);
          return [];
        });
      default:
        return Promise.resolve([]);
    }
  });
  
  const results = await Promise.all(searchTasks);
  const allResults = results.flat();
  
  // 打印每个引擎的结果统计
  engines.forEach((engine, index) => {
    console.log(`  ✓ ${engine}: ${results[index]?.length || 0} 条`);
  });
  console.log(`📊 原始结果总计: ${allResults.length} 条`);
  
  // 计算政策相关度分数
  const scoredResults = allResults.map(result => ({
    ...result,
    policyScore: calculatePolicyScore(result)
  }));
  
  // 过滤和排序
  let filteredResults = scoredResults
    // 过滤：最低分数要求
    .filter(r => r.policyScore >= minScore)
    // 过滤：只要政府网站（可选）
    .filter(r => !governmentOnly || isGovernmentSite(r.url, r.description, r.source))
    // 去重（相同URL）
    .filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    )
    // 按政策相关度排序
    .sort((a, b) => b.policyScore - a.policyScore);
  
  console.log(`✅ 过滤后: ${filteredResults.length} 条政策相关结果`);
  
  // 截取指定数量
  const finalResults = filteredResults.slice(0, limit);
  
  // 添加政策标签到描述
  return finalResults.map(result => ({
    ...result,
    description: `[政策相关度: ${result.policyScore}分] ${result.description}`,
    // 保留原始引擎信息
    engine: `${result.engine}-policy`
  }));
}

/**
 * 高级政策搜索 - 使用站点限定
 */
export async function searchPolicyAdvanced(
  keyword: string,
  limit: number = 10,
  options?: {
    site?: string;        // 指定网站，如"miit.gov.cn", "www.gov.cn"
    fileType?: string;    // 文件类型，如"pdf"
    dateRange?: {         // 时间范围
      start?: string;     // YYYY-MM-DD
      end?: string;
    };
  }
): Promise<SearchResult[]> {
  const { site, fileType, dateRange } = options || {};
  
  // 构建高级搜索查询
  let query = keyword;
  
  // 添加站点限定
  if (site) {
    query += ` site:${site}`;
  }
  
  // 添加文件类型
  if (fileType) {
    query += ` filetype:${fileType}`;
  }
  
  console.log(`🎯 高级搜索: "${query}"`);
  
  // 使用 Bing 搜索（支持高级语法更好）
  const results = await searchBing(query, limit * 2);
  
  // 时间过滤（如果指定）
  let filteredResults = results;
  if (dateRange) {
    // 这里可以添加时间过滤逻辑
    // 注意：需要从搜索结果中提取日期信息
  }
  
  return filteredResults.slice(0, limit);
}
