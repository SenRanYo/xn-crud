import "./styles/index.scss";
import { contains } from "@/xiaoni/utils";

export default {
  name: "xn-context-menu",
  componentName: "XnContextMenu",
  data() {
    return {
      visible: false,
      index: "",
      style: {
        left: 0,
        top: 0,
      },
      list: [],
    };
  },

  methods: {
    open(event = {}, options = {}) {
      let { list } = options;
      let { pageX, pageY } = event;

      let position = { left: pageX, top: pageY };

      if (list) this.list = list;

      this.index = "";
      this.visible = true;

      this.$nextTick(() => {
        const { clientHeight: h1, clientWidth: w1 } = document.body;
        const { clientHeight: h2, clientWidth: w2 } = this.$el.querySelector(".xn-context-menu-box");

        if (pageY + h2 > h1) position.top = h1 - h2 - 5;
        if (pageX + w2 > w1) position.left = w1 - w2 - 5;

        this.style = position;
      });

      this.stopDefault(event);
      this.hiddenChildren();

      return {
        close: this.close,
      };
    },

    close() {
      this.index = "";
      this.visible = false;
      this.$scopedSlots = {};
    },

    clickRow(e) {
      if (e.disabled) return false;

      this.index = e._index;

      if (e.callback) {
        return e.callback(e, () => {
          this.close();
        });
      }

      if (e.children) {
        e.showChildren = !e.showChildren;
      } else {
        this.close();
      }
    },

    hiddenChildren() {
      const deep = (list) => {
        list.forEach((e) => {
          this.$set(e, "showChildren", false);

          if (e.children) {
            deep(e.children);
          }
        });
      };

      deep(this.list);
    },

    stopDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    },
  },

  mounted() {
    document.body.addEventListener("mousedown", (e) => {
      if (!contains(this.$el, e.target) && this.$el != e.target) {
        this.close();
      }
    });
    document.body.appendChild(this.$el);
    window.addEventListener("resize", this.close);
  },

  render() {
    const { default: slot } = this.$scopedSlots;
    const { left, top } = this.style;

    const deep = (list, pIndex, level) => {
      return (
        <div class={["xn-context-menu-box", level > 1 && "is-append"]}>
          {list
            .filter((e) => !e.hidden)
            .map((e, i) => {
              e._index = `${pIndex}-${i}`;

              return (
                <div
                  class={{
                    "xn-context-menu-item": true,
                    "is-active": this.index.includes(e._index),
                    "is-ellipsis": e.ellipsis,
                    "is-disabled": e.disabled,
                  }}
                  on-click={() => {
                    this.clickRow(e);
                  }}
                >
                  {/* 前缀图标 */}
                  {e["prefix-icon"] && <xn-icon name={e["prefix-icon"]} class={"prefix-icon"}></xn-icon>}

                  {/* 标题 */}
                  <span class="menu-text">{e.label}</span>

                  {/* 后缀图标 */}
                  {e["suffix-icon"] && <xn-icon name={e["suffix-icon"]} class={"suffix-icon"}></xn-icon>}

                  {/* 子集 */}
                  {e.children && e.showChildren && deep(e.children, e._index, level + 1)}
                </div>
              );
            })}
        </div>
      );
    };

    return (
      <transition name="zoom">
        <div
          class="xn-context-menu"
          key={this.visible ? "show" : "hide"}
          style={{ left: left + "px", top: top + "px", display: this.visible ? "inline" : "none" }}
          oncontextmenu={this.stopDefault}
        >
          {slot ? slot() : deep(this.list, 0, 1)}
        </div>
      </transition>
    );
  },
};
