import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ZMdocs",
  titleTemplate: "稚梦 · 随意写，随意看",
  description: "稚梦 · 随意写，随意看",
  lang: 'zh-CN',

  head: [['link', { rel: 'icon', href: '/images/basic/zm2.png' }]],
  lastUpdated: true,

  themeConfig: {
    logo: '/images/basic/zm.jpg',
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
      },
      {
        text: '开始探索',
        base: '/guide',
        collapsed: false,
        items: [
          { text: '开始探索', link: '/start-discover' },
          { text: '更新日志&新功能介绍', link: '/new' },
        ]
      },
      {
        text: '资源',
        base: '/resources',
        collapsed: false,
        items: [
          { text: '概览', link: '/' },
          {
            text: '应用程序',
            base: '/resources/application',
            collapsed: true,
            items: [  /* 应用程序 仿照这里的格式进行编写*/
              {
                text: '独立型应用程序',
                base: '/resources/application/single',
                collapsed: true,
                items: [
                  { text: '介绍', link: '/' },
                  { text: '概览', link: '/map' },
                  { text: '❗反极域课堂专栏', link: '/JiYuDiaoDuan' },
                  { text: '希沃白板爆改', link: '/easinotekz' }
                ]
              },
              {
                text: '打包型应用程序',
                base: '/resources/application/pack',
                collapsed: true,
                items: [
                  { text: '介绍', link: '/' },
                  { text: '概览', link: '/map' },
                  { text: '雷电模拟器 ⚡', link: '/ldmnq' },
                  { text: '蛋仔派对', link: '/eggy-party' },
                  { text: 'Minecraft（我的世界）', link: '/minecraft' },
                  { text: 'Motrix', link: '/motrix' }
                ]
              }
            ]
          },
          {
            text: '网站',
            base: '/resources/website',
            collapsed: true,
            items: [
              { text: '介绍', link: '/' },
              { text: '概览', link: '/map' },
              { text: 'MC.js', link: '/mc-js' },
              { text: '原神抽卡模拟器', link: '/yschou' },
              { text: 'WG-WebGame', link: '/WG-WebGame/' },
              { text: '▮▮学习资料网站', link: '/ChinaFZ110' },
            ]
          },
          {
            text: '图片',
            base: '/resources/picture',
            collapsed: true,
            items: [
              { text: '概览', link: '/map' },
              { text: '蛋仔 ', link: '/eggy' },
            ]
          },
          {
            text: '视频',
            base: '/resources/video',
            collapsed: true,
            items: [
              { text: '概览', link: '/map' }
            ]
          },
        ]
      },
      {
        text: 'Astrdocs Pro Service',
        base: '/pro',
        collapsed: false,
        items: [
          { text: '概览', link: '/' },
          { text: '加速访问&镜像站点', link: '/speed' },
          { text: '文件快递柜', link: '/filehelper' },
          { text: '哈基米语翻译器', link: '/hajimi' }
        ]
      },
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
      cssMinify: false
    },
    server: {
      host: '0.0.0.0',
      strictPort: true,
    },
  }
})
