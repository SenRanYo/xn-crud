import { mapGetters } from "vuex";
import { cloneDeep } from "../../utils";
import { renderNode } from "../../utils/vnode";

import "./styles/index.scss";

export default {
  name: "xn-adv-search",
  componentName: "XnAdvSearch",
  inject: ["crud"],
  props: {
    // 表单项
    items: {
      type: Array,
      default: () => [],
    },
    // el-drawer 参数
    props: {
      type: Object,
      default: () => ({}),
    },
    // 操作按钮 ['search', 'reset', 'clear', 'close']
    opList: {
      type: Array,
      default: () => ["search", "reset", "clear", "close"],
    },
    // 打开前钩子 { data, { next } }
    onOpen: Function,
    // 关闭前钩子 { done }
    onClose: Function,
    // 搜索时钩子 { data, { next, close } }
    onSearch: Function,
  },
  computed: {
    ...mapGetters(["screenSize"]),
  },
  data() {
    return {
      visible: false,
      form: {},
    };
  },

  created() {
    this.$on("crud.open", this.open);
    this.$on("crud.close", this.close);
  },

  methods: {
    // 打开
    open() {
      // 打开事件
      const next = (data) => {
        this.visible = true;

        if (data) {
          Object.assign(this.form, data);
        }

        this.$nextTick(() => {
          this.$refs["form"].create({
            items: this.items,
            op: {
              hidden: true,
            },
          });
        });

        this.$emit("open", this.form);
      };

      if (this.onOpen) {
        this.onOpen(this.form, { next });
      } else {
        next(null);
      }
    },

    // 关闭
    close() {
      // 关闭事件
      const done = () => {
        this.visible = false;
        this.$emit("close");
      };

      if (this.onClose) {
        this.onClose(done);
      } else {
        done();
      }
    },

    // 重置
    reset() {
      this.$refs["form"].resetFields();
      this.$emit("reset");
    },

    // 清空
    clear() {
      for (let i in this.form) {
        this.form[i] = undefined;
      }
      this.$emit("clear");
    },

    // 搜索
    search() {
      const params = cloneDeep(this.form);
      // 搜索事件
      const next = (params) => {
        this.crud.refresh({
          ...params,
          page: 1,
        });

        this.close();
      };

      if (this.onSearch) {
        this.onSearch(params, { next, close: this.close });
      } else {
        next(params);
      }
    },
  },

  render() {
    const { size } = this.crud;
    const buttons = {
      search: {
        key: "search",
        name: "搜索",
        type: "primary",
      },
      reset: {
        key: "reset",
        name: "重置",
        type: "danger",
      },
      clear: {
        key: "clear",
        name: "清空",
        type: "default",
      },
      close: {
        key: "close",
        name: "取消",
        type: "default",
      },
    };
    return (
      <div class="xn-adv-search">
        <el-drawer
          {...{
            props: {
              visible: this.visible,
              title: "高级搜索",
              direction: "rtl",
              size: this.screenSize === "xs" ? "100%" : "500px",
              ...this.props,
            },
            on: {
              "update:visible": () => {
                this.close();
              },
              ...this.on,
            },
          }}
        >
          <div class="xn-adv-search__container">
            <xn-form
              v-model={this.form}
              ref="form"
              inner
              bind-component-name="XnAdvSearch"
              {...{
                scopedSlots: {
                  ...this.$scopedSlots,
                },
              }}
            ></xn-form>
          </div>

          <div class="xn-adv-search__footer">
            {this.opList.map((e) => {
              if (buttons[e]) {
                return (
                  <el-button
                    {...{
                      props: {
                        size,
                        type: buttons[e].type,
                      },
                      on: {
                        click: this[buttons[e].key],
                      },
                    }}
                  >
                    {buttons[e].name}
                  </el-button>
                );
              } else {
                return renderNode(e, {
                  scope: this.form,
                  $scopedSlots: this.$scopedSlots,
                });
              }
            })}
          </div>
        </el-drawer>
      </div>
    );
  },
};
