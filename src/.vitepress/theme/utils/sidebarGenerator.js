const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

/** 格式化标题：将 - 和 _ 替换为空格 */
function formatTitle(str) {
    return str.replace(/[-_]/g, ' ')
}

/** 读取 md 文件的 frontmatter */
function readFrontmatter(filePath) {
    try {
        return matter(fs.readFileSync(filePath, 'utf-8')).data
    } catch {
        return {}
    }
}

/** 获取文件创建时间（跨平台兼容） */
function getBirthtime(filePath) {
    try {
        const stat = fs.statSync(filePath)
        return stat.birthtime || stat.ctime
    } catch {
        return new Date(0)
    }
}

/**
 * 递归生成侧边栏数组
 * @param {string} dir      当前扫描的绝对路径
 * @param {string} basePath URL 基础路径
 * @param {number} depth    目录深度（0 为根）
 */
function generateSidebar(dir, basePath = '', depth = 0) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const items = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relativePath = basePath + entry.name

        // 强制排除 public 与 .vitepress 目录
        if (entry.isDirectory() && (entry.name === 'public' || entry.name === '.vitepress')) continue

        // ── 处理普通 .md 文件（包括 index.md） ──
        if (entry.isFile() && entry.name.endsWith('.md')) {
            // 排除文档根目录的 index.md（主页）
            if (basePath === '' && entry.name === 'index.md') continue

            const fm = readFrontmatter(fullPath)

            // 隐藏规则（仅作用于普通文件自身）
            if (fm.Hidden === true) continue

            // 标题：优先 SideBar → 文件名（去扩展名，格式化）
            const text = fm.SideBar
                ? formatTitle(fm.SideBar)
                : fm.title
                    ? formatTitle(fm.title)
                    : formatTitle(entry.name.replace(/\.md$/, ''));

            const item = {
                text,
                link: '/' + relativePath.replace(/\.md$/, ''),
            }

            // 排序元数据（用 Order 字段，首字母大写）
            item._sortOrder = fm.Order
            item._birthtime = getBirthtime(fullPath)

            items.push(item)
        }

        // ── 处理文件夹 → 分组 ──
        if (entry.isDirectory()) {
            const indexMd = path.join(fullPath, 'index.md')
            const hasIndex = fs.existsSync(indexMd)
            const indexFm = hasIndex ? readFrontmatter(indexMd) : {}

            // 若 index.md 被标记 GroupHidden，整个分组都不显示
            if (hasIndex && indexFm.GroupHidden === true) continue

            // 分组标题：优先 SideBarTitle → 文件夹名格式化
            const groupText = hasIndex && indexFm.SideBarTitle
                ? formatTitle(indexFm.SideBarTitle)
                : formatTitle(entry.name)

            // 递归获取子项（index.md 也会在其中作为普通文件处理）
            const children = generateSidebar(fullPath, relativePath + '/', depth + 1)

            const groupItem = {
                text: groupText,
                collapsed: depth !== 0,
                items: children,
            }

            // 分组自身的排序元数据
            groupItem._sortOrder = indexFm.GroupOrder   // 分组用 GroupOrder
            groupItem._birthtime = hasIndex ? getBirthtime(indexMd) : getBirthtime(fullPath)

            items.push(groupItem)
        }
    }

    // ── 排序逻辑 ──
    const withOrder = items.filter(i => i._sortOrder !== undefined)
    const withoutOrder = items.filter(i => i._sortOrder === undefined)

    withOrder.sort((a, b) => a._sortOrder - b._sortOrder)
    withoutOrder.sort((a, b) => a._birthtime - b._birthtime)

    const sorted = withOrder.concat(withoutOrder)

    // 清理临时字段
    sorted.forEach(i => {
        delete i._sortOrder
        delete i._birthtime
    })

    return sorted
}

module.exports = { generateSidebar }