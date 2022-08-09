import { cloneDeep } from "lodash-es";

export const themes = [
  {
    name: "default",
    config: {
      "primary-color": "24, 144, 255",
      "warning-color": "255, 186, 0",
      "danger-color": "255, 73, 73",
      "success-color": "70, 201, 58",
      "info-color": "144, 147, 153",

      "layout-color": "255, 255, 255",
      "layout-shadow": "0px 4px 25px 0px rgb(0 0 0 / 8%)",

      "text-color": "81, 90, 110",
      "border-color": "211, 215, 224",
      "background-color": "248, 248, 248",

      "hover-text-color": "75, 75, 90",
      "hover-background-color": "247, 247, 247",

      "icon-color": "107, 108, 113",
      "button-text-color": "255, 255, 255",
      "components-background-color": "255, 255, 255",
    },
  },
  {
    name: "light",
    config: {
      "primary-color": "24, 144, 255",
      "warning-color": "255, 186, 0",
      "danger-color": "255, 73, 73",
      "success-color": "70, 201, 58",
      "info-color": "144, 147, 153",

      "layout-color": "255, 255, 255",
      "layout-shadow": "0px 4px 25px 0px rgb(0 0 0 / 8%)",

      "text-color": "81, 90, 110",
      "border-color": "211, 215, 224",
      "background-color": "248, 248, 248",

      "hover-text-color": "75, 75, 90",
      "hover-background-color": "247, 247, 247",

      "icon-color": "107, 108, 113",
      "button-text-color": "255, 255, 255",
      "components-background-color": "255, 255, 255",
    },
  },
  {
    name: "dark",
    config: {
      "primary-color": "45, 140, 240",
      "warning-color": "255, 186, 0",
      "danger-color": "255, 71, 87",
      "success-color": "70, 201, 58",
      "info-color": "144, 147, 153",

      "layout-color": "59, 60, 69",
      "layout-shadow": "0px 4px 25px 0px rgb(0 0 0 / 8%)",

      "text-color": "225, 225, 227",
      "border-color": "86, 87, 100",
      "background-color": "46, 47, 52",

      "hover-text-color": "138, 140, 141",
      "hover-background-color": "86, 87, 100",

      "icon-color": "138, 138, 145",
      "button-text-color": "255, 255, 255",
      "components-background-color": "59, 60, 69",
    },
  },
  {
    name: "sidebarDefault",
    config: {
      "primary-color": "24, 144, 255",
      "warning-color": "255, 186, 0",
      "danger-color": "255, 73, 73",
      "success-color": "70, 201, 58",
      "info-color": "144, 147, 153",

      "layout-color": "48, 65, 86",
      "layout-shadow": "0px 4px 25px 0px rgb(0 0 0 / 8%)",

      "text-color": "225, 225, 227",
      "border-color": "86, 87, 100",
      "background-color": "48, 65, 86",

      "hover-text-color": "138, 140, 141",
      "hover-background-color": "0, 21, 40",

      "icon-color": "138, 138, 145",
      "button-text-color": "255, 255, 255",
      "components-background-color": "48, 65, 86",
    },
  },
];

/**
 * @description 设置主题
 * @param {String} themeName 主题名称
 * @param {Object} themeConfig 主题配置
 */
export function setTheme(themeName = "light", themeConfig = {}) {
  let el = document.documentElement;
  let theme = cloneDeep(themes.find((item) => item.name == themeName));
  if (theme) {
    document.body.classList.add("xn-theme-transition");
    document.body.setAttribute("xn-theme", themeName);
    Object.keys(theme.config).forEach((key) => {
      if (themeConfig[key]) {
        el.style.setProperty(`--xn-${key}`, themeConfig[key]);
      } else {
        el.style.setProperty(`--xn-${key}`, theme.config[key]);
      }
    });
    setTimeout(() => {
      document.body.classList.remove("xn-theme-transition");
    }, 300);
  }
}

/**
 * @description 清除当前主题配置
 */
