import { defineConfig } from 'vitepress'
import { generateSidebar } from './theme/utils/sidebarGenerator.js'
import path from 'path'

export default defineConfig({
  title: "ZMdocs",
  titleTemplate: "稚梦 · 随意写，随意看",
  description: "稚梦 · 随意写，随意看",
  lang: 'zh-CN',

  head: [['link', { rel: 'icon', href: '/images/basic/zm2.png' }]],
  lastUpdated: true,

  // 合并 vite 配置
  vite: {
    server: {
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: [
        'uk.frp.one',
        '*.frp.one',
        'localhost',
        '127.0.0.1'
      ]
    },
  },

  themeConfig: {
    logo: '/images/basic/zm.jpg',
    nav: [
      { text: '首页', link: '/' },
      { text: '进来坐坐', link: '/start/' }
    ],

    sidebar: {
      '/': generateSidebar(path.resolve(__dirname, '..'), '', 0)
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Mengmiya1027/ZMdocs' },
      {
        icon: {
          svg: '<svg t="1785404944851" class="icon" viewBox="72 72 900 900" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1674" width="320" height="320"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m210.5 612.4c-11.5 1.4-44.9-52.7-44.9-52.7 0 31.3-16.2 72.2-51.1 101.8 16.9 5.2 54.9 19.2 45.9 34.4-7.3 12.3-125.6 7.9-159.8 4-34.2 3.8-152.5 8.3-159.8-4-9.1-15.2 28.9-29.2 45.8-34.4-35-29.5-51.1-70.4-51.1-101.8 0 0-33.4 54.1-44.9 52.7-5.4-0.7-12.4-29.6 9.4-99.7 10.3-33 22-60.5 40.2-105.8-3.1-116.9 45.3-215 160.4-215 113.9 0 163.3 96.1 160.4 215 18.1 45.2 29.9 72.8 40.2 105.8 21.7 70.1 14.6 99.1 9.3 99.7z" p-id="1675"></path></svg>'
        },
        link: 'https://qm.qq.com/q/Sc4J3Sg4A',
      }
    ],

    editLink: {
      pattern: 'https://github.com/Mengmiya1027/ZMdocs/edit/main/src/:path',
      text: '在 GitHub 上编辑此页面'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    notFound: {
      code: '404',
      title: '页面未找到',
      quote: '您访问的页面找不到啦' +
          '可以试试返回上个链接' +
          '或者点击下面的按钮返回主页哦',
      linkLabel: '返回主页面',
      linkText: '返回主页面'
    }
  }
})