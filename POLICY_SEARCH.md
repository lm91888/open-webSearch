# 政策搜索 MCP 工具使用指南

## 📋 功能概述

基于多搜索引擎的智能政策文件搜索工具，专门用于查找政府政策文档。

### 🎯 核心特性

- ✅ **多引擎聚合** - 整合百度、Bing 搜索结果
- 🎯 **智能过滤** - 自动识别政府网站和政策文件
- 📊 **相关度评分** - 0-100分政策相关度评分系统
- 🌐 **站点限定** - 可指定特定政府网站（如 www.gov.cn, miit.gov.cn）
- 📄 **文件类型** - 支持 PDF、DOC 等文件类型过滤
- 🗺️ **地区筛选** - 支持按省市地区搜索政策

---

## 🚀 快速开始

### 1. 启动服务

```bash
cd open-webSearch
npm run dev
```

### 2. 配置 MCP 客户端

**Claude Desktop / VSCode:**
```json
{
  "mcpServers": {
    "policy-search": {
      "transport": {
        "type": "stdio",
        "command": "npx",
        "args": ["open-websearch@latest"],
        "env": {
          "MODE": "stdio"
        }
      }
    }
  }
}
```

**Cherry Studio (HTTP模式):**
```json
{
  "mcpServers": {
    "policy-search": {
      "name": "Policy Search MCP",
      "type": "streamableHttp",
      "baseUrl": "http://localhost:3000/mcp"
    }
  }
}
```

---

## 🔧 MCP 工具使用

### 工具 1: `searchPolicy` - 基础政策搜索

智能搜索政府政策文件，支持多引擎聚合和相关度过滤。

**参数:**
```typescript
{
  keyword: string,           // 必填：搜索关键词
  limit?: number,            // 可选：返回结果数量 (默认: 10, 最大: 50)
  region?: string,           // 可选：地区限定，如 "江西省"
  engines?: string[],        // 可选：使用的引擎 (默认: ['baidu', 'bing'])
  minScore?: number,         // 可选：最低政策相关度 (默认: 30)
  governmentOnly?: boolean   // 可选：仅返回政府网站 (默认: false)
}
```

**使用示例:**

```typescript
// 示例 1: 基础搜索
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicy",
  arguments: {
    keyword: "江西省1269行动计划",
    limit: 10
  }
})

// 示例 2: 带地区限定
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicy",
  arguments: {
    keyword: "产业链政策",
    region: "江西省",
    limit: 15,
    minScore: 50,
    governmentOnly: true
  }
})

// 示例 3: 高相关度政府网站搜索
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicy",
  arguments: {
    keyword: "人工智能发展规划",
    engines: ["baidu", "bing"],
    minScore: 60,
    governmentOnly: true
  }
})
```

**返回示例:**
```json
{
  "query": "江西省1269行动计划",
  "region": "江西省",
  "engines": ["baidu", "bing"],
  "filters": {
    "minScore": 30,
    "governmentOnly": false
  },
  "totalResults": 10,
  "results": [
    {
      "title": "江西省制造业重点产业链现代化建设"1269"行动计划",
      "url": "https://www.jiangxi.gov.cn/...",
      "description": "[政策相关度: 85分] 江西省人民政府关于印发...",
      "source": "江西省人民政府",
      "engine": "baidu-policy",
      "policyScore": 85
    }
  ]
}
```

---

### 工具 2: `searchPolicyAdvanced` - 高级政策搜索

使用高级搜索语法，支持站点、文件类型等精确过滤。

**参数:**
```typescript
{
  keyword: string,           // 必填：搜索关键词
  limit?: number,            // 可选：返回结果数量 (默认: 10)
  site?: string,             // 可选：指定网站域名，如 'www.gov.cn', 'miit.gov.cn'
  fileType?: string          // 可选：文件类型，如 'pdf', 'doc', 'docx'
}
```

**使用示例:**

```typescript
// 示例 1: 指定网站搜索（工信部）
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "人工智能发展",
    site: "miit.gov.cn",
    limit: 10
  }
})

// 示例 2: 指定网站搜索（中国政府网）
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "数字经济",
    site: "www.gov.cn",
    limit: 15
  }
})

// 示例 3: 搜索 PDF 文件
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "产业发展规划",
    site: "ndrc.gov.cn",
    fileType: "pdf"
  }
})

// 示例 4: 组合查询（站点 + 文件类型）
use_mcp_tool({
  server_name: "policy-search",
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "制造业转型升级",
    site: "miit.gov.cn",
    fileType: "pdf",
    limit: 20
  }
})
```

