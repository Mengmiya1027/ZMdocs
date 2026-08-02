import DefaultTheme from 'vitepress/theme'
import { watch } from 'vue'

// 已封装的工具
import { autoHeroImageTilt } from './utils/heroImageTilt'
import { applyNavbarAnd404Style } from './utils/Navbar-and-404-Style'
import { useSidebarHeight } from "./utils/useSidebarHeight";
import { setupOutlineSmoothScroll, setupBackToTopAnimation } from "./utils/outlineScroll";
import { setupContentTransition, playDocSwitchAnimation } from "./utils/contentTransition";

// 主题统一入口
import "./styles/index.css"

// 自定义 Layout：在默认布局之上叠加「入场动画」幕布
import Layout from "./Layout.vue"

export default {
    ...DefaultTheme,
    Layout,
    enhanceApp({ app, router }) {
        // 单个 setup 失败不应连累其它动画（避免“所有动画都没了”）
        const safe = (label: string, fn: () => void) => {
            try { fn() }
            catch (e) { console.error(`[theme] ${label} 初始化失败:`, e) }
        }

        if (typeof window !== 'undefined') {
            safe('autoHeroImageTilt', () => autoHeroImageTilt(router, 960))
            safe('setupOutlineSmoothScroll', setupOutlineSmoothScroll)
            safe('setupBackToTopAnimation', setupBackToTopAnimation)
            safe('setupContentTransition', () => setupContentTransition(router))

            const { applySidebarHeight } = useSidebarHeight(false)

            const updateStyles = () => {
                const route = router.route;
                const isHome = route.path === '/';
                const isNotFound = route.data?.isNotFound === true;
                const useHomeStyle = isHome || isNotFound;
                applyNavbarAnd404Style(useHomeStyle, isNotFound);
                applySidebarHeight();
            };

            // 路径规范化：onAfterRouteChange 传入的 href 可能是 /start/index.html（带 .html），
            // 而 router.route.path 是 /start/（已规范化）。两者直接比较会不相等，导致「点右侧栏
            // 大纲（同页 hash）被误判成切文档」而误播放动画（问题2）。统一规范化后再比较。
            const normalizePath = (p?: string): string => {
                if (!p) return ''
                let s = p
                s = s.replace(/\/index\.html$/, '/')  // /start/index.html -> /start/
                s = s.replace(/\.html$/, '')           // 其它 .html -> 去掉后缀
                if (s.length > 1) s = s.replace(/\/+$/, '')  // 去掉末尾斜杠（根路径 / 保留）
                return s
            }

            let lastPath = normalizePath(router.route.path)
            // 去重：onAfterRouteChange 与 watch 兜底可能在同一导航中各触发一次，
            // 用时间窗口避免“双播”（动画重启）。
            let lastPlay = 0
            const afterRoute = (href?: string) => {
                updateStyles()
                // 计算跳转后的【页面路径】（规范化后比较）：
                // - onAfterRouteChange 传入的是字符串（可能是完整 URL 或带 #hash 的路径）；
                // - 相对 #hash 用当前页 URL 解析，pathname 即当前页 → 与 lastPath 相同 → 不播放；
                // - watch 兜底分支拿到的是路径字符串，直接比较。
                let toPath: string
                if (typeof href === 'string') {
                    try {
                        toPath = normalizePath(new URL(href, location.href).pathname)
                    } catch {
                        toPath = normalizePath(router.route.path)
                    }
                } else {
                    toPath = normalizePath(router.route.path)
                }
                if (toPath !== lastPath) {
                    const now = Date.now()
                    if (now - lastPlay > 60) {
                        lastPlay = now
                        playDocSwitchAnimation()   // 正文列 + 右侧大纲：右滑入 + 淡入（延后到新内容渲染后）
                    }
                }
                // 关键：每次都更新 lastPath（用规范化值），否则首跳之后 lastPath 仍是旧值，
                // 后续点右侧栏大纲（同页 hash）会被误判为“路径变化”而误播放动画。
                lastPath = toPath
            }

            // 主触发：本 alpha 版钩子名为 router.onAfterRouteChange（无 d，不是稳定版的
            // onAfterRouteChanged），由 router.go / popstate 内部调用（router.js 第 35、155 行）。
            // 直接赋值（默认 undefined），包一层 prev 保留其它可能设置的回调（如 heroImageTilt）。
            const prevHook = (router as any).onAfterRouteChange
            ;(router as any).onAfterRouteChange = (to: string) => {
                if (typeof prevHook === 'function') {
                    try { prevHook(to) } catch (e) { console.error('[theme] prev onAfterRouteChange 失败:', e) }
                }
                afterRoute(to)
            }

            // 兜底触发：监听 route.path 字符串。比 deep watch 整个 route 对象更可靠，
            // 且仅 path 真正变化时才触发（hash-only 变化 path 不变 → 不触发，符合预期）。
            // 与 onAfterRouteChange 形成双保险，任一来源挂了另一个仍能驱动换页动画。
            safe('route-watch', () => watch(
                () => router.route.path,
                (to) => afterRoute(to)
            ))

            // 同页导航（点左侧栏/顶栏中指向「当前页」的同一选项，如再次点击「开始」）：
            // VitePress 不会触发路由变化，默认只是瞬间回顶、无动画。这里在【捕获阶段】拦截，
            // 阻止默认瞬跳，改为【平滑滚动到顶 + 重播换页动画】，让“再次点击同一选项”也有
            // 与首次进入一致的动画观感。
            // 仅作用于侧栏/顶栏链接（.VPSidebar / .VPNav / .VPNavScreen），不拦截文档正文与
            // 大纲链接（后者由 outlineScroll 处理），避免误伤。
            // 捕获阶段 + stopPropagation：确保 VitePress 自身的同名链接点击处理（瞬跳回顶）被
            // 抢先拦截，避免“瞬时回顶”和我们的平滑滚动打架。
            const onSamePageNavClick = (e: MouseEvent) => {
                const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
                    '.VPSidebar a, .VPNav a, .VPNavScreen a'
                )
                if (!link) return
                const href = link.getAttribute('href')
                if (!href || /^(https?:)?\/\//i.test(href) || href.startsWith('#')) return
                let linkPath: string
                try {
                    linkPath = normalizePath(new URL(href, location.href).pathname)
                } catch {
                    return
                }
                const curPath = normalizePath(router.route.path)
                if (linkPath !== curPath) return // 跨页：交给 onAfterRouteChange 播动画，这里不拦

                // 同页点击：阻止默认瞬跳 + 阻止 VitePress 同名处理，改为平滑滚动 + 重播动画
                e.preventDefault()
                e.stopPropagation()
                if (link.hash) {
                    const anchor = document.getElementById(decodeURIComponent(link.hash.slice(1)))
                    if (anchor) {
                        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }
                playDocSwitchAnimation()
            }
            document.addEventListener('click', onSamePageNavClick, true)
        }
    }
}
