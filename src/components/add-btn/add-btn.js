export default {
  name: "xn-add-btn",
  componentName: "XnAddBtn",
  inject: ["crud"],
  props: {
    props: Object,
  },
  render() {
    const { getPermission, dict, size, style, rowAdd } = this.crud;

    return (
      getPermission("add") && (
        <el-button
          {...{
            props: {
              size,
              type: "primary",
              ...this.props,
              ...style.addBtn,
            },
            on: {
              click: () => {
                rowAdd();
              },
            },
          }}
        >
          {this.$slots.default || dict.label.add}
        </el-button>
      )
    );
  },
};
