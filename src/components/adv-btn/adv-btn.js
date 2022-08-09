import "./styles/index.scss";

export default {
  name: "xn-adv-btn",
  componentName: "XnAdvBtn",
  inject: ["crud"],
  props: {
    props: Object,
  },
  render() {
    const { dict, size, style, openAdvSearch } = this.crud;

    return (
      <div class="xn-adv-btn">
        <el-button
          {...{
            props: {
              size,
              ...this.props,
              ...style.advBtn,
            },
            on: {
              click: openAdvSearch,
            },
          }}
        >
          <xn-icon name="xn-icon-search" />
          {this.$slots.default || dict.label.advSearch}
        </el-button>
      </div>
    );
  },
};
