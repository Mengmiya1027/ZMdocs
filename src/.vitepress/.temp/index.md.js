import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
//#region src/index.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"layout\":\"home\",\"hero\":{\"name\":\"ZMdocs\",\"text\":\"来了？随便坐~\",\"image\":{\"src\":\"/images/basic/zm.jpg\"},\"tagline\":\"梦到什么写什么。不保证有用，不保证有趣，但保证都是真的。\",\"actions\":[{\"theme\":\"brand\",\"text\":\"进来坐坐\",\"link\":\"/start/\"},{\"theme\":\"alt\",\"text\":\"了解一下?↗\",\"link\":\"https://github.com/Mengmiya1027/ZMdocs\"}]},\"features\":[{\"title\":\"随意写\",\"icon\":\"🥰\",\"details\":\"梦到什么写什么。不追热点，不写命题作文，只记那些半夜冒出来的想法。\"},{\"title\":\"随意看\",\"icon\":\"✨\",\"details\":\"没有干货焦虑，也没有成长规划。你看到哪算哪，就当路过别人的一场梦。\"},{\"title\":\"随意活\",\"icon\":\"✅\",\"details\":\"代码、阅读、发呆。这里是两个开发者用文字搭的纸房子。\"}]},\"headers\":[],\"relativePath\":\"index.md\",\"filePath\":\"index.md\",\"lastUpdated\":1785313874000}");
var _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var src_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, src_default as default };
