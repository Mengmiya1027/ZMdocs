import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ZMdocs",
  titleTemplate: "稚梦 · 随意写，随意看",
  description: "稚梦 · 随意写，随意看",
  lang: 'zh-CN',

  head: [['link', { rel: 'icon', href: '/images/basic/zm2.png' }]],
  lastUpdated: true,

  themeConfig: {

    nav: [
      { text: '首页', link: '/' },
      { text: '进来坐坐', link: '/start/' }
    ],

    sidebar: [
      {
        text: '欢迎',
        collapsed: false,
        base: '/start',
        items: [
          { text: '进来坐坐', link: '/' },
          { text: '和异味', link: '/features' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Mengmiya1027/ZMdocs' }
    ],

    editLink: {
      pattern: 'https://github.com/Mengmiya1027/Mengmiya1027/edit/main/src/:path',
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
  },

  // 模块配置
  vite: {
    build: {
      cssMinify: false   // 禁用 CSS 压缩
    }
  }
})