export function removeCurrentThemeConfig() {
  let el = document.documentElement;
  let theme = themes.find((item) => item.name == "default");
  if (theme) {
    document.body.classList.add("xn-theme-transition");
    Object.keys(theme.config).forEach((key) => {
      el.style.removeProperty(`--xn-${key}`);
    });
    setTimeout(() => {
      document.body.classList.remove("xn-theme-transition");
    }, 300);
  }
}

/**
 * @description 设置侧边栏主题
 * @param {String} name 主题名称
 * @param {Object} config 主题配置
 */
export function setSidebarTheme(name = "light", themeConfig = {}) {
  let el = document.querySelector(".layout-sidebar");
  let theme = cloneDeep(themes.find((item) => item.name == name));
  if (theme) {
    document.body.classList.add("xn-theme-transition");
    el.setAttribute("xn-sidebar-theme", name);
    Object.keys(theme.config).forEach((key) => {
      if (themeConfig[key]) {
        el.style.setProperty(`--xn-${key}`, themeConfig[key]);
      } else {
        el.style.setProperty(`--xn-${key}`, theme.config[key]);
      }
    });
    setTimeout(() => {
      document.body.classList.remove("xn-theme-transition");
    }, 300);
  }
}

/**
 * @description 设置侧边栏主题颜色
 * @param {Object} config 主题配置
 */
export function setSidebarThemeColor(config) {
  let el = document.querySelector(".layout-sidebar");
  document.body.classList.add("xn-theme-transition");
  Object.keys(config).forEach((key) => {
    el.style.setProperty(`--xn-${key}`, config[key]);
  });
  setTimeout(() => {
    document.body.classList.remove("xn-theme-transition");
  }, 300);
}

/**
 * @description 清除侧边栏主题
 */
export function removeSidebarTheme() {
  let el = document.querySelector(".layout-sidebar");
  let defaultTheme = themes.find((item) => item.name == "default");
  document.body.classList.add("xn-theme-transition");
  Object.keys(defaultTheme.config).forEach((key) => {
    el.style.removeProperty(`--xn-${key}`);
  });
  el.removeAttribute("xn-sidebar-theme");
  setTimeout(() => {
    document.body.classList.remove("xn-theme-transition");
  }, 300);
}

/**
 * @description 设置主题颜色
 * @param {Object} config 主题配置
 */
export function setThemeColor(config) {
  let el = document.documentElement;
  document.body.classList.add("xn-theme-transition");
  Object.keys(config).forEach((key) => {
    el.style.setProperty(`--xn-${key}`, config[key]);
  });
  setTimeout(() => {
    document.body.classList.remove("xn-theme-transition");
  }, 300);
}

/**
 * @description 删除主题颜色
 * @param {Object} name 颜色名称
 */
export function removeThemeColor(name) {
  let el = document.documentElement;
  document.body.classList.add("xn-theme-transition");
  el.style.removeProperty(`--xn-${name}`);
  setTimeout(() => {
    document.body.classList.remove("xn-theme-transition");
  }, 300);
}

/**
 * @description 获取主题配置
 * @return {String} themeName 主题名称 默认值 default
 */
export function getThemeConfig(themeName = "default") {
  let theme = themes.find((item) => item.name === themeName);
  if (theme) return theme.config;
  else return {};
}

/**
 * @description 获取当前主题配置
 * @param {String} configName 配置名称 (不传则获取全部)
 * @return {Object} config 主题配置
 */
export function getCurrentThemeConfig(configName) {
  let defaultTheme = cloneDeep(themes.find((theme) => theme.name === "default"));
  Object.keys(defaultTheme.config).forEach((key) => {
    defaultTheme.config[key] = getComputedStyle(document.documentElement).getPropertyValue(`--xn-${key}`).trim();
  });
  if (configName && defaultTheme.config[configName]) {
    let config = {};
    config[configName] = defaultTheme.config[configName];
    return config;
  } else {
    return defaultTheme.config;
  }
}

export default {
  setTheme,
  removeCurrentThemeConfig,
  setSidebarTheme,
  setThemeColor,
  removeThemeColor,
  getThemeConfig,
  getCurrentThemeConfig,
};
