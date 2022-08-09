<template>
  <div class="xn-import-btn">
    <el-button :style="[crud.style.importBtn]" :size="_size" :type="type" :plain="plain" :round="round" :circle="circle" :icon="icon" @click="visible = true">
      <slot>
        {{ loading ? "导入中" : crud.dict.label.import }}
      </slot>
    </el-button>
    <xn-dialog title="导入" width="600px" :visible.sync="visible" @closed="handleOnClosed">
      <div class="content-wrap">
        <div class="control-btn-wrap">
          <input hidden ref="file" type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" @change="handleFileChange" />
          <el-button type="info" icon="xn-icon-folder-open" size="small" @click="handleClickSelectFileButton">选择文件</el-button>
          <el-button type="primary" icon="xn-icon-arrowdown" size="small" @click="handleDownloadTemplate">下载模板</el-button>
          <el-button type="success" icon="xn-icon-arrowup" size="small" :loading="loading" :disabled="_disabled" @click="handleUploadFile">解析文件</el-button>
        </div>
        <el-alert title="请选择和模板格式一样的数据" type="warning" effect="dark" show-icon :closable="false"> </el-alert>
        <div class="file-list">
          <div class="file-item" v-for="(file, index) in files" :key="index">
            <span class="name-text">文件名：{{ file.name }}</span>
            <span class="size-text">大小：{{ (file.size / 1000).toFixed(2) }}KB</span>
            <span class="success-text">状态：{{ file.uploadStauts }}</span>
            <span class="progress-text">解析进度：{{ file.progress || 0 }}%</span>
            <xn-icon class="delete-btn" name="xn-icon-delete" color="red" size="16" title="删除" @click="handleDeleteFile(index)"></xn-icon>
          </div>
        </div>
      </div>
    </xn-dialog>
  </div>
</template>

<script>
import { isFunction } from "../../utils/typeCheck";
import { exportJsonToExcel } from "../../utils/exportToExcel";
export default {
  name: "xn-import-btn",
  componentName: "XnImportBtn",
  inject: ["crud"],
  props: {
    size: {
      type: String,
      default: "mini",
    },
    disabled: Boolean,
    type: {
      type: String,
      default: "warning",
    },
    data: {
      type: Object,
    },
    request: {
      type: Function,
    },
    columns: {
      type: Array,
      required: true,
    },
    header: Array,
    autoWidth: {
      type: Boolean,
      default: true,
    },
    bookType: {
      type: String,
      default: "xlsx",
    },
    filename: {
      filename: [Function, String],
    },
    plain: Boolean,
    round: Boolean,
    circle: Boolean,
    icon: String,
  },
  data() {
    return {
      files: [],
      loading: false,
      visible: false,
      fileChangeEvent: null,
    };
  },
  computed: {
    _size() {
      return this.size || this.crud.size;
    },
    _disabled() {
      return this.disabled || this.loading;
    },
  },
  methods: {
    // 下载模板
    async handleDownloadTemplate() {
      if (!this.columns) return console.error("xn-export-btn.columns 不能为空！");
      // 表格列
      const columns = this.columns.filter((e) => !["selection", "expand", "index"].includes(e.type) && !(e.filterExport || e["filter-export"]));
      // 字段
      const fields = columns.map((e) => e.prop).filter(Boolean);
      // 表头
      let header = await this.handleGetHeader(columns, fields);
      // 文件名
      let filename = await this.handleGetFileName();
      // 导出 excel
      exportJsonToExcel({
        header,
        filename,
        data: [],
        autoWidth: this.autoWidth,
        bookType: this.bookType,
      });
    },
    // 触发选择文件
    handleClickSelectFileButton() {
      this.$refs.file.dispatchEvent(new MouseEvent("click"));
    },
    // 监听选择文件
    handleFileChange(event) {
      this.fileChangeEvent = event;
      for (let index = 0; index < event.target.files.length; index++) {
        event.target.files[index].progress = 0;
        event.target.files[index].total = 0;
        event.target.files[index].loaded = 0;
        event.target.files[index].uploadStauts = "等待解析";
      }
      this.files = [...event.target.files];
    },
    // 监听删除文件
    handleDeleteFile(index) {
      this.files.splice(index, 1);
      this.fileChangeEvent.target.value = null;
    },
    // 上传文件
    handleUploadFile() {
      if (this.files.length) {
        this.loading = true;
        this.files.forEach((file, index) => {
          let formData = new FormData();
          formData.append("file", file);
          if (this.request) {
            for (let i in this.data) {
              formData.append(i, this.data[i]);
            }
            this.request(formData)
              .then((res) => {
                this.$message.success("导入成功");
                this.crud.refresh();
                this.$emit("success", res);
              })
              .catch((err) => {
                this.$emit("error", err);
                console.error(err);
              })
              .done(() => {
                this.loading = false;
                this.$emit("done");
              });
          } else {
            this.crud.service
              .import(formData, (e) => {
                this.files[index].total = e.total;
                this.files[index].loaded = e.loaded;
                this.files[index].uploadStauts = "解析中";
                this.files[index].progress = parseInt((e.loaded / e.total) * 100);
                if (this.files[index].progress == 100) {
                  this.files[index].uploadStauts = "解析成功";
                }
              })
              .then((res) => {
                this.$message.success("导入成功");
                this.crud.refresh();
                this.$emit("success", res);
              })
              .catch((err) => {
                this.$emit("error", err);
                console.error(err);
              })
              .done(() => {
                this.loading = false;
                this.$emit("done");
              });
          }
        });
      } else {
        this.$message.error("请先选择文件，在解析！");
      }
    },
    // 获取模板表头
    async handleGetHeader(columns, fields) {
      return this.header || columns.filter((e) => fields.includes(e.prop)).map((e) => e.label);
    },
    // 获取模板文件名
    async handleGetFileName() {
      if (isFunction(this.filename)) {
        return await this.filename();
      } else {
        const { year, month, day, hour, minu, sec } = this.handleGetCurrentDate();
        return this.filename || `导入模板（${year}-${month}-${day} ${hour}_${minu}_${sec}）`;
      }
    },
    // 获取当前时间
    handleGetCurrentDate() {
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
    // 监听关闭弹窗
    handleOnClosed() {
      this.files = [];
      this.fileChangeEvent = null;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./styles/index.scss";
</style>
