import _ from "lodash-es";
import Parse from "@/xiaoni/utils/parse";
import store from "@/xiaoni/crud/store";
import { mapGetters } from "vuex";
import { Emitter } from "@/xiaoni/crud/mixins";
import { renderNode } from "@/xiaoni/utils/vnode";
import "./styles/index.scss";

export default {
  name: "xn-table",
  componentName: "XnTable",
  inject: ["crud"],
  mixins: [Emitter],
  props: {
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    on: {
      type: Object,
      default: () => {
        return {};
      },
    },
    props: {
      type: Object,
      default: () => {
        return {};
      },
    },
    // 是否自动计算表格高度
    autoHeight: {
      type: Boolean,
      default: true,
    },
    // 开启右键菜单
    contextMenu: {
      type: [Boolean, Array],
      default: undefined,
    },
    // 排序刷新
    sortRefresh: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      maxHeight: null,
      data: [],
      emit: {},
      cellEditSaving: false,
      dblClickRow: {},
    };
  },

  created() {
    // 获取默认排序
    const { order, prop } = this.props["default-sort"] || {};

    if (order && prop) {
      this.crud.params.order = order === "descending" ? "desc" : "asc";
      this.crud.params.prop = prop;
    }

    // 事件监听

    this.$on("resize", () => {
      this.calcMaxHeight();
    });

    this.$on("crud.refresh", ({ list }) => {
      this.data = list;
    });
  },
  computed: {
    ...mapGetters(["screenSize"]),
  },
  mounted() {
    this.renderEmpty();
    this.calcMaxHeight();
    this.bindEmits();
    this.bindMethods();
  },

  methods: {
    // 渲染列
    renderColumn() {
      return this.columns
        .map((item, index) => {
          // 解析 hidden
          item._hidden = Parse("hidden", {
            value: item.hidden,
            data: {
              ...item,
            },
          });

          if (item._hidden) {
            return false;
          }

          // 多级渲染
          const deep = (item) => {
            let params = {
              props: item,
              on: item.on,
            };

            // 操作列
            if (item.type === "op") {
              return this.renderOp(item);
            }

            // 数据列
            if (!item.type || item.type === "expand") {
              params.scopedSlots = {
                default: (scope) => {
                  // 自定义插槽渲染
                  const slot = this.$scopedSlots[`column-${item.prop}`];
                  // 数据
                  const newScope = {
                    ...scope,
                    ...item,
                  };

                  // 绑定值
                  const value = scope.row[item.prop];

                  if (slot) {
                    // 使用插槽
                    return slot({
                      scope: newScope,
                    });
                  } else {
                    // 使用组件渲染
                    if (item.component) {
                      return renderNode(item.component, {
                        prop: item.prop,
                        scope: newScope.row,
                      });
                    }
                    // 数据格式化
                    else if (item.formatter) {
                      return item.formatter(newScope.row, newScope.column, newScope.row[item.prop], newScope.$index);
                    }
                    // 匹配字典
                    else if (item.dict) {
                      let data = item.dict.find((d) => d.value == value);

                      if (data) {
                        return (
                          <el-tag
                            {...{
                              props: {
                                size: "small",
                                "disable-transitions": true,
                                effect: "dark",
                                ...data,
                              },
                            }}
                          >
                            {data.label}
                          </el-tag>
                        );
                      } else {
                        return value;
                      }
                    }
                    // 空数据显示
                    else if (_.isNull(value)) {
                      return scope.emptyText;
                    }
                    // 默认值
                    else {
                      return value;
                    }
                  }
                },
                header: (scope) => {
                  let slot = this.$scopedSlots[`header-${item.prop}`];

                  if (slot) {
                    return slot({
                      scope,
                    });
                  } else {
                    return scope.column.label;
                  }
                },
              };
            }

            // 多级
            const childrenEl = item.children ? item.children.map(deep) : null;

            return (
              <el-table-column
                key={`crud-table-column-${index}`}
                align="center"
                index={(i) => {
                  return store.__crud.table.indexMethod ? store.__crud.table.indexMethod(i, this.crud) : i + 1;
                }}
                {...params}
              >
                {childrenEl}
              </el-table-column>
            );
          };

          return deep(item);
        })
        .filter(Boolean);
    },

    // 渲染操作列
    renderOp(item) {
      const { rowEdit, rowDelete, permission, dict, style } = this.crud;

      if (!item) {
        return null;
      }

      // 渲染编辑、删除、自定义按钮
      const render = (scope) => {
        return (item.buttons || ["edit", "delete"]).map((vnode) => {
          if (vnode === "update" || vnode === "edit") {
            return (
              permission.update && (
                <el-button
                  {...{
                    props: {
                      size: "mini",
                      type: "primary",
                      ...style.editBtn,
                    },
                    on: {
                      click: () => {
                        rowEdit(scope.row);
                      },
                    },
                  }}
                >
                  {dict.label.update}
                </el-button>
              )
            );
          } else if (vnode === "delete") {
            return (
              permission.delete && (
                <el-button
                  {...{
                    props: {
                      size: "mini",
                      type: "danger",
                      ...style.deleteBtn,
                    },
                    on: {
                      click: () => {
                        rowDelete(scope.row);
                      },
                    },
                  }}
                >
                  {dict.label.delete}
                </el-button>
              )
            );
          } else {
            return renderNode(vnode, {
              scope,
              $scopedSlots: this.$scopedSlots,
            });
          }
        });
      };

      return (
        <el-table-column
          {...{
            props: {
              label: "操作",
              width: "160px",
              align: "center",
              fixed: this.screenSize === "xs" ? null : "right",
              ...item,
              ...style.tableOp,
            },
            scopedSlots: {
              default: (scope) => {
                let el = null;

                // Dropdown op
                if (item.name == "dropdown-menu") {
                  const slot = this.$scopedSlots["table-op-dropdown-menu"];
                  const { width = "97px", label } = item["dropdown-menu"] || {};
                  const items = render(scope).map((e) => {
                    return <el-dropdown-item>{e}</el-dropdown-item>;
                  });

                  el = (
                    <el-dropdown trigger="click" placement="bottom">
                      {slot ? (
                        slot({ scope })
                      ) : (
                        <el-button plain size="mini">
                          {label || "更多操作"}
                          <i class="el-icon-arrow-down el-icon--right"></i>
                        </el-button>
                      )}

                      <el-dropdown-menu style={{ width }} class="xn-crud__op-dropdown-menu" {...{ slot: "dropdown" }}>
                        {items}
                      </el-dropdown-menu>
                    </el-dropdown>
                  );
                } else {
                  el = render(scope);
                }

                return <div class="xn-table__op">{el}</div>;
              },
            },
          }}
        />
      );
    },

    // 渲染空数据
    renderEmpty() {
      const empty = this.$scopedSlots["table-empty"];
      const scope = {
        h: this.$createElement,
        scope: this,
      };

      if (empty) {
        this.$scopedSlots.empty = () => {
          return empty(scope)[0];
        };
      }
    },

    // 渲染追加数据
    renderAppend() {
      return this.$slots["append"];
    },

    // 设置列
    setColumn(prop, data) {
      this.columns.forEach((e) => {
        if (e.prop === prop) {
          for (let i in data) {
            this.$set(e, i, data[i]);
          }
        }
      });
    },

    // 显示列
    showColumn(prop) {
      const props = _.isArray(prop) ? prop : [prop];

      this.columns
        .filter((e) => props.includes(e.prop))
        .forEach((e) => {
          this.$set(e, "hidden", false);
        });
    },

    // 隐藏列
    hiddenColumn(prop) {
      const props = _.isArray(prop) ? prop : [prop];

      this.columns
        .filter((e) => props.includes(e.prop))
        .forEach((e) => {
          this.$set(e, "hidden", true);
        });
    },

    // 改变排序方式
    changeSort(prop, order) {
      if (order === "desc") {
        order = "descending";
      }

      if (order === "asc") {
        order = "ascending";
      }

      this.$refs["table"].sort(prop, order);
    },

    // 监听排序
    onSortChange({ prop, order }) {
      if (this.sortRefresh) {
        if (order === "descending") {
          order = "desc";
        }

        if (order === "ascending") {
          order = "asc";
        }

        if (!order) {
          prop = null;
        }

        if (this.crud.test.sortLock) {
          this.crud.refresh({
            prop,
            order,
            page: 1,
          });
        }
      }

      this.$emit("sort-change", { prop, order });
    },

    // 监听表格选择
    onSelectionChange(selection) {
      this.dispatch("xn-crud", "table.selection-change", { selection });
      this.$emit("selection-change", selection);
    },

    // 右键菜单
    onRowContextMenu(row, column, event) {
      const { refresh, rowEdit, rowDelete, getPermission, selection, table = {} } = this.crud;

      // 配置
      const cm = _.isEmpty(this.contextMenu) && !_.isArray(this.contextMenu) ? table["context-menu"] : this.contextMenu;

      let buttons = ["refresh", "check", "edit", "delete", "order-asc", "order-desc"];
      let enable = false;

      if (cm) {
        if (_.isArray(cm)) {
          buttons = cm || [];
          enable = Boolean(buttons.length > 0);
        } else {
          enable = true;
        }
      }

      if (enable) {
        // 解析按钮
        let list = buttons
          .map((e) => {
            switch (e) {
              case "refresh":
                return {
                  label: "刷新",
                  "prefix-icon": "xn-icon-reload",
                  callback: (_, done) => {
                    refresh();
                    done();
                  },
                };
              case "edit":
              case "update":
                return {
                  label: "编辑",
                  "prefix-icon": "xn-icon-edit",
                  hidden: !getPermission("update"),
                  callback: (_, done) => {
                    rowEdit(row);
                    done();
                  },
                };
              case "delete":
                return {
                  label: "删除",
                  "prefix-icon": "xn-icon-delete",
                  hidden: !getPermission("delete"),
                  callback: (_, done) => {
                    rowDelete(row);
                    done();
                  },
                };
              case "check":
                return {
                  label: selection.find((e) => e.id == row.id) ? "取消选择" : "选择",
                  "prefix-icon": selection.find((e) => e.id == row.id) ? "xn-icon-export" : "xn-icon-Import",
                  hidden: !this.columns.find((e) => e.type === "selection"),
                  callback: (_, done) => {
                    this.toggleRowSelection(row);
                    done();
                  },
                };
              case "order-desc":
                return {
                  label: `${column.label} - 降序`,
                  "prefix-icon": "xn-icon-sort-ascending",
                  hidden: !column.sortable,
                  callback: (_, done) => {
                    this.changeSort(column.property, "desc");
                    done();
                  },
                };
              case "order-asc":
                return {
                  label: `${column.label} - 升序`,
                  "prefix-icon": "xn-icon-sort-descending",
                  hidden: !column.sortable,
                  callback: (_, done) => {
                    this.changeSort(column.property, "asc");
                    done();
                  },
                };
              default:
                if (_.isFunction(e)) {
                  return e(row, column, event);
                } else {
                  return e;
                }
            }
          })
          .filter((e) => Boolean(e) && !e.hidden);

        // 打开右键菜单
        if (!_.isEmpty(list)) {
          this.$crud.openContextMenu(event, {
            list,
          });
        }
      }

      if (this.on["row-contextmenu"]) {
        this.on["row-contextmenu"](row, column, event);
      }
    },

    // 绑定 el-table 回调
    bindEmits() {
      const emits = [
        "select",
        "select-all",
        "cell-mouse-enter",
        "cell-mouse-leave",
        "cell-click",
        "cell-dblclick",
        "row-click",
        "row-contextmenu",
        "row-dblclick",
        "header-click",
        "header-contextmenu",
        "filter-change",
        "current-change",
        "header-dragend",
        "expand-change",
      ];

      emits.forEach((name) => {
        this.emit[name] = (...args) => {
          this.$emit(name, ...args);
        };
      });
    },

    // 绑定 el-table 事件
    bindMethods() {
      const methods = [
        "clearSelection",
        "toggleRowSelection",
        "toggleAllSelection",
        "toggleRowExpansion",
        "setCurrentRow",
        "clearSort",
        "clearFilter",
        "doLayout",
        "sort",
      ];

      methods.forEach((n) => {
        this[n] = this.$refs["table"][n];
      });
    },

    // 计算表格最大高度
    calcMaxHeight() {
      if (!this.autoHeight) {
        return false;
      }

      return this.$nextTick(() => {
        const el = this.crud.$el.parentNode;
        let { height = "" } = this.props || {};

        if (el) {
          let rows = el.querySelectorAll(".xn-crud .el-row");

          if (!rows[0] || !rows[0].isConnected) {
            return false;
          }

          let h = 25;

          for (let i = 0; i < rows.length; i++) {
            let f = true;

            for (let j = 0; j < rows[i].childNodes.length; j++) {
              if (rows[i].childNodes[j].className == "xn-table") {
                f = false;
              }
            }

            if (f) {
              h += rows[i].clientHeight + 5;
            }
          }

          let h1 = Number(String(height).replace("px", ""));
          let h2 = el.clientHeight - h;

          this.maxHeight = h1 > h2 ? h1 : h2;
        }
      });
    },
  },

  render() {
    const { size } = this.crud;
    return (
      <div class="xn-table">
        <el-table
          ref="table"
          data={this.data}
          v-loading={this.crud.loading}
          {...{
            on: {
              "selection-change": this.onSelectionChange,
              "sort-change": this.onSortChange,
              ...this.emit,
              ...this.on,
              "row-contextmenu": this.onRowContextMenu,
            },
            props: {
              "max-height": this.maxHeight + "px",
              border: true,
              size,
              ...this.props,
              ...this.crud.style.table,
            },
            scopedSlots: {
              ...this.$scopedSlots,
            },
            slots: {
              ...this.$slots,
            },
          }}
        >
          {this.renderColumn()}
        </el-table>
      </div>
    );
  },
};
