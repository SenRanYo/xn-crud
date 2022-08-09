export default {
  name: "xn-refresh-btn",
  componentName: "XnRefreshBtn",
  inject: ["crud"],
  props: {
    props: Object,
  },

  render() {
    const { refresh, size, dict, style } = this.crud;

    return (
      <el-button
        {...{
          props: {
            size,
            ...this.props,
            ...style.refreshBtn,
          },
          on: {
            click: () => {
              refresh();
            },
          },
        }}
      >
        {this.$slots.default || dict.label.refresh}
      </el-button>
    );
  },
};
