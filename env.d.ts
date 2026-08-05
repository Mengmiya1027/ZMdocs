// .vitepress/types/theme.d.ts
import 'vitepress'
import 'vue'

declare module 'vitepress' {
    interface ThemeConfig {
        // 扩展自定义的 authors 配置
        authors?: Record<string, string>
    }
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '*.css' {
    const content: string;
    export default content;
}