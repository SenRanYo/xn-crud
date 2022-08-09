import store from "@/xiaoni/crud/store";
import { bootstrap } from "@/xiaoni/crud/app";
import { Emitter } from "@/xiaoni/crud/mixins";
import { deepMerge, throttle } from "@/xiaoni/utils";
import { isArray, isString, isObject, isFunction } from "@/xiaoni/utils/typeCheck";
import "./styles/index.scss";

export default {
  name: "xn-crud",
  componentName: "XnCrud",
  mixins: [Emitter],
  props: {
    // 别称
    name: String,
    // 是否启用滚动
    scroll: Boolean,
    // 删除钩子 { selection, { next } }
    onDelete: Function,
    // 刷新钩子 { params, { next, done, render } }
    onRefresh: Function,
  },
  provide() {
    return {
      crud: this,
    };
  },
  data() {
    return {
      service: null,
      loading: false,
      upsertItems: [],
      selection: [],
      test: {
        refreshRd: null,
        sortLock: false,
        process: false,
      },
      permission: {
        update: true,
        page: true,
        info: true,
        list: true,
        add: true,
        delete: true,
      },
      params: {
        page: 1,
        size: 20,
      },
      // Config data
      dict: {
        api: {
          list: "list",
          add: "add",
          update: "update",
          delete: "delete",
          info: "info",
          page: "page",
          import: "import",
          export: "export",
        },
        pagination: {
          page: "page",
          size: "size",
        },
        search: {
          keyWord: "keyWord",
          query: "query",
        },
        sort: {
          order: "order",
          prop: "prop",
        },
        label: {
          add: "新增",
          delete: "删除",
          multiDelete: "删除",
          export: "导出",
          import: "导入",
          update: "编辑",
          refresh: "刷新",
          advSearch: "高级搜索",
          saveButtonText: "保存",
          closeButtonText: "关闭",
        },
      },
      table: {
        "context-menu": true,
      },
      fn: {
        permission: null,
      },
      size: "mini",
      style: {
        refreshBtn: {},
        addBtn: {},
        exportBtn: {},
        importBtn: {},
        multiDeleteBtn: {},
        advBtn: {},
        editBtn: {},
        deleteBtn: {},
        saveBtn: {},
        closeBtn: {},
        filterSearchBtn: {},
      },
    };
  },

  created() {
    // 合并全局配置
    deepMerge(this, store.__crud);

    this.$on("table.selection-change", ({ selection }) => {
      this.selection = selection;
    });
    this.$on("upsert.init", ({ items }) => {
      this.upsertItems = items;
    });
  },

  mounted() {
    const res = bootstrap(this);

    // Loaded
    this.$emit("load", res);

    // 绑定自定义事件
    this.bindEvent(res);

    // 窗口事件
    window.removeEventListener("resize", function () {});
    const throttleFun = throttle(() => {
      this.doLayout();
    });
    window.addEventListener("resize", throttleFun);
  },

  methods: {
    // 获取权限
    getPermission(key) {
      if (!key) {
        return this.permission;
      }

      switch (key) {
        case "edit":
        case "update":
          return this.permission["update"];
        default:
          return this.permission[key];
      }
    },

    // 获取参数
    getParams() {
      return this.params;
    },

    // 绑定自定义事件
    bindEvent(res) {
      for (let i in store.__crud.event) {
        let event = store.__crud.event[i];
        let mode = null;
        let callback = null;

        if (isObject(event)) {
          mode = event.mode;
          callback = event.callback;
        } else {
          mode = "on";
          callback = event;
        }

        if (!["on", "once"].includes(mode)) {
          return console.error(i, "mode must be (on / once)");
        }

        if (!isFunction(callback)) {
          return console.error(i, "callback is not a function");
        }

        store.__inst[`$${mode}`](i, (data) => {
          callback(data, res);
        });
      }
    },

    // 新增
    rowAdd() {
      this.broadcast("xn-upsert", "crud.add");
    },

    // 编辑
    rowEdit(data) {
      this.broadcast("xn-upsert", "crud.edit", data);
    },

    // 追加
    rowAppend(data) {
      this.broadcast("xn-upsert", "crud.append", data);
    },

    // 关闭
    rowClose() {
      this.broadcast("xn-upsert", "crud.close");
    },

    // 删除
    rowDelete(...selection) {
      // 获取请求方法
      const reqName = this.dict.api.delete;

      let params = {
        ids: selection.map((e) => e.id),
      };

      // 删除事件
      const next = (params) => {
        return new Promise((resolve, reject) => {
          this.$confirm(`此操作将永久删除选中数据，是否继续？`, "提示", {
            type: "warning",
          })
            .then((res) => {
              if (res === "confirm") {
                // Validate
                if (!this.service[reqName]) {
                  return reject(`Request function '${reqName}' is not fount`);
                }

                // Send request
                this.service[reqName](params)
                  .then((res) => {
                    this.$message.success(`删除成功`);
                    this.refresh();
                    resolve(res);
                  })
                  .catch((err) => {
                    reject(err);
                  });
              }
            })
            .catch(() => null);
        });
      };

      if (this.onDelete) {
        this.onDelete(selection, { next });
      } else {
        next(params);
      }
    },

    // 批量删除
    deleteMulti() {
      this.rowDelete.apply(this, this.selection || []);
    },

    // 打开高级搜索
    openAdvSearch() {
      this.broadcast("xn-adv-search", "crud.open");
    },

    // 关闭高级搜素
    closeAdvSearch() {
      this.broadcast("xn-adv-search", "crud.close");
    },

    // 替换参数值
    paramsReplace(params) {
      const { pagination, search, sort } = this.dict;
      let a = { ...params };
      let b = { ...pagination, ...search, ...sort };

      for (let i in b) {
        // eslint-disable-next-line
        if (a.hasOwnProperty(i)) {
          if (i != b[i]) {
            a[`_${b[i]}`] = a[i];

            delete a[i];
          }
        }
      }

      for (let i in a) {
        if (i[0] === "_") {
          a[i.substr(1)] = a[i];

          delete a[i];
        }
      }

      return a;
    },

    // 刷新请求
    refresh(newParams = {}) {
      // 设置参数
      let params = this.paramsReplace(Object.assign(this.params, newParams));

      // Loading
      this.loading = true;

      // 预防脏数据
      let rd = (this.test.refreshRd = Math.random());

      // 完成事件
      const done = () => {
        this.loading = false;
      };

      // 渲染
      const render = (list, pagination) => {
        this.broadcast("xn-table", "crud.refresh", { list });
        this.broadcast("xn-pagination", "crud.refresh", pagination);
        done();
      };

      // 请求执行
      const next = (params) => {
        return new Promise((resolve, reject) => {
          const reqName = this.dict.api.page;

          if (!this.service[reqName]) {
            done();
            return reject(`Request function '${reqName}' is not fount`);
          }

          this.service[reqName](params)
            .then((res) => {
              if (rd != this.test.refreshRd) {
                return false;
              }

              if (isString(res)) {
                return reject("Response error");
              }

              if (isArray(res)) {
                render(res);
              } else if (isObject(res)) {
                render(res.list, res.pagination);
              }

              resolve(res);
            })
            .catch((err) => {
              reject(err);
            })
            .done(() => {
              done();
              this.test.sortLock = true;
            });
        });
      };

      if (this.onRefresh) {
        return this.onRefresh(params, { next, done, render });
      } else {
        return next(params);
      }
    },

    // 重新渲染布局
    doLayout() {
      this.broadcast("xn-table", "resize");
    },

    // 完成渲染
    done() {
      this.test.process = true;
    },
  },

  render() {
    return this.scroll ? (
      <xn-scrollbar>
        <div class={"xn-crud"}>{this.$slots.default} </div>
      </xn-scrollbar>
    ) : (
      <div class={"xn-crud"}>{this.$slots.default}</div>
    );
  },
};
