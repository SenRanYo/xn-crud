export default {
  name: "xn-multi-delete-btn",
  componentName: "XnMultiDeleteBtn",
  inject: ["crud"],
  props: {
    props: Object,
  },

  render() {
    const { getPermission, dict, size, style, selection, deleteMulti } = this.crud;

    return (
      getPermission("delete") && (
        <el-button
          {...{
            props: {
              size,
              type: "danger",
              disabled: selection.length == 0,
              ...this.props,
              ...style.multiDeleteBtn,
            },
            on: {
              click: deleteMulti,
            },
          }}
        >
          {this.$slots.default || dict.label.multiDelete || dict.label.delete}
        </el-button>
      )
    );
  },
};
