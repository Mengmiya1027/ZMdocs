import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
//#region src/start/features.md
var __pageData = JSON.parse("{\"title\":\"\",\"description\":\"\",\"frontmatter\":{\"Order\":2,\"SideBar\":\"特点\",\"Hidden\":false},\"headers\":[],\"relativePath\":\"start/features.md\",\"filePath\":\"start/features.md\",\"lastUpdated\":1785423911000}");
var _sfc_main = { name: "start/features.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("start/features.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var features_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, features_default as default };