**返回示例:**
```json
{
  "query": "人工智能发展 site:miit.gov.cn",
  "filters": {
    "site": "miit.gov.cn",
    "fileType": null
  },
  "totalResults": 10,
  "results": [
    {
      "title": "促进新一代人工智能产业发展三年行动计划",
      "url": "https://www.miit.gov.cn/...",
      "description": "工业和信息化部关于印发...",
      "source": "工信部",
      "engine": "bing"
    }
  ]
}
```

---

## 🎯 政策相关度评分规则

系统会自动计算每个结果的政策相关度分数（0-100分）：

| 评分项 | 分数 | 说明 |
|--------|------|------|
| 政府网站域名 | +50 | URL 包含 .gov.cn |
| 标题政策关键词 | +10/个 | 最多 +30 |
| 描述政策关键词 | +10 | 内容相关 |
| 来源政府机构 | +10 | 官方来源 |

**政策关键词包括:**
- 政策、通知、公告、办法、规定、意见
- 方案、计划、条例、指导、措施、文件

---

## 🏛️ 支持的政府网站

### 国家级
- www.gov.cn - 中国政府网
- miit.gov.cn - 工业和信息化部
- ndrc.gov.cn - 国家发展改革委
- mof.gov.cn - 财政部
- most.gov.cn - 科技部
- mct.gov.cn - 文化和旅游部

### 省级
- jiangxi.gov.cn - 江西省人民政府
- （其他省份可自行添加）

---

## 🧪 测试脚本

### 运行测试
```bash
# 运行所有测试
npx tsx src/engines/policy/test.ts

# 运行单个测试
npx tsx src/engines/policy/test.ts basic      # 基础搜索
npx tsx src/engines/policy/test.ts advanced   # 高级搜索
npx tsx src/engines/policy/test.ts site       # 站点搜索
npx tsx src/engines/policy/test.ts gov        # 仅政府网站
```

---

## 💡 使用场景示例

### 场景 1: 研究地方产业政策
```typescript
// AI 助手对话
User: "帮我找一下江西省关于1269行动计划的政策文件"

AI 调用:
use_mcp_tool({
  tool_name: "searchPolicy",
  arguments: {
    keyword: "1269行动计划",
    region: "江西省",
    governmentOnly: true,
    minScore: 50
  }
})
```

### 场景 2: 查找特定网站文件
```typescript
User: "查找工信部网站关于人工智能的最新政策"

AI 调用:
use_mcp_tool({
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "人工智能",
    site: "miit.gov.cn"
  }
})
```

### 场景 3: 下载政策原文
```typescript
User: "找一下中国政府网关于数字经济的 PDF 文件"

AI 调用:
use_mcp_tool({
  tool_name: "searchPolicyAdvanced",
  arguments: {
    keyword: "数字经济",
    site: "www.gov.cn",
    fileType: "pdf"
  }
})
```

---

## ⚙️ 环境变量配置

```bash
# 自定义工具名称
MCP_TOOL_SEARCH_POLICY_NAME=searchPolicy
MCP_TOOL_SEARCH_POLICY_ADVANCED_NAME=searchPolicyAdvanced

# 服务模式
MODE=both  # both/http/stdio

# 代理配置（如果需要）
USE_PROXY=true
PROXY_URL=http://127.0.0.1:7890
```

---

## 📊 性能优化建议

1. **合理设置 minScore** - 一般搜索用 30，精确搜索用 50-70
2. **优先使用高级搜索** - 明确网站时使用 `searchPolicyAdvanced`
3. **控制返回数量** - 建议 10-20 条，避免过度请求
4. **使用地区限定** - 搜索地方政策时添加 `region` 参数
5. **指定站点搜索** - 知道政策来源时直接用 `site` 参数提高精确度

---

## 🔍 常见问题

**Q: 为什么搜索结果很少？**
A: 尝试降低 `minScore` 或关闭 `governmentOnly`

**Q: 如何只搜索特定网站？**
A: 使用 `searchPolicyAdvanced` 并设置 `site` 参数

**Q: 支持哪些文件类型？**
A: 支持 pdf, doc, docx 等，使用 `fileType` 参数

**Q: 可以搜索历史政策吗？**
A: 可以，搜索引擎会返回所有时间范围的结果

---

## 📝 更新日志

### v1.0.0 (2025-12-09)
- ✅ 基础政策搜索功能
- ✅ 高级政策搜索（部门、站点、文件类型）
- ✅ 政策相关度评分系统
- ✅ 多搜索引擎聚合（百度、Bing）
- ✅ 政府网站自动识别
- ✅ MCP 工具集成

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
