'use strict';

/* exported L10nManipulator */

/*
  Extracts or append complete Locales ASTs
  for given l10n keys
*/
var L10nManipulator = (function() {

  var mozL10n = navigator.mozL10n;
  var initialized = false;
  if (mozL10n) {
    initialized = mozL10n.readyState === 'complete';
  }

  window.addEventListener('localized', function onLocalized() {
    window.removeEventListener('localized', onLocalized);
    if (!mozL10n) {
      mozL10n = navigator.mozL10n;
    }

    initialized = true;
  });

  // Returns an object which keys are the
  // locale and value an array with the AST
  // for that locale
  function getAST(keys) {
    if (!initialized || !Array.isArray(keys)) {
      return null;
    }

    var result = {};

    var locales = mozL10n.ctx.locales;
    Object.keys(locales).forEach(function (locale) {
      var currentLocale = locales[locale];
      result[locale] = {};
      keys.forEach(function (key) {
        if (currentLocale.entries &&
         currentLocale.entries[key] !== undefined) {
          result[locale][key] = currentLocale.entries[key];
        }
      });
    });

    return result;
  }

  // Given the output of the previous function
  // adds the content to current locale.
  function addAST(astByLocale) {
    if (!initialized || !astByLocale) {
      return;
    }

    Object.keys(astByLocale).forEach(function (code) {
      var locale = mozL10n.ctx.getLocale(code);
      locale.addAST(astByLocale[code]);
    });
  }

  return {
    getAST: getAST,
    addAST: addAST
  };
})();
