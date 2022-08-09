import "./styles/index.scss";

export default {
  name: "xn-filter",
  componentName: "XnFilter",
  props: {
    label: String,
  },
  render() {
    return (
      <div class="xn-filter">
        <span class="xn-filter__label" v-show={this.label}>
          {this.label}
        </span>
        {this.$slots.default}
      </div>
    );
  },
};
