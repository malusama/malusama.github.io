# Malu Blog

站点：https://malu.moe/

这是可以从源码完整重建的 Hugo 博客。恢复以 `1d902498` 的线上版本为基准，保留当前外观、交互和历史地址，没有换主题。

## 构建与预览

使用 Node.js 24、Hugo **0.165.0**（标准版即可）。版本分别固定在 `.nvmrc`、`.hugo-version`；Hugo 可安装到 PATH，也可以将官方二进制放在 `.tools/hugo`，或通过 `HUGO_BIN` 指定路径。

```sh
npm ci --ignore-scripts
npm run check
npm run preview
```

打开 http://127.0.0.1:4178/ 。修改源文件后重新执行 `npm run build`，再刷新页面。需要显示草稿时执行 `npm run build:drafts`。预览不自动监听文件。

完整流程：`content/ + layouts/ + static/ → Hugo → 原有 enhance.mjs → public/`。每次构建从空目录开始，只有两个阶段都成功才替换 `public/`。不依赖历史生成页面，不需要下载远程主题或图片。

`hugo server` 只执行第一阶段，不会套用完整的现有展示层；请用上面的 npm 命令预览。此次保留已验证的 Node 展示层，避免为了纯 Hugo 模板重写而引入外观变化。

## 写新文章

```sh
npm run new -- my-new-post "我的新文章"
```

编辑生成的 `content/post/my-new-post.md`。开头的 JSON 是 Hugo 支持的 front matter，用于保存标题、日期、固定地址、标签、分类及草稿状态；后面直接写 Markdown：

```markdown
{
  "title": "我的新文章",
  "date": "2026-09-07T14:00:00+08:00",
  "url": "/post/my-new-post/",
  "draft": true,
  "tags": ["技术"],
  "categories": []
}

这里是正文。

## 一个小标题

继续写内容。
```

1. `npm run build:drafts` 后通过 `npm run preview` 查看草稿。
2. 准备发布时将 `draft` 改为 `false`，运行 `npm run check`。
3. 提交源文件，通过 PR 合入 `master`。完成下方的一次性 Pages 切换后，Actions 自动构建和发布。

首页、归档、标签、分类、搜索索引、RSS、站点地图和上一篇／下一篇都会自动更新。发布后的 `url` 请保持稳定，它也是现有 utterances 评论关联路径。

## 旧文章与样式

- `content/post/*.html`：恢复的 36 篇旧文章。保留 HTML 正文、代码高亮、图片和锚点，不冒充找回了原始 Markdown。Hugo 原生支持 HTML 与 Markdown 混用。
- `content/tags/`、`content/categories/`：历史分类地址，保留 `Python`、`Life` 等大小写。
- `layouts/`：Hugo 页面骨架、文章、动态列表、搜索元数据和 RSS 模板。
- `scripts/enhance.mjs`：保留当前首页、关于、阅读页的展示模板及图片尺寸、摘要、目录等处理。
- `static/assets/blog.css`、`blog.js`、`theme.js`：原样保留的现有样式与交互脚本。
- `static/assets/image-metadata.json`：图片尺寸缓存。添加 OSS 图片后先构建，再执行 `node scripts/refresh-images.mjs`，最后重新构建；普通构建离线运行。

原始 Hugo 配置及 Markdown 没有在此次检查的本机常见目录或该仓库历史中找到。旧 `malusama/hexo` 是历史内容集，不作为当前网站的整站替代来源。今后如果找回某篇 Markdown，可以逐篇替换对应 HTML，保留 front matter 中的 `url` 并验证正文差异。

## 检查

`npm run check` 包括构建、以下回归检查和依赖审计：

- 原 36 篇文章的正文哈希、代码、图片数量和锚点。
- 原 149 个 HTML 地址、站内链接大小写、搜索索引和重复构建稳定性。
- 内容集未变化时，原 99 个非跳转页面的 body DOM（忽略无显示作用的空白）及 CSS/JS 哈希。
- 在独立临时目录新增 Markdown：草稿隔离、发布后所有列表/RSS/导航同步、删除后不残留。

`scripts/content-baseline.json` 和 `scripts/presentation-baseline.json` 是保留证据。以后有意编辑旧文章或修改设计时，应审阅差异并相应更新基线；不要用重置基线掩盖非预期变化。

## 一次性切换发布方式

恢复前 GitHub Pages 直接发布 `master` 根目录的 HTML。此分支改为提交源码，发布 `public/` 构建产物，**合并前必须把仓库 Settings → Pages → Build and deployment → Source 改为 GitHub Actions**，保留 `malu.moe` 自定义域名及 HTTPS 设置。

`.github/workflows/pages.yml` 已准备好：PR 只构建、检查和上传产物；只有 `master` 的 push 或手动运行才部署。Hugo 和 Actions 引用均固定版本/提交。发布不需要个人访问令牌。

不要在旧的“从 master 根目录发布”配置下直接合入源码迁移，否则会把源码目录当成站点。首次发布后检查首页、旧文章、搜索、RSS 和域名；若有 Cloudflare HTML 缓存，需刷新相应缓存。

尚未执行任何远程 Pages 设置变更或部署。

参考：[Hugo 内容格式](https://gohugo.io/content-management/formats/)、[GitHub Pages 部署](https://gohugo.io/host-and-deploy/host-on-github-pages/)。
