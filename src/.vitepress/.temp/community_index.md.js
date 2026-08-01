import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
//#region src/community/index.md
var __pageData = JSON.parse("{\"title\":\"侧边栏创建\",\"description\":\"\",\"frontmatter\":{\"SideBarTitle\":\"共建\",\"Order\":1,\"title\":\"侧边栏创建\",\"Hidden\":false,\"GroupOrder\":2},\"headers\":[],\"relativePath\":\"community/index.md\",\"filePath\":\"community/index.md\",\"lastUpdated\":1785423911000}");
var _sfc_main = { name: "community/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="侧边栏创建" tabindex="-1">侧边栏创建 <a class="header-anchor" href="#侧边栏创建" aria-label="Permalink to “侧边栏创建”">​</a></h1><p>只需要在 <code>src</code> 文件夹里建好 Markdown 文件，侧边栏会自动生成。下面是需要知道的所有规则。</p><h2 id="🧭-工作区" tabindex="-1">🧭 工作区 <a class="header-anchor" href="#🧭-工作区" aria-label="Permalink to “🧭 工作区”">​</a></h2><p>所有内容都放在 <code>src</code> 文件夹内。<br><strong>主页文件 <code>src/index.md</code> 不会出现在侧边栏</strong>，可以放心写首页。</p><h2 id="_1️⃣-一个-markdown-文件-一个菜单项" tabindex="-1">1️⃣ 一个 Markdown 文件 = 一个菜单项 <a class="header-anchor" href="#_1️⃣-一个-markdown-文件-一个菜单项" aria-label="Permalink to “1️⃣ 一个 Markdown 文件 = 一个菜单项”">​</a></h2><p>新建任何 <code>.md</code> 文件，它都会自动成为侧边栏里的一个链接。<br> 通过文件<strong>顶部 \`\` 包裹的区域</strong>，可以控制它的标题、排序和显隐。</p><h3 id="可用的配置项" tabindex="-1">可用的配置项 <a class="header-anchor" href="#可用的配置项" aria-label="Permalink to “可用的配置项”">​</a></h3><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-21" id="tab-22" checked><label data-title="markdown" for="tab-22">markdown</label></div><div class="blocks"><div class="language-markdown active"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">SideBar: 快速开始      # 菜单上显示的名字</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">title: 快速开始         # 如果没写 SideBar，就用这个</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">Order: 1               # 排序数字，越小越靠前</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">Hidden: true           # 设为 true 会从侧边栏隐藏</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#005CC5",
		"--shiki-light-font-weight": "bold",
		"--shiki-dark": "#79B8FF",
		"--shiki-dark-font-weight": "bold"
	})}"># 这里是文章标题</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">正文...</span></span></code></pre></div></div></div><h3 id="标题的优先级" tabindex="-1">标题的优先级 <a class="header-anchor" href="#标题的优先级" aria-label="Permalink to “标题的优先级”">​</a></h3><p>菜单上显示的文字，按这个顺序决定：</p><ol><li><code>SideBar</code>（最优先）</li><li><code>title</code>（VitePress 自带的那个）</li><li>文件名（去掉 <code>.md</code>，并且 <code>-</code> 和 <code>_</code> 会自动变成空格）</li></ol><blockquote><p>因此只要随便写其中一个就行，完全不需要纠结。<br> 比如文件叫 <code>getting-started.md</code>，什么都不写就会显示 “getting started”。</p></blockquote><h2 id="_2️⃣-用文件夹创建可折叠的-分组" tabindex="-1">2️⃣ 用文件夹创建可折叠的“分组” <a class="header-anchor" href="#_2️⃣-用文件夹创建可折叠的-分组" aria-label="Permalink to “2️⃣ 用文件夹创建可折叠的“分组””">​</a></h2><p>把一个文件夹放在 <code>src</code> 下，它就会变成一个<strong>可展开/收起的分类标题</strong>。<br> 里面的所有 <code>.md</code> 文件就是它的子项。</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-58" id="tab-59" checked><label data-title="txt" for="tab-59">txt</label></div><div class="blocks"><div class="language- active"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span>src/</span></span>
