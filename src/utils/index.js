import _ from "lodash-es";
import store from "@/xiaoni/crud/store";

/**
 * @description 判断设备设否是PC
 * @return 是否
 */
export function isPc() {
  const userAgentInfo = navigator.userAgent;
  const Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
  let flag = true;
  for (let v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = false;
      break;
    }
  }
  return flag;
}

/**
 * @description 获取浏览器相关信息
 * @return 浏览器信息
 */
export function queryDeviceInfo() {
  const { clientHeight, clientWidth } = document.documentElement;

  // 浏览器信息
  const ua = navigator.userAgent.toLowerCase();

  // 浏览器类型
  let type = (ua.match(/firefox|chrome|safari|opera/g) || "other")[0];

  if ((ua.match(/msie|trident/g) || [])[0]) {
    type = "msie";
  }

  // 平台标签
  let tag = "";

  const isTocuh = "ontouchstart" in window || ua.indexOf("touch") !== -1 || ua.indexOf("mobile") !== -1;
  if (isTocuh) {
    if (ua.indexOf("ipad") !== -1) {
      tag = "pad";
    } else if (ua.indexOf("mobile") !== -1) {
      tag = "mobile";
    } else if (ua.indexOf("android") !== -1) {
      tag = "androidPad";
    } else {
      tag = "pc";
    }
  } else {
    tag = "pc";
  }

  // 浏览器内核
  let prefix = "";

  switch (type) {
    case "chrome":
    case "safari":
    case "mobile":
      prefix = "webkit";
      break;
    case "msie":
      prefix = "ms";
      break;
    case "firefox":
      prefix = "Moz";
      break;
    case "opera":
      prefix = "O";
      break;
    default:
      prefix = "webkit";
      break;
  }

  // 操作平台
  const plat = ua.indexOf("android") > 0 ? "android" : navigator.platform.toLowerCase();

  // 屏幕信息
  let screen = "full";

  if (clientWidth < 768) {
    screen = "xs";
  } else if (clientWidth < 992) {
    screen = "sm";
  } else if (clientWidth < 1200) {
    screen = "md";
  } else if (clientWidth < 1920) {
    screen = "xl";
  } else {
    screen = "full";
  }

  // 是否 ios
  // eslint-disable-next-line
  const isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

  // 浏览器版本
  // eslint-disable-next-line
  const version = (ua.match(/[\s\S]+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1];

  // 是否 PC 端
  const isPC = tag === "pc";

  // 是否移动端
  const isMobile = isPC ? false : true;

  // 是否移动端 + 屏幕宽过小
  const isMini = screen === "xs" || isMobile;

  return {
    height: clientHeight,
    width: clientWidth,
    version,
    type,
    plat,
    tag,
    prefix,
    isMobile,
    isIOS,
    isPC,
    isMini,
    screen,
  };
}

/**
 * @description 检测一个元素包含在另一个元素之内
 * @param {dom} parent 指定可能包含其他元素的祖辈容器元素
 * @param {dom} node 指定可能被其他元素包含的后代元素
 * @return 是否
 */
export function contains(parent, node) {
  if (document.documentElement.contains) {
    return parent !== node && parent.contains(node);
  } else {
    while (node && (node = node.parentNode)) if (node === parent) return true;
    return false;
  }
}

/**
 * @description 获取父元素
 */
export function getParent(name) {
  let parent = this.$parent;

  while (parent) {
    if (parent.$options.componentName !== name) {
      parent = parent.$parent;
    } else {
      return parent;
    }
  }

  return null;
}

export function getInstance(component) {
  const ComponentConstructor = store.__vue.extend(component);
  return new ComponentConstructor({
    el: document.createElement("div"),
  });
}

export function revisePath(path) {
  if (!path) {
    return "";
  }

  if (path[0] == "/") {
    return path;
  } else {
    return `/${path}`;
  }
}

export function last(data) {
  if (_.isArray(data) || _.isString(data)) {
    return data[data.length - 1];
  }
}

export function dataset(obj, key, value, isMerge) {
  const isGet = value === undefined;
  let d = obj;

  let arr = _.flattenDeep(
    key.split(".").map((e) => {
      if (e.includes("[")) {
        return e.split("[").map((e) => e.replace(/"/g, ""));
      } else {
        return e;
      }
    })
  );

  try {
    for (let i = 0; i < arr.length; i++) {
      let e = arr[i];
      let n = null;

      if (e.includes("]")) {
        let [k, v] = e.replace("]", "").split(":");

        if (v) {
          n = d.findIndex((x) => x[k] == v);
        } else {
          n = Number(n);
        }
      } else {
        n = e;
      }

      if (i != arr.length - 1) {
        d = d[n];
      } else {
        if (isGet) {
          return d[n];
        } else {
          if (isMerge) {
            Object.assign(d[n], value);
          } else {
            store.__inst.$set(d, n, value);
          }
        }
      }
    }

    return obj;
  } catch (e) {
    console.error("格式错误", `${key}`);
    return {};
  }
}

/**
 * @description 排序
 * @return 序列化的数组
 */
export function orderBy(list, key) {
  return list.sort((a, b) => a[key] - b[key]);
}

/**
 * @description 序列化树结构
 * @return 序列化的数组
 */
export function deepTree(list) {
  let newList = [];
  let map = {};

  list.forEach((e) => (map[e.id] = e));

  list.forEach((e) => {
    let parent = map[e.parentId];

    if (parent) {
      (parent.children || (parent.children = [])).push(e);
    } else {
      newList.push(e);
    }
  });

  const fn = (list) => {
    list.map((e) => {
      if (e.children instanceof Array) {
        e.children = orderBy(e.children, "seq");

        fn(e.children);
      }
    });
  };

  fn(newList);

  return orderBy(newList, "seq");
}

/**
 * @description 反序列化树结构
 * @return 序列化的数组
 */
export function revDeepTree(list = []) {
  let d = [];
  let id = 0;

  const deep = (list, parentId) => {
    list.forEach((e) => {
      if (!e.id) {
        e.id = id++;
      }

      e.parentId = parentId;

      d.push(e);

      if (e.children && _.isArray(e.children)) {
        deep(e.children, e.id);
      }
    });
  };

  deep(list || [], null);

  return d;
}

/**
 * @description 获取url中的全部参数
 * @return 参数对象
 */
export function getUrlParams() {
  let strs = null;
  let url = decodeURIComponent(window.location.href); //获取url中"?"符后的字串
  let params = new Object();
  if (url.indexOf("?") != -1) {
    url = url.substr(url.indexOf("?"));
    let str = url.substr(1);
    strs = str.split("&");
    for (let i = 0; i < strs.length; i++) {
      let index = strs[i].indexOf("=");
      let value = strs[i].slice(index + 1, strs[i].length);
      if (value.indexOf("#") > -1) {
        params[strs[i].slice(0, index)] = value.substring(0, value.indexOf("#"));
      } else {
        params[strs[i].slice(0, index)] = value;
      }
    }
  }
  return params;
}

/**
 * @description 获取url中的指定参数
 * @return 参数值
 */
export function getUrlParam(name) {
  let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  let r = window.location.search.substr(1).match(reg);
  if (r != null) return decodeURIComponent(r[2]);
  return null;
}

/**
 * @description 转换对象为url字符串
 * @return url参数字符串
 */
export function encodeParams(params, isPrefix = true) {
  let prefix = isPrefix ? "?" : "";
  let _result = [];
  for (let key in params) {
    let value = params[key];
    // 去掉为空的参数
    if (["", undefined, null].includes(value)) {
      continue;
    }
    if (value.constructor === Array) {
      value.forEach((_value) => {
        _result.push(encodeURIComponent(key) + "[]=" + encodeURIComponent(_value));
      });
    } else {
      _result.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return _result.length ? prefix + _result.join("&") : "";
}

/**
 * @description 对象深度克隆
 * @param {Object} object 克隆对象
 * @return {Object} 深度克隆对象
 */
export function cloneDeep(object) {
  return _.cloneDeep(object);
}

/**
 * @description 对象深度合并
 * @param {Object} target 目标对象
 * @param {Object} source 源对象
 * @return {Object} 合并后的对象
 */
export function deepMerge(a, b) {
  let k;
  for (k in b) {
    a[k] = a[k] && a[k].toString() === "[object Object]" ? deepMerge(a[k], b[k]) : (a[k] = b[k]);
  }
  return a;
}

/**
 * @description 函数防抖 短时间内多次触发同一事件，只执行最后一次，或者只执行最开始的一次，中间的不执行
 * @param {Function} func 要防抖动的函数
 * @param {Number} wait 需要延迟的毫秒数
 * @param {Object} options [options.leading=false]: 指定在延迟开始前调用
 * @param {Object} options [options.maxWait]: 设置 func 允许被延迟的最大值
 * @param {Object} options [options.trailing=true]: 指定在延迟结束后调用
 */
export function debounce(func, wait = 300, options = {}) {
  return _.debounce(func, wait, options);
}

/**
 * @description 函数节流 连续触发事件但是在 n 秒中只执行一次函数。即 2n 秒内执行 2 次
 * @param {Function} func 要节流的函数
 * @param {Number} wait 需要节流的毫秒
 * @param {Object} options [options.leading=true]: 指定调用在节流开始前
 * @param {Object} options [options.trailing=true]: 指定调用在节流结束后
 */
export function throttle(func, wait = 300, options = {}) {
  return _.throttle(func, wait, options);
}

/**
 * @description 全屏
 */
export function fullScreen() {
  let el = document.documentElement;
  let rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;

  if (rfs) {
    rfs.call(el);
  } else if (typeof window.ActiveXObject !== "undefined") {
    //for IE，这里其实就是模拟了按下键盘的F11，使浏览器全屏
    // eslint-disable-next-line
    let wscript = new ActiveXObject("WScript.Shell");
    if (wscript != null) {
      wscript.SendKeys("{F11}");
    }
  }
}

/**
 * @description 退出全屏
 */
export function exitScreen() {
  let el = document;
  let cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen;

  if (cfs) {
    cfs.call(el);
  } else if (typeof window.ActiveXObject !== "undefined") {
    //for IE，这里和fullScreen相同，模拟按下F11键退出全屏
    // eslint-disable-next-line
    let wscript = new ActiveXObject("WScript.Shell");
    if (wscript != null) {
      wscript.SendKeys("{F11}");
    }
  }
}

/**
 * @description 创建css link
 */
export function createCssLink(url, id) {
  const link = document.createElement("link");
  link.href = url;
  link.type = "text/css";
  link.rel = "stylesheet";
  if (id) {
    link.id = id;
  }
  document.getElementsByTagName("head").item(0).appendChild(link);
}

/**
 * @description 创建 link
 */
export function createLink(params = {}) {
  const link = document.createElement("link");
  for (const key in params) {
    link.setAttribute(key, params[key]);
  }
  document.getElementsByTagName("head").item(0).appendChild(link);
}

/**
 * @description 创建 script
 */
export function createScriptLink(url) {
  const script = document.createElement("script");
  script.src = url;
  script.type = "text/javascript";
  document.getElementsByTagName("head").item(0).appendChild(script);
}

/**
 * @description 设置favicon
 */

export function setFaviconIcon(faviconurl) {
  var link = document.querySelector("link[rel*='icon']") || document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "icon";
  link.href = faviconurl;
  document.getElementsByTagName("head")[0].appendChild(link);
}
