// .vitepress/types/theme.d.ts
import 'vitepress'

declare module 'vitepress' {
    interface ThemeConfig {
        // 扩展自定义的 authors 配置
        authors?: Record<string, string>
    }
}