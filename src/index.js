import Vue from "vue";
import store from "./store";
import components from "./components";
import { getInstance } from "@/xiaoni/utils";
import "@/xiaoni/utils/done.js";

let Form = null;
let ContextMenu = null;

const CRUD = {
  version: "1.0.0",
  install: function (Vue, options = {}) {
    const { crud = {} } = options;
    // 样式
    if (!crud.style) crud.style = {};
    // 表格
    if (!crud.table) crud.table = {};

    // 缓存配置
    store.__crud = crud;
    store.__vue = Vue;
    store.__inst = new Vue();

    // 注册组件
    for (let i in components) {
      Vue.component(components[i].name, components[i]);
    }

    // 获取组件实例
    Form = getInstance(components.Form);
    ContextMenu = getInstance(components.ContextMenu);

    // 注册右键菜单指令
    (function () {
      function fn(el, binding) {
        el.oncontextmenu = function (e) {
          ContextMenu.open(e, {
            list: binding.value || [],
          });
        };
      }

      Vue.directive("contextmenu", {
        inserted: fn,
        update: fn,
      });
    })();

    // 挂载 $crud
    Vue.prototype.$crud = {
      emit: store.__inst.$emit,
      form: Form,
      openForm: Form.open,
      closeForm: Form.close,
      contextMenu: ContextMenu,
      openContextMenu: ContextMenu.open,
      closeContextMenu: ContextMenu.close,
    };

    return {};
  },
};

export { Form, ContextMenu };

export default function (option = {}) {
  Vue.use(CRUD, option);
}
