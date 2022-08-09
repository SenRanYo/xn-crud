import { cloneDeep } from "../../utils";
import "./styles/index.scss";

export default {
  name: "xn-filter-group",
  componentName: "XnFilterGroup",
  inject: ["crud"],
  props: {
    // 表单值
    value: {
      type: Object,
      default: () => ({}),
    },
    // 搜索时钩子, data, { next }
    onSearch: Function,
  },
  data() {
    return {
      oldForm: cloneDeep(this.value),
      form: {},
      loading: false,
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
  methods: {
    search() {
      const next = (params) => {
        this.loading = true;

        this.crud
          .refresh({
            ...this.form,
            page: 1,
            ...params,
          })
          .done(() => {
            this.loading = false;
          });
      };

      if (this.onSearch) {
        this.onSearch(this.form, { next });
      } else {
        next();
      }
    },

    reset() {
      for (let i in this.form) {
        this.form[i] = this.oldForm[i] === undefined ? undefined : this.oldForm[i];
      }
      this.search();
      this.$emit("reset");
    },
  },

  render() {
    const { size, style } = this.crud;

    return (
      <div class="xn-filter-group">
        <div class="xn-filter-group__items">{this.$slots.default}</div>

        <div class="xn-filter-group__op">
          <el-button
            {...{
              props: {
                size,
                type: "primary",
                ...style.filterSearchBtn,
                loading: this.loading,
              },
              on: {
                click: () => {
                  this.search();
                },
              },
            }}
          >
            搜索
          </el-button>
          <el-button size={size} onClick={this.reset}>
            重置
          </el-button>
        </div>
      </div>
    );
  },
};
