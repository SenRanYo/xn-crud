import store from "@/xiaoni/crud/store";
import Parse from "@/xiaoni/utils/parse";
import valueHook from "@/xiaoni/crud/hook/value";
import { mapGetters } from "vuex";
import { renderNode } from "@/xiaoni/utils/vnode";
import { deepMerge, cloneDeep } from "@/xiaoni/utils";
import { Form, Emitter } from "@/xiaoni/crud/mixins";
import { isFunction, isEmpty, isString, isObject, isBoolean } from "@/xiaoni/utils/typeCheck";

import "./styles/index.scss";

export default {
  name: "xn-form",
  componentName: "XnForm",
  mixins: [Emitter, Form],
  props: {
    // 表单值
    value: {
      type: Object,
      default: () => ({}),
    },
    // 是否只显示表单
    inner: Boolean,
    // 绑定组件名，设置方法
    bindComponentName: String,
  },
  provide() {
    return {
      form: this.form,
    };
  },
  data() {
    return {
      visible: false,
      saving: false,
      loading: false,
      form: {},
      conf: {
        title: "自定义表单",
        width: "50%",
        props: {
          size: "mini",
          "label-width": "100px",
        },
        on: {
          open: null,
          submit: null,
          close: null,
        },
        op: {
          hidden: false,
          saveButtonText: "保存",
          closeButtonText: "取消",
          buttons: ["close", "save"],
        },
        dialog: {
          props: {
            fullscreen: false,
            "close-on-click-modal": false,
            "append-to-body": true,
          },
          hiddenControls: false,
          controls: ["fullscreen", "close"],
        },
        items: [],
        _data: {},
      },
      tabActive: null,
    };
  },

  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(val) {
        this.form = val;
      },
    },
  },
  computed: {
    ...mapGetters(["screenSize"]),
  },
  methods: {
    create(options = {}) {
      // 合并配置
      for (let i in this.conf) {
        switch (i) {
          case "items":
            this.conf.items = cloneDeep(options.items || []);
            break;
          case "title":
            this.conf[i] = options[i];
            break;
          case "width":
            if (options && options.props && options.props[i]) {
              this.conf[i] = options?.props[i];
            }
            break;
          default:
            deepMerge(this.conf[i], options[i]);
            break;
        }
      }

      // 预设表单值
      if (options.form) {
        for (let i in options.form) {
          this.$set(this.form, i, options.form[i]);
        }
      }

      // 设置表单默认值
      this.conf.items.map((e) => {
        if (e.prop) {
          this.$set(this.form, e.prop, valueHook.bind(isEmpty(this.form[e.prop]) ? cloneDeep(e.value) : this.form[e.prop], e.hook, this.form));
        }
      });

      // 打开回调
      const { open } = this.conf.on;

      if (open) {
        this.$nextTick(() => {
          open(this.form, {
            close: this.close,
            submit: this.submit,
            done: this.done,
          });
        });
      }

      return this;
    },

    open(options) {
      this.visible = true;
      return this.create(options);
    },

    beforeClose() {
      if (this.conf.on.close) {
        this.conf.on.close(this.close);
      } else {
        this.close();
      }
    },

    close() {
      this.visible = false;
      this.clear();
      this.done();
    },

    onClosed() {
      this.tabActive = null;

      for (let i in this.form) {
        delete this.form[i];
      }
    },

    done() {
      this.saving = false;
    },

    clear() {
      this.clearValidate();
    },

    submit(callback) {
      // 验证表单
      this.$refs["form"].validate(async (valid, error) => {
        if (valid) {
          this.saving = true;

          // 响应方法
          const res = {
            done: this.done,
            close: this.close,
            $refs: store.__inst.$refs,
          };

          // 表单数据
          const d = cloneDeep(this.form);

          // 过滤被隐藏的数据
          this.conf.items.forEach((e) => {
            if (e._hidden) {
              delete d[e.prop];
            }

            if (e.hook) {
              d[e.prop] = valueHook.submit(d[e.prop], e.hook, d);
            }
          });

          // 提交钩子
          const submit = callback || this.conf.on.submit;

          // 提交事件
          if (isFunction(submit)) {
            submit(d, res);
          } else {
            console.error("Not found callback function");
          }
        } else {
          // 判断是否使用form-tabs，切换到对应的选项卡
          const keys = Object.keys(error);

          if (this.tabActive) {
            const item = this.conf.items.find((e) => e.prop === keys[0]);

            if (item) {
              this.tabActive = item.group;
            }
          }
        }
      });
    },

    // 重新绑定表单数据
    reBindForm(data) {
      const d = {};

      this.conf.items.forEach((e) => {
        d[e.prop] = e.hook ? valueHook.bind(data[e.prop], e.hook, data) : data[e.prop];
      });

      Object.assign(this.form, data, d);
    },

    // 渲染表单
    renderForm() {
      const { props, items, _data } = this.conf;

      return (
        <el-form
          ref="form"
          {...{
            props: {
              "label-position": this.screenSize === "xs" ? "top" : "",
              disabled: this.saving,
              model: this.form,
              ...props,
            },
          }}
        >
          {/* 表单项列表 */}
          <el-row gutter={10} v-loading={this.loading}>
            {items.map((e, i) => {
              if (e.type == "tabs") {
                return <xn-form-tabs v-model={this.tabActive} {...{ props: { ...e.props } }}></xn-form-tabs>;
              }

              // 是否隐藏
              e._hidden = Parse("hidden", {
                value: e.hidden,
                scope: this.form,
                data: {
                  ..._data,
                  isAdd: !_data.isEdit,
                },
              });

              // 是否禁用
              e._disabled = Parse("disabled", {
                value: e.disabled,
                scope: this.form,
                data: {
                  ..._data,
                  isAdd: !_data.isEdit,
                },
              });

              if (e._disabled) {
                if (!e.component.attrs) {
                  e.component.attrs = {};
                }
                e.component.attrs.disabled = true;
              }

              // 是否分组显示
              e._group = isEmpty(this.tabActive) || isEmpty(e.group) ? true : e.group === this.tabActive;

              // 解析标题
              if (isString(e.label)) {
                e._label = {
                  text: e.label,
                };
              } else if (isObject(e.label)) {
                e._label = e.label;
              } else {
                e._label = {
                  text: "",
                };
              }

              return (
                !e._hidden && (
                  <el-col
                    key={`form-item-${i}`}
                    {...{
                      props: {
                        key: i,
                        span: 24,
                        ...e,
                      },
                    }}
                  >
                    {e.component && (
                      <el-form-item
                        v-show={e._group}
                        {...{
                          props: {
                            label: e._label.text,
                            prop: e.prop,
                            rules: e.rules,
                            ...e.props,
                          },
                        }}
                      >
                        {/* Redefine label */}
                        <template slot="label">
                          <el-tooltip effect="dark" placement="top" content={e._label.tip} disabled={!e._label.tip}>
                            <span>
                              {e._label.text}
                              {e._label.icon && <i class={e._label.icon}></i>}
                            </span>
                          </el-tooltip>
                        </template>

                        {/* Form item */}
                        <div class="xn-form-item">
                          {/* Component */}
                          {["prepend", "component", "append"].map((name) => {
                            return (
                              e[name] && (
                                <div
                                  v-show={!e.collapse}
                                  class={[
                                    `xn-form-item__${name}`,
                                    {
                                      "is-flex": isEmpty(e.flex) ? true : e.flex,
                                    },
                                  ]}
                                >
                                  {renderNode(e[name], {
                                    prop: e.prop,
                                    scope: this.form,
                                    $scopedSlots: this.$scopedSlots,
                                  })}
                                </div>
                              )
                            );
                          })}
                        </div>
                        {/* Collapse button */}
                        {isBoolean(e.collapse) && (
                          <div
                            class="xn-form-item__collapse"
                            on-click={() => {
                              this.collapseItem(e);
                            }}
                          >
                            <el-divider content-position="center">
                              {e.collapse ? (
                                <span>
                                  查看更多
                                  <i class="el-icon-arrow-down"></i>
                                </span>
                              ) : (
                                <span>
                                  隐藏内容
                                  <i class="el-icon-arrow-up"></i>
                                </span>
                              )}
                            </el-divider>
                          </div>
                        )}
                      </el-form-item>
                    )}
                  </el-col>
                )
              );
            })}
          </el-row>
        </el-form>
      );
    },

    // 渲染操作按钮
    renderOp() {
      const { style } = store.__crud;
      const { hidden, buttons, saveButtonText, closeButtonText } = this.conf.op;
      const { size = "mini" } = this.conf.props;

      return hidden
        ? null
        : buttons.map((vnode) => {
            if (vnode == "save") {
              return (
                <el-button
                  {...{
                    props: {
                      size,
                      type: "success",
                      disabled: this.loading,
                      loading: this.saving,
                      ...style.saveBtn,
                    },
                    on: {
                      click: () => {
                        this.submit();
                      },
                    },
                  }}
                >
                  {saveButtonText}
                </el-button>
              );
            } else if (vnode == "close") {
              return (
                <el-button
                  {...{
                    props: {
                      size,
                      ...style.closeBtn,
                    },
                    on: {
                      click: () => {
                        this.beforeClose();
                      },
                    },
                  }}
                >
                  {closeButtonText}
                </el-button>
              );
            } else {
              return renderNode(vnode, {
                scope: this.form,
                $scopedSlots: this.$scopedSlots,
              });
            }
          });
    },
  },

  render() {
    const Form = (
      <div class="xn-form">
        <div class="xn-form__container">{this.renderForm()}</div>
        <div class="xn-form__footer">{this.renderOp()}</div>
      </div>
    );

    if (this.inner) {
      return Form;
    } else {
      const { title, width, dialog } = this.conf;

      return (
        <xn-dialog
          title={title}
          width={width}
          visible={this.visible}
          {...{
            props: {
              ...dialog,
              props: {
                ...dialog.props,
                "before-close": this.beforeClose,
              },
            },
            on: {
              "update:visible": (v) => (this.visible = v),
              "update:props:fullscreen": (v) => (dialog.props.fullscreen = v),
              closed: this.onClosed,
            },
          }}
        >
          {Form}
        </xn-dialog>
      );
    }
  },
};