<span class="line"><span>└─ 教程/</span></span>
<span class="line"><span>   ├─ 安装.md</span></span>
<span class="line"><span>   └─ 配置.md</span></span></code></pre></div></div></div><p>侧边栏会显示：</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-64" id="tab-65" checked><label data-title="txt" for="tab-65">txt</label></div><div class="blocks"><div class="language- active"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span>📁 教程           ← 点击展开/收起</span></span>
<span class="line"><span>   ├─ 安装</span></span>
<span class="line"><span>   └─ 配置</span></span></code></pre></div></div></div><h3 id="给分组改名字" tabindex="-1">给分组改名字 <a class="header-anchor" href="#给分组改名字" aria-label="Permalink to “给分组改名字”">​</a></h3><p>在文件夹里放一个 <code>index.md</code>，在里面写 <code>SideBarTitle</code>：</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-73" id="tab-74" checked><label data-title="markdown" for="tab-74">markdown</label></div><div class="blocks"><div class="language-markdown active"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">SideBarTitle: 入门指南</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">GroupOrder: 2</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}">欢迎！</span></span></code></pre></div></div></div><ul><li><code>SideBarTitle</code> 就是分组显示的名称（不写则用文件夹名）。</li><li><code>GroupOrder</code> 控制这个分组在父级列表中的顺序，数字越小越靠前。</li><li>如果在 <code>index.md</code> 里写 <code>Hidden: true</code>，<strong>整个分组都会从侧边栏消失</strong>。</li></ul><h3 id="分组的标题本身不能点击" tabindex="-1">分组的标题本身不能点击 <a class="header-anchor" href="#分组的标题本身不能点击" aria-label="Permalink to “分组的标题本身不能点击”">​</a></h3><p>分组标题只负责展开/收起，不会跳转。<br> 如果希望<strong>点开分组后还能看到一个介绍页</strong>，<code>index.md</code> 会自动变成一个菜单项，放在该分组的子项列表中：</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-99" id="tab-100" checked><label data-title="txt" for="tab-100">txt</label></div><div class="blocks"><div class="language- active"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span>📁 入门指南               ← 分组标题（不可点击）</span></span>
<span class="line"><span>   ├─ 安装</span></span>
<span class="line"><span>   ├─ 配置</span></span>
<span class="line"><span>   └─ 入门指南            ← 这就是 index.md 生成的入口</span></span></code></pre></div></div></div><p>这个 <code>index.md</code> 的排序<strong>使用 <code>Order</code> 字段</strong>（不是 <code>GroupOrder</code>），和普通文件一样。</p><h2 id="_3️⃣-排序规则-很重要" tabindex="-1">3️⃣ 排序规则（很重要） <a class="header-anchor" href="#_3️⃣-排序规则-很重要" aria-label="Permalink to “3️⃣ 排序规则（很重要）”">​</a></h2><p>每一项（文件和文件夹）都可以用一个数字来控制顺序。</p><ul><li><strong>文件</strong>：写 <code>Order: 数字</code></li><li><strong>文件夹</strong>（即分组自身）：在它的 <code>index.md</code> 里写 <code>GroupOrder: 数字</code></li></ul><p>数字越小越靠前。<br><strong>如果没写这些数字</strong>，该项会排到所有写了数字的项的后面，并且它们之间按文件的创建时间排序。</p><blockquote><p>举个例子：<br> A (<code>Order: 2</code>) B (<code>Order: 1</code>) C (没写Order)<br> 最终顺序：B → A → C</p></blockquote><h2 id="_4️⃣-展开和折叠的默认状态" tabindex="-1">4️⃣ 展开和折叠的默认状态 <a class="header-anchor" href="#_4️⃣-展开和折叠的默认状态" aria-label="Permalink to “4️⃣ 展开和折叠的默认状态”">​</a></h2><ul><li><strong><code>src</code> 下的直接文件夹</strong>（创建在 <code>src</code> 里的第一层文件夹）默认是<strong>展开</strong>的，用户一进网站就能看到里面的子项。</li><li><strong>更深层的文件夹</strong>（文件夹里面的文件夹）默认是<strong>折叠</strong>的，需要用户手动点击打开。</li></ul><p>这样既让重要分类一目了然，又不会让侧边栏变得太长。</p><h2 id="_5️⃣-隐藏某些内容" tabindex="-1">5️⃣ 隐藏某些内容 <a class="header-anchor" href="#_5️⃣-隐藏某些内容" aria-label="Permalink to “5️⃣ 隐藏某些内容”">​</a></h2><ul><li>单个文件：在文件顶部写 <code>Hidden: true</code>，它就会从侧边栏消失（直接访问网址仍然能打开）。</li><li>整个分组：在分组的 <code>index.md</code> 里写 <code>Hidden: true</code>。</li><li><code>public</code> 文件夹和 <code>.vitepress</code> 文件夹<strong>永远自动忽略</strong>，放进去的图片、样式等不会出现在侧边栏。</li></ul><h2 id="_6️⃣-标题美化小细节" tabindex="-1">6️⃣ 标题美化小细节 <a class="header-anchor" href="#_6️⃣-标题美化小细节" aria-label="Permalink to “6️⃣ 标题美化小细节”">​</a></h2><p>文件名或编写的任何标题里的 <code>-</code> 和 <code>_</code> 都会自动变成空格。<br> 例如 <code>how-to-use</code> 会显示成 “how to use”，<code>my_page</code> 会显示成 “my page”。</p><h2 id="_7️⃣-一个完整例子" tabindex="-1">7️⃣ 一个完整例子 <a class="header-anchor" href="#_7️⃣-一个完整例子" aria-label="Permalink to “7️⃣ 一个完整例子”">​</a></h2><p>假设 <code>src</code> 里的文件是这样：</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-181" id="tab-182" checked><label data-title="txt" for="tab-182">txt</label></div><div class="blocks"><div class="language- active"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span>src/</span></span>
<span class="line"><span>├─ 教程/</span></span>
<span class="line"><span>│  ├─ index.md    (SideBarTitle: 新手指南, Order:2, SideBar: 指南首页, GroupOrder:1)</span></span>
<span class="line"><span>│  ├─ 安装.md     (Order:1, SideBar: 安装环境)</span></span>
<span class="line"><span>│  └─ 配置.md     (Order:3)</span></span>
<span class="line"><span>├─ API/</span></span>
<span class="line"><span>│  ├─ 接口.md     (SideBar: 接口列表)</span></span>
<span class="line"><span>│  └─ 错误码.md   (Hidden: true)</span></span>
<span class="line"><span>└─ 常见问题.md    (title: FAQ, Order:99)</span></span></code></pre></div></div></div><p>最后侧边栏会变成：</p><div class="vp-code-group"><div class="tabs"><input type="radio" name="group-187" id="tab-188" checked><label data-title="txt" for="tab-188">txt</label></div><div class="blocks"><div class="language- active"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span>📖 新手指南                     ← 展开（src 下的文件夹），GroupOrder=1 排第一</span></span>
<span class="line"><span>   ├─ 安装环境                  (Order=1)</span></span>
<span class="line"><span>   ├─ 指南首页                  (index.md, Order=2)</span></span>
<span class="line"><span>   └─ 配置                     (Order=3)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>📖 API                          ← 没有 index.md，显示文件夹名，排序默认在后面</span></span>
<span class="line"><span>   └─ 接口列表                  (错误码被隐藏)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>📄 FAQ                          (独立菜单，Order=99)</span></span></code></pre></div></div></div><h3 id="需要注意的是-目前修改-md文件中的配置后-重启docs-dev服务才有效果。后续将会改进。" tabindex="-1">需要注意的是，目前修改<code>.md</code>文件中的配置后，重启<code>docs:dev</code>服务才有效果。后续将会改进。 <a class="header-anchor" href="#需要注意的是-目前修改-md文件中的配置后-重启docs-dev服务才有效果。后续将会改进。" aria-label="Permalink to “需要注意的是，目前修改.md文件中的配置后，重启docs:dev服务才有效果。后续将会改进。”">​</a></h3></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("community/index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var community_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, community_default as default };
