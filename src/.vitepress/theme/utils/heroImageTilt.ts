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
        const imgSelector = '.VPHero .image img';
        let resolved = false;

        function tryInitWhenElementReady() {
            if (resolved) return;

            const imgEl = document.querySelector<HTMLImageElement>(imgSelector);
            if (!imgEl) {
                startObserver();
                return;
            }

            waitForImageLoad(imgEl, (destroy) => {
                if (!resolved) {
                    resolved = true;
                    resolve(destroy);
                }
            });
        }

        function waitForImageLoad(
            imgEl: HTMLImageElement,
            onReady: (destroy: () => void) => void
        ) {
            if (imgEl.complete && imgEl.naturalWidth > 0) {
                initEffect(imgEl, onReady);
                return;
            }

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
                    initEffect(imgEl, onReady);
                }
            }, 5000);
        }

        let observer: MutationObserver | null = null;

        function startObserver() {
            if (observer) return;
            observer = new MutationObserver(() => {
                const imgEl = document.querySelector<HTMLImageElement>(imgSelector);
                if (imgEl) {
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
            setTimeout(() => {
                if (observer && !resolved) {
                    observer.disconnect();
                    observer = null;
                    // console.warn('Hero 图片未找到，放弃动效');
                    resolve(() => {});
                }
            }, 10000);
        }

        // ========== 核心修复在这里 ==========
        function initEffect(
            imgEl: HTMLImageElement,
            onReady: (destroy: () => void) => void
        ) {
            // ✅ 保存「原始内联样式」，不是计算样式！
            const originalTransform = imgEl.style.transform;
            const originalBoxShadow = imgEl.style.boxShadow;
            const originalWillChange = imgEl.style.willChange;
            const originalTransition = imgEl.style.transition;

            // 计算样式仅用于动效叠加时的 base
            const computedStyle = window.getComputedStyle(imgEl);
            const baseTransform =
                computedStyle.transform === 'none' ? '' : computedStyle.transform;

            // 仅在图片没有内联 transform 时，才把 CSS 计算值写入内联（作为动效基础）
            // 避免覆盖用户原本的内联样式
            if (baseTransform && !originalTransform) {
                imgEl.style.transform = baseTransform;
            }

            const getShadowColor = () => {
                const isDark = document.documentElement.classList.contains('dark');
                return isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.25)';
            };
            let currentShadowColor = getShadowColor();
            imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
            imgEl.style.transition =
                'transform 0.12s ease-out, box-shadow 0.12s ease-out';
            imgEl.style.willChange = 'transform, box-shadow';

            const themeObserver = new MutationObserver(() => {
                const newColor = getShadowColor();
                if (newColor !== currentShadowColor) {
                    currentShadowColor = newColor;
                    if (!anchorReady) {
                        imgEl.style.boxShadow = `0 0 10px ${currentShadowColor}`;
                    }
                }
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class'],
            });

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

            function destroy() {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseleave', onWindowLeave);
                window.removeEventListener('scroll', onScroll);
                themeObserver.disconnect();
                if (rafId) cancelAnimationFrame(rafId);

                if (imgEl.isConnected) {
                    // ✅ 关键修复：恢复原始内联样式，而不是恢复 baseTransform
                    // 这样当 CSS media query 变化时，不会用旧的桌面端计算值覆盖新规则
                    imgEl.style.transform = originalTransform;
                    imgEl.style.boxShadow = originalBoxShadow;
                    imgEl.style.willChange = originalWillChange;
                    imgEl.style.transition = originalTransition;
                }
                // console.log('动效已销毁');
            }

            // console.log('动效已初始化，等待鼠标移入');
            onReady(destroy);
        }

        tryInitWhenElementReady();
    });
}

// ---------- 自动生命周期管理 ----------
export function autoHeroImageTilt(router: any, mobileBreakpoint = 768): () => void {
    let destroyEffect: (() => void) | null = null;
    let initPromise: Promise<void> | null = null;

    // @ts-ignore
    async function init() {
        if (initPromise) {
            await initPromise;
        }

        if (destroyEffect) {
            destroyEffect();
            destroyEffect = null;
        }

        if (window.innerWidth <= mobileBreakpoint) {
            return;
        }

        // @ts-ignore
        const p = (async () => {
            try {
                destroyEffect = await useHeroImageTilt();
            } catch (e) {
                // console.error('Hero tilt init failed', e);
            }
        })();
        initPromise = p;
        await p;
        if (initPromise === p) {
            initPromise = null;
        }
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', () => init(), { once: true });
    }

    const originalOnAfterRouteChange = router.onAfterRouteChange;
    router.onAfterRouteChange = () => {
        originalOnAfterRouteChange?.();
        init();
    };

    let resizeTimer: number | null = null;
    const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            const isDesktop = window.innerWidth > mobileBreakpoint;
            const hasEffect = destroyEffect !== null;

            if (isDesktop && !hasEffect) {
                init();
            } else if (!isDesktop && hasEffect) {
                destroyEffect!();
                destroyEffect = null;
            }
        }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
        if (destroyEffect) {
            destroyEffect();
            destroyEffect = null;
        }
        router.onAfterRouteChange = originalOnAfterRouteChange;
        window.removeEventListener('resize', onResize);
        if (resizeTimer) clearTimeout(resizeTimer);
    };
}