import { isFunction } from "../../utils/typeCheck";
import { exportJsonToExcel } from "../../utils/exportToExcel";

export default {
  name: "xn-export-btn",
  componentName: "XnExportBtn",
  inject: ["crud"],
  props: {
    filename: [Function, String],
    autoWidth: {
      type: Boolean,
      default: true,
    },
    bookType: {
      type: String,
      default: "xlsx",
    },
    header: Array,
    columns: {
      type: Array,
      required: true,
    },
    data: [Function, Array],
    maxExportLimit: Number, // 最大导出条数，不传或者小于等于0为不限制
    size: {
      type: String,
      default: "mini",
    },
    disabled: Boolean,
    type: {
      type: String,
      default: "success",
    },
    plain: Boolean,
    round: Boolean,
    circle: Boolean,
    icon: String,
  },
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    async handleExport() {
      if (!this.columns) {
        return console.error("xn-export-btn.columns 不能为空！");
      }

      // 加载
      this.loading = true;

      // 表格列
      const columns = this.columns.filter((e) => !["selection", "expand", "index"].includes(e.type) && !(e.filterExport || e["filter-export"]));

      // 字段
      const fields = columns.map((e) => e.prop).filter(Boolean);

      // 表头
      let header = await this.getHeader(columns, fields);

      // 数据
      let data = await this.getData();

      if (!data) {
        this.loading = false;
        return console.error("导出数据异常");
      }

      // 文件名
      let filename = await this.getFileName();

      // 过滤
      data = data.map((d) => fields.map((f) => d[f]));

      // 导出 excel
      exportJsonToExcel({
        header,
        data,
        filename,
        autoWidth: this.autoWidth,
        bookType: this.bookType,
      });

      this.loading = false;
    },

    async getHeader(columns, fields) {
      return this.header || columns.filter((e) => fields.includes(e.prop)).map((e) => e.label);
    },

    getData() {
      if (isFunction(this.data)) {
        return this.data();
      } else {
        if (this.data) {
          return this.data;
        } else {
          const { service, params, paramsReplace, selection } = this.crud;
          const ids = selection.map((item) => item.id) || [];
          return service
            .export({
              ids,
              ...paramsReplace(params),
              maxExportLimit: this.maxExportLimit,
              isExport: true,
            })
            .then((res) => res.list)
            .catch((err) => {
              console.error(err);
              return null;
            });
        }
      }
    },

    async getFileName() {
      if (isFunction(this.filename)) {
        return await this.filename();
      } else {
        const { year, month, day, hour, minu, sec } = this.currentDate();
        return this.filename || `报表（${year}-${month}-${day} ${hour}_${minu}_${sec}）`;
      }
    },
    currentDate() {
      let d = new Date();
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minu: d.getMinutes(),
        sec: d.getSeconds(),
      };
    },
  },
  render() {
    const { dict, size, style } = this.crud;

    return (
      <el-button
        {...{
          props: {
            size: this.size || size,
            type: this.type,
            plain: this.plain,
            round: this.round,
            circle: this.circle,
            icon: this.icon,
            loading: this.loading,
            disabled: this.disabled,
            ...style.exportBtn,
          },
          on: {
            click: this.handleExport,
          },
        }}
      >
        {this.$slots.default || dict.label.export}
      </el-button>
    );
  },
};
