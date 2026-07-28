/**
 * Hero 图片倾斜动效（自动等待元素出现 + 图片加载完成）
 * 返回 Promise<() => void>，销毁函数在初始化完成后 resolve
 */
export function useHeroImageTilt(): Promise<() => void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // @ts-ignore
        return Promise.resolve(() => {});
    }

    // @ts-ignore
    return new Promise((resolve) => {
        const mobileBreakpoint = 768;
        if (window.innerWidth <= mobileBreakpoint) {
            resolve(() => {});
            return;
        }

        const imgSelector = '.VPHero .image img';
        let resolved = false;

        // ----- 核心：等待元素出现，再等待图片加载 -----
        function tryInitWhenElementReady() {
            if (resolved) return;

            const imgEl = document.querySelector<HTMLImageElement>(imgSelector);
            if (!imgEl) {
                // 未找到元素，启动 MutationObserver 继续监听
                startObserver();
                return;
            }

            // 元素已存在，等待图片加载完成后初始化
            waitForImageLoad(imgEl, (destroy) => {
                if (!resolved) {
                    resolved = true;
                    resolve(destroy);
                }
            });
        }

        // ----- 等待图片加载（复用原有逻辑）-----
        function waitForImageLoad(
            imgEl: HTMLImageElement,
            onReady: (destroy: () => void) => void
        ) {
            // 已加载完成，立即初始化
            if (imgEl.complete && imgEl.naturalWidth > 0) {
                initEffect(imgEl, onReady);
                return;
            }

            // 监听 load，并设超时兜底
            let done = false;
            const onLoad = () => {
                if (done) return;
                if (imgEl.complete && imgEl.naturalWidth > 0) {
                    done = true;
                    clearTimeout(timeout);
                    initEffect(imgEl, onReady);
                }
            };
            imgEl.addEventListener('load', onLoad);
            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    imgEl.removeEventListener('load', onLoad);
                    // 超时强制初始化（可能尺寸不准，但避免死等）
                    initEffect(imgEl, onReady);
                }
            }, 5000);
        }

        // ----- MutationObserver 监听 DOM 插入 -----
        let observer: MutationObserver | null = null;

        function startObserver() {
            if (observer) return;
            observer = new MutationObserver(() => {
                // 重新尝试查找元素
                const imgEl = document.querySelector<HTMLImageElement>(imgSelector);
                if (imgEl) {
                    // 找到后断开监听
                    observer?.disconnect();
                    observer = null;
                    waitForImageLoad(imgEl, (destroy) => {
                        if (!resolved) {
                            resolved = true;
                            resolve(destroy);
                        }
                    });
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
            // 设置超时，避免永久监听
            setTimeout(() => {
                if (observer && !resolved) {
                    observer.disconnect();
                    observer = null;
                    // 若仍未找到，放弃初始化
                    console.warn('Hero 图片未找到，放弃动效');
                    resolve(() => {});
                }
            }, 10000);
        }

        // ----- 初始化核心逻辑（与之前完全一致）-----
        function initEffect(
            imgEl: HTMLImageElement,
            onReady: (destroy: () => void) => void
        ) {
            // 保存原始 transform
            const computedStyle = window.getComputedStyle(imgEl);
            const baseTransform =
                computedStyle.transform === 'none' ? '' : computedStyle.transform;
            imgEl.style.transform = baseTransform || '';

            // 主题阴影颜色
            const getShadowColor = () => {
                const isDark = document.documentElement.classList.contains('dark');
                return isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
            };
            let currentShadowColor = getShadowColor();
            imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
            imgEl.style.transition =
                'transform 0.12s ease-out, box-shadow 0.12s ease-out';
            imgEl.style.willChange = 'transform, box-shadow';

            // 监听主题切换
            const observer = new MutationObserver(() => {
                const newColor = getShadowColor();
                if (newColor !== currentShadowColor) {
                    currentShadowColor = newColor;
                    if (!anchorReady) {
                        imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
                    }
                }
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class'],
            });

            // 锚点与滚动重置
            let originCenterX = 0,
                originCenterY = 0,
                anchorReady = false;

            const resetAnchor = () => {
                anchorReady = false;
                imgEl.style.transform = baseTransform
                    ? `${baseTransform} translate(0, 0)`
                    : 'translate(0,0)';
                imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
            };

            const onScroll = () => {
                if (anchorReady) resetAnchor();
            };
            window.addEventListener('scroll', onScroll, { passive: true });

            // rAF 合并更新
            let rafId: number | null = null;
            let pendingUpdate: (() => void) | null = null;

            function handleMouseMove(e: MouseEvent) {
                if (!imgEl.isConnected) {
                    destroy();
                    return;
                }

                if (!anchorReady) {
                    const rect = imgEl.getBoundingClientRect();
                    originCenterX = rect.left + rect.width / 2;
                    originCenterY = rect.top + rect.height / 2;
                    anchorReady = true;
                    return;
                }

                const dx = e.clientX - originCenterX;
                const dy = e.clientY - originCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (rafId) cancelAnimationFrame(rafId);
                pendingUpdate = () => {
                    if (dist < 160 && dist > 0) {
                        const ux = dx / dist;
                        const uy = dy / dist;
                        const imgX = ux * 6;
                        const imgY = uy * 6;
                        const shadowX = -ux * 14;
                        const shadowY = -uy * 14;

                        imgEl.style.transform = baseTransform
                            ? `${baseTransform} translate(${imgX}px, ${imgY}px)`
                            : `translate(${imgX}px, ${imgY}px)`;
                        imgEl.style.boxShadow = `${shadowX}px ${shadowY}px 10px ${currentShadowColor}`;
                    } else {
                        imgEl.style.transform = baseTransform
                            ? `${baseTransform} translate(0, 0)`
                            : 'translate(0,0)';
                        imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
                    }
                    rafId = null;
                };
                rafId = requestAnimationFrame(() => pendingUpdate?.());
            }

            const onWindowLeave = () => resetAnchor();

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseleave', onWindowLeave);

            // 销毁函数
            function destroy() {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseleave', onWindowLeave);
                window.removeEventListener('scroll', onScroll);
                observer.disconnect();
                if (rafId) cancelAnimationFrame(rafId);

                if (imgEl.isConnected) {
                    imgEl.style.transform = baseTransform || '';
                    imgEl.style.boxShadow = '';
                    imgEl.style.willChange = '';
                    imgEl.style.transition = '';
                }
                console.log('动效已销毁');
            }

            console.log('动效已初始化，等待鼠标移入');
            onReady(destroy);
        }

        // ----- 启动：尝试立即查找，若不存在则开始监听 -----
        tryInitWhenElementReady();
    });
}