import DefaultTheme from 'vitepress/theme';
import { watch, nextTick } from 'vue'

// 主题统一入口
import "./styles/index.css"

// 已封装的工具
import { useHeroImageTilt } from './utils/heroImageTilt'


export default {
    ...DefaultTheme,
    enhanceApp({ app, router }) {
        // 只在客户端环境下注册路由监听和初始化效果
        if (typeof window !== 'undefined') {
            let destroyEffect: (() => void) | null = null;

            // @ts-ignore
            async function initEffect() {
                if (destroyEffect) {
                    destroyEffect();
                    destroyEffect = null;
                }
                try {
                    const destroy = await useHeroImageTilt();
                    destroyEffect = destroy;
                } catch (e) {
                    console.error('Hero tilt init failed', e);
                }
            }

            // 页面加载完成后执行
            if (document.readyState === 'complete') {
                initEffect();
            } else {
                window.addEventListener('load', initEffect, { once: true });
            }

            // 监听路由变化，重新初始化效果
            // @ts-ignore
            const unwatch = watch(router.route, async () => {
                await nextTick();
                initEffect();
            });
        }
    }
};