// Global moment.js mock
const moment = function(input) {
  let date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    date = new Date(input);
  } else if (typeof input === "number") {
    date = new Date(input);
  } else {
    date = new Date();
  }

  return {
    format: function(format) {
      if (format === "YYYY-MM-DD") {
        return date.toISOString().split("T")[0];
      } else if (format === "D") {
        return date.getDate().toString();
      }
      return date.toISOString().split("T")[0];
    },
    diff: function() {
      return 0;
    },
    startOf: function(unit) {
      return this;
    },
    endOf: function(unit) {
      return this;
    },
    isSame: function(other, unit) {
      return true;
    },
    isSameOrBefore: function(other, unit) {
      return true;
    },
    isSameOrAfter: function(other, unit) {
      return true;
    },
    isBefore: function(other, unit) {
      return false;
    },
    isAfter: function(other, unit) {
      return false;
    },
    isBetween: function(start, end, unit, inclusivity) {
      return true;
    },
    clone: function() {
      return moment(date);
    },
    isValid: function() {
      return !isNaN(date.getTime());
    },
    add: function(amount, unit) {
      return this;
    },
    subtract: function(amount, unit) {
      return this;
    },
    valueOf: function() {
      return date.getTime();
    },
    toDate: function() {
      return date;
    },
    weekday: function(day) {
      if (day !== undefined) {
        return this;
      }
      return 0;
    },
    day: function() {
      return date.getDay();
    },
    date: function() {
      return date.getDate();
    },
    _date: date,
  };
};

// Static methods
moment.utc = function() {
  return {
    format: function() {
      return "00:00:00";
    },
  };
};

moment.duration = function() {
  return {
    asMilliseconds: function() {
      return 0;
    },
  };
};

moment.locale = function(locale) {
  if (locale) {
    moment._currentLocale = locale;
    return locale;
  }
  return moment._currentLocale || "en";
};

moment._currentLocale = "en";

moment.weekdaysShort = function(localeData) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
};

moment.weekdaysMin = function(localeData) {
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
};

moment.months = function() {
  return ["January", "February", "March", "April", "May", "June", 
          "July", "August", "September", "October", "November", "December"];
};

moment.monthsShort = function() {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
};

moment.ISO_8601 = "ISO_8601";

module.exports = moment;
