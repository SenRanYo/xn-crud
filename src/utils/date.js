/**
 * @description 格式化时间
 * @param {String} date 需格式化的时间
 * @param {String} format 时间格式
 * @return {String} 格式化后的时间
 * @example formatTime(date,"YYYY-MM-DD")
 */
export function formatTime(date, format = "YYYY-MM-DD") {
  date = new Date(date.toString().replace(/-/g, "/"));
  let year = new Date(date.getFullYear(), 0, 1);
  let ret;
  let opt = {
    "Y+": date.getFullYear().toString(), // 年
    "M+": (date.getMonth() + 1).toString(), // 月
    "D+": date.getDate().toString(), // 日
    "W+": Math.ceil(((date - year) / 86400000 + year.getDay()) / 7).toString(), // 第几周
    "E+": date.getDay() == 0 ? "7" : date.getDay().toString(), // 周几
    "e+": "日一二三四五六".charAt(date.getDay()), // 周几中文
    "h+": date.getHours().toString(), // 时
    "m+": date.getMinutes().toString(), // 分
    "s+": date.getSeconds().toString(), // 秒
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(format);
    if (ret) format = format.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0"));
  }
  return format;
}

/**
 * @description 查询指定时间的前后指定时间
 * @param {String} date 查询的指定时间
 * @param {Number} day day 前几天或者后几天
 * @param {String} format 时间格式
 * @return {String} 查询到的时间
 * @example aroundTime(date,5,"YYYY-MM-DD")
 */
export function aroundTime(date = new Date(), day = 0, format = "YYYY-MM-DD") {
  date = new Date(date);
  date.setDate(date.getDate() + day);
  return formatTime(date, format);
}

/**
 * @description 查询指定时间的周几的时间
 * @param {String} date 查询的指定时间
 * @param {Number} week 周几 1-7
 * @param {String} format 时间格式
 * @return {String} 查询到的时间
 * @example weekDate(date,5,"YYYY-MM-DD")
 */
export function weekDate(date = new Date(), week = 1, format = "YYYY-MM-DD") {
  date = new Date(date.toString().replace(/-/g, "/"));
  date.setDate(date.getDate() - (date.getDay() == 0 ? 7 : date.getDay()) + week);
  return formatTime(date, format);
}

/**
 * @description 查询时间过去多久了
 * @param {String} date 查询的指定时间
 * @param {String} format 时间格式
 * @return {String} 查询到的时间
 * @example pastTime(date,"YYYY-MM-DD")
 */
export function pastTime(date = new Date(), format = "YYYY-MM-DD") {
  let timer = new Date().getTime() - new Date(date.replace(/-/g, "/")).getTime();
  timer = parseInt(timer / 1000);
  let tips = "";
  switch (true) {
    case timer < 300:
      tips = "刚刚";
      break;
    case timer >= 300 && timer < 3600:
      tips = parseInt(timer / 60) + "分钟前";
      break;
    case timer >= 3600 && timer < 86400:
      tips = parseInt(timer / 3600) + "小时前";
      break;
    case timer >= 86400 && timer < 2592000:
      tips = parseInt(timer / 86400) + "天前";
      break;
    case timer >= 2592000 && timer < 365 * 86400:
      tips = parseInt(timer / (86400 * 30)) + "个月前";
      break;
    default:
      tips = formatTime(date.replace(/-/g, "/"), format);
  }
  return tips;
}

/**
 * @description 对比时间
 * @param {String|Date} startTime 开始时间
 * @param {String|Date} endTime 结束时间
 * @return {Object} 对比结果
 * @example contrastTime(startTime,endTime)
 */
export function contrastTime(startTime, endTime) {
  startTime = new Date(startTime.replace(/-/g, "/"));
  endTime = new Date(endTime.replace(/-/g, "/"));
  let retValue = {};
  let compareTime = endTime.getTime() - startTime.getTime(); // 时间差的毫秒数
  // 计算出相差天数
  let days = Math.floor(compareTime / (24 * 3600 * 1000));
  retValue.Days = days;
  // 计算出相差年数
  let years = Math.floor(days / 365);
  retValue.Years = years;
  // 计算出相差月数
  let months = Math.floor(days / 30);
  retValue.Months = months;
  // 计算出小时数
  let leaveHours = compareTime % (24 * 3600 * 1000); // 计算天数后剩余的毫秒数
  let hours = Math.floor(leaveHours / (3600 * 1000));
  retValue.Hours = hours;
  // 计算相差分钟数
  let leaveMinutes = leaveHours % (3600 * 1000); // 计算小时数后剩余的毫秒数
  let minutes = Math.floor(leaveMinutes / (60 * 1000));
  retValue.Minutes = minutes;
  // 计算相差秒数
  let leaveSeconds = leaveMinutes % (60 * 1000); // 计算分钟数后剩余的毫秒数
  let seconds = Math.round(leaveSeconds / 1000);
  retValue.Seconds = seconds;
  let resultSeconds = 0;
  if (years >= 1) {
    resultSeconds = resultSeconds + years * 365 * 24 * 60 * 60;
  }
  if (months >= 1) {
    resultSeconds = resultSeconds + months * 30 * 24 * 60 * 60;
  }
  if (days >= 1) {
    resultSeconds = resultSeconds + days * 24 * 60 * 60;
  }
  if (hours >= 1) {
    resultSeconds = resultSeconds + hours * 60 * 60;
  }
  if (minutes >= 1) {
    resultSeconds = resultSeconds + minutes * 60;
  }
  if (seconds >= 1) {
    resultSeconds = resultSeconds + seconds;
  }
  retValue.resultSeconds = resultSeconds;
  return retValue;
}
