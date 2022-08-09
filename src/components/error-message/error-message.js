import "./styles/index.scss";

export default {
  name: "xn-error-message",
  componentName: "XnErrorMessage",
  props: {
    title: String,
  },
  render() {
    return <el-alert title={this.title} type="error"></el-alert>;
  },
};
