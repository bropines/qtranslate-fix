function serviceHeader() {
  return new ServiceHeader(
    11,
    "Yandex",
    "Translate Russian, Spanish, German, French and a number of other languages to and from English. You can translate individual words, as well as whole texts and webpages." +
      Const.NL2 +
      "https://translate.yandex.com/" +
      Const.NL2 +
      "\u00a9 2011-2022 \u00abYandex\u00bb",
    Capability.TRANSLATE | Capability.DETECT_LANGUAGE | Capability.LISTEN
  );
}
function serviceHost(a, b, c) {
  return a === Capability.LISTEN
    ? "https://tts.voicetech.yandex.net"
    : "https://translate.yandex.net";
}
function serviceLink(a, b, c) {
  var e = "https://translate.yandex.com";
  a &&
    ((b = isLanguage(b) ? codeFromLanguage(b) : ""),
    (c = isLanguage(c) ? codeFromLanguage(c) : ""),
    (e += format("/?lang={0}-{1}&text={2}", b, c, encodeGetParam(a))));
  return e;
}
function YandexModel(a) {
  a = prepareSource(a);
  a = limitSource(a, 1e4);
  this._makeChunks(a);
}
YandexModel.prototype.hasChunks = function () {
  return !!this._chunks.length;
};
YandexModel.prototype.getNextChunk = function () {
  return this._chunks.shift() || "";
};
YandexModel.prototype._makeChunks = function (a) {
  var b;
  for (this._chunks = []; a; ) {
    b = this._truncateText(a);
    if (!b) break;
    this._chunks.push(b);
    a = a.slice(b.length);
  }
};
YandexModel.prototype._truncateText = function (a) {
  var b = [
    /(\n+)/,
    /([.!?;\u0964](?:\s+|$))/,
    /([\-\u2012-\u2015](?:\s+|$))/,
    /([,:](?:\s+|$))/,
    /([\u3002\uff01\uff1f\uff1b\u2026])/,
    /([\uff0c\uff1a])/,
    /(\s+)/,
  ];
  if (!a || 600 >= a.length) return a;
  a = a.slice(0, 600);
  for (var c = 0; c < b.length; c++) {
    var e = b[c];
    if (e.test(a)) return stringSplit(a, e).slice(0, -1).join("");
  }
  return a;
};
SupportedLanguages = [
  -1,
  -1,
  "af",
  "az",
  "sq",
  "ar",
  "hy",
  "eu",
  "be",
  "bg",
  "ca",
  "zh",
  "zh",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "et",
  "fi",
  -1,
  "fr",
  "gl",
  "de",
  "el",
  "ht",
  "he",
  "hi",
  "hu",
  "is",
  "id",
  "it",
  "ga",
  "ja",
  "ka",
  "ko",
  "lv",
  "lt",
  "mk",
  "ms",
  "mt",
  "no",
  "fa",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sk",
  "sl",
  "es",
  "sw",
  "sv",
  "th",
  "tr",
  "uk",
  "ur",
  "vi",
  "cy",
  "yi",
  "eo",
  -1,
  "la",
  "lo",
  "kk",
  "uz",
  "si",
  "tg",
  "te",
  "km",
  "mn",
  "kn",
  "ta",
  "mr",
  "bn",
  "tt",
];
function serviceDetectLanguageRequest(a) {
  a = encodeGetParam(a.slice(0, 256));
  a = format(
    "/api/v1/tr.json/detect?srv=browser_video_translation&text={1}",
    Options.YandexAppId,
    a
  );
  var b = getHeader() + Const.NL + "Referer: " + serviceLink();
  return new RequestData(HttpMethod.GET, a, null, b);
}
function serviceDetectLanguageResponse(a) {
  return (a = parseJSON(a)) && a.code && 200 == a.code
    ? languageFromCode(a.lang)
    : UNKNOWN_LANGUAGE;
}
var yandexModel;
function serviceTranslateRequest(a, b, c) {
  yandexModel || (yandexModel = new YandexModel(a));
  a = format(
    "/api/v1/tr.json/translate?srv=browser_video_translation&lang={1}-{2}",
    Options.YandexAppId,
    codeFromLanguage(b),
    codeFromLanguage(c)
  );
  b = "text=" + encodePostParam(yandexModel.getNextChunk());
  c = postHeader() + Const.NL + "Referer: " + serviceLink();
  return new RequestData(
    HttpMethod.POST,
    a,
    b,
    c,
    null,
    "serviceTranslateResponse"
  );
}
function _useDictionary(a) {
  return (
    a && 100 >= a.length && !/[\n\r]/.test(a) && 3 >= a.split(/\s+/).length
  );
}
function serviceTranslateResponse(a, b, c, e) {
  (b = parseJSON(b)) && b.code && 200 == b.code && (b = b.text.join("\n"));
  var d = null;
  _useDictionary(a)
    ? (d = "dictionaryRequest")
    : yandexModel.hasChunks() && (d = "serviceTranslateRequest");
  return new ResponseData(b, c, e, null, d);
}
function dictionaryRequest(a, b, c) {
  a = format(
    "/dicservice.json/lookup?srv=browser_video_translation&text={1}&lang={2}-{3}",
    Options.YandexAppId,
    encodeGetParam(prepareSource(a)),
    codeFromLanguage(b),
    codeFromLanguage(c)
  );
  return new RequestData(
    HttpMethod.GET,
    a,
    null,
    null,
    null,
    "dictionaryResponse"
  );
}
function dictionaryResponse(a, b, c, e) {
  a = parseJSON(b);
  b = "";
  var d, k;
  if ("object" == typeof a && a.def)
    for (var l = 0; l < a.def.length; l++) {
      var g = a.def[l];
      if (g.tr) {
        b +=
          Const.NL +
          g.text +
          (g.ts ? " [" + g.ts + "]" : "") +
          " " +
          g.tr[0].pos +
          Const.NL;
        k = g.tr.length;
        for (var h = 0; h < k; h++) {
          var f = g.tr[h];
          b += (1 < k ? h + 1 + ". " : "    ") + f.text;
          if (f.syn)
            for (d = 0; d < f.syn.length; d++) b += ", " + f.syn[d].text;
          b += Const.NL;
          f.mean &&
            (b +=
              "    (" +
              f.mean
                .map(function (a) {
                  return a.text;
                })
                .join(", ") +
              ")" +
              Const.NL);
          if (f.ex)
            for (d = 0; d < f.ex.length; d++) {
              var m = f.ex[d];
              b +=
                "        " +
                m.text +
                " - " +
                m.tr
                  .map(function (a) {
                    return a.text;
                  })
                  .join(", ") +
                Const.NL;
            }
        }
      }
    }
  b && (b = Const.NL + b);
  return new ResponseData(b, c, e);
}
function serviceListenRequest(a, b, c) {
  b = codeFromLanguage(b);
  switch (b) {
    case "en":
      b = "en_GB";
      break;
    case "sv":
      b = "sv_SE";
      break;
    case "da":
      b = "da_DK";
      break;
    case "cs":
      b = "cs_CZ";
      break;
    case "ca":
      b = "ca_ES";
      break;
    case "ar":
      b = "ar_AE";
      break;
    default:
      b = b + "_" + b.toUpperCase();
  }
  a = format(
    "/tts?format=mp3&quality=hi&platform=web&application=translate&lang={0}&text={1}",
    b,
    encodeGetParam(a)
  );
  c && (a += "&speed=0.7");
  return new RequestData(HttpMethod.GET, a);
}
