---
Order: 2
title: 侧边栏创建
---

# 侧边栏创建

只需要在 `src` 文件夹里建好 Markdown 文件，侧边栏会自动生成。下面是需要知道的所有规则。


## 🧭 工作区 { .compact-left }

所有内容都放在 `src` 文件夹内。  
**主页文件 `src/index.md` 不会出现在侧边栏**，可以放心写首页。



## 1️⃣ 一个 Markdown 文件 = 一个菜单项 { .compact-left }

新建任何 `.md` 文件，它都会自动成为侧边栏里的一个链接。  
通过文件**顶部 `---` 包裹的区域**，可以控制它的标题、排序和显隐。

### 可用的配置项 { .compact-left }

::: code-group
```markdown
---
SideBar: 快速开始            # 菜单上显示的名字
title: 快速开始              # 如果没写 SideBar，就用这个
Order: 1                   # 排序数字，越小越靠前
Hidden: true               # 设为 true 会从侧边栏隐藏该文件自身
SideBarTitle: 入门指南      # （仅在 index.md 中有效）文件夹分组的名字
GroupOrder: 2              # （仅在 index.md 中有效）文件夹分组的顺序，越小越靠前
GroupHidden: true          # （仅在 index.md 中有效）设为 true 会隐藏整个文件夹分组
---
# 这里是文章标题
正文...
```
:::

> **注意**：`GroupHidden` 只对 `index.md` 起作用，用于控制该文件夹是否作为分组出现。

### 标题的优先级 { .compact-left }

菜单上显示的文字，按这个顺序决定：
1. `SideBar`（最优先）
2. `title`（VitePress 自带的那个）
3. 文件名（去掉 `.md`，并且 `-` 和 `_` 会自动变成空格）

> 因此只要随便写其中一个就行，完全不需要纠结。  
> 比如文件叫 `getting-started.md`，什么都不写就会显示 “getting started”。



## 2️⃣ 用文件夹创建可折叠的“分组” { .compact-left }

把一个文件夹放在 `src` 下，它就会变成一个**可展开/收起的分类标题**。  
里面的所有 `.md` 文件就是它的子项。

::: code-group
```
src/
└─ 教程/
   ├─ 安装.md
   └─ 配置.md
```
:::

侧边栏会显示：

::: code-group
```
📁 教程           ← 点击展开/收起
   ├─ 安装
   └─ 配置
```
:::

### 给分组改名字 { .compact-left }

在文件夹里放一个 `index.md`，在里面写 `SideBarTitle`：

::: code-group
```markdown
---
SideBarTitle: 入门指南
GroupOrder: 2
GroupHidden: true    # 可选，隐藏整个分组
---
欢迎！
```
:::

- `SideBarTitle` 就是分组显示的名称（不写则用文件夹名）。
- `GroupOrder` 控制这个分组在父级列表中的顺序，数字越小越靠前。
- 如果在 `index.md` 里写 `GroupHidden: true`，**整个分组都会从侧边栏消失**。
- 若只写 `Hidden: true`，则仅隐藏 `index.md` 自身的链接，分组依然存在且其他子项正常显示。

### 分组的标题本身不能点击 { .compact-left }

分组标题只负责展开/收起，不会跳转。  
如果希望**点开分组后还能看到一个介绍页**，`index.md` 会自动变成一个菜单项，放在该分组的子项列表中：

::: code-group
```
📁 入门指南               ← 分组标题（不可点击）
   ├─ 安装
   ├─ 配置
   └─ 入门指南            ← 这就是 index.md 生成的入口
```
:::

这个 `index.md` 的排序**使用 `Order` 字段**（不是 `GroupOrder`），和普通文件一样。



## 3️⃣ 排序规则（很重要） { .compact-left }

每一项（文件和文件夹）都可以用一个数字来控制顺序。

- **文件**：写 `Order: 数字`
- **文件夹**（即分组自身）：在它的 `index.md` 里写 `GroupOrder: 数字`

数字越小越靠前。  
**如果没写这些数字**，该项会排到所有写了数字的项的后面，并且它们之间按文件的创建时间排序。

> 举个例子：  
> A (`Order: 2`)  B (`Order: 1`)  C (没写Order)  
> 最终顺序：B → A → C



## 4️⃣ 展开和折叠的默认状态 { .compact-left }

- **`src` 下的直接文件夹**（创建在 `src` 里的第一层文件夹）默认是**展开**的，用户一进网站就能看到里面的子项。
- **更深层的文件夹**（文件夹里面的文件夹）默认是**折叠**的，需要用户手动点击打开。

这样既让重要分类一目了然，又不会让侧边栏变得太长。



## 5️⃣ 隐藏某些内容 { .compact-left }

- **单个文件**（包括 `index.md` 自身）：在文件顶部写 `Hidden: true`，它就会从侧边栏消失（直接访问网址仍然能打开）。
- **整个分组**：在分组的 `index.md` 里写 `GroupHidden: true`，则该分组及内部所有内容都不会出现在侧边栏。
- `public` 文件夹和 `.vitepress` 文件夹**永远自动忽略**，放进去的图片、样式等不会出现在侧边栏。

> **提示**：如果你只想隐藏一个文件夹里的 `index.md` 入口，但保留分组和其他子项，请使用 `Hidden: true`，而不是 `GroupHidden`。



## 6️⃣ 标题美化小细节 { .compact-left }

文件名或编写的任何标题里的 `-` 和 `_` 都会自动变成空格。  
例如 `how-to-use` 会显示成 “how to use”，`my_page` 会显示成 “my page”。



## 7️⃣ 一个完整例子 { .compact-left }

假设 `src` 里的文件是这样：

::: code-group
```
src/
├─ 教程/
│  ├─ index.md    (SideBarTitle: 新手指南, Order:2, SideBar: 指南首页, GroupOrder:1)
│  ├─ 安装.md     (Order:1, SideBar: 安装环境)
│  └─ 配置.md     (Order:3)
├─ API/
│  ├─ 接口.md     (SideBar: 接口列表)
│  └─ 错误码.md   (Hidden: true)          # 仅隐藏该文件
└─ 常见问题.md    (title: FAQ, Order:99)
```
:::

最后侧边栏会变成：

::: code-group
```
📖 新手指南                     ← 展开（src 下的文件夹），GroupOrder=1 排第一
   ├─ 安装环境                  (Order=1)
   ├─ 指南首页                  (index.md, Order=2)
   └─ 配置                     (Order=3)

📖 API                          ← 没有 index.md，显示文件夹名，排序默认在后面
   └─ 接口列表                  (错误码被隐藏)

📄 FAQ                          (独立菜单，Order=99)
```
:::

若希望在示例中隐藏 `API` 整个分组，可在 `API/index.md` 中设置 `GroupHidden: true`（假设存在 `index.md`），该分组将完全消失。



### 需要注意的是，目前修改`.md`文件中的配置后，重启`docs:dev`服务才有效果。后续将会改进。 { .compact-left }