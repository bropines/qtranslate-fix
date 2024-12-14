function serviceHeader() {
    return new ServiceHeader(
        31,
        "DeepL",
        "DeepL trains artificial intelligence to understand and translate texts." + Const.NL2 + "https://www.deepl.com",
        Capability.TRANSLATE | Capability.DETECT_LANGUAGE
    );
}

function serviceHost(a, b, e) {
    // URL вашего сервера или официальный сервер DeepL
    var hostUrl = "https://rfntws2k.bropinus.ru";

    // Раскомментируйте и установите URL вашего сервера, если он отличается
    // hostUrl = "https://rfntws2k.bropinesd.online";

    return hostUrl;
}

function getTranslatePath() {
    var host = serviceHost();
    return host.indexOf("vercel.app") !== -1 ? "/api/translate" : "/translate";
}

function serviceLink(a, b, e) {
    var c = getTranslatePath();
    if (a && isLanguage(b) && isLanguage(e)) {
        c += format("?source_lang={0}&target_lang={1}&text={2}",
            codeFromLanguage(b).toLowerCase(),
            codeFromLanguage(e).toLowerCase(),
            encodeGetParam(a)
        );
    }
    return c;
}

SupportedLanguages = [
    -1, "auto", -1, -1, -1, -1, -1, -1, -1, "BG", -1, "ZH", -1, -1, "CS", "DA", "NL", "EN", -1, "FI",
    -1, "FR", -1, "DE", "EL", -1, -1, -1, "HU", -1, -1, "IT", -1, "JA", -1, -1, "LV", "LT", -1, -1,
    -1, -1, -1, "PL", "PT", "RO", "RU", -1, "SK", "SL", "ES", -1, "SV", -1, -1, -1, -1, -1
];

function parseText(a) {
    var e = [];
    a = prepareSource(a);
    a = limitSource(a); // Применяем ограничения на длину текста

    e.push({ type: 1, text: a });

    return e;
}

function splitText(a) {
    return parseText(a)
        .filter(function (a) {
            return a.type === 1;
        })
        .map(function (a) {
            return a.text.replace(/\s+/g, " ").trim();
        });
}

function getSourceLanguage(a) {
    return a && a.source_lang ? languageFromCode(a.source_lang) : UNKNOWN_LANGUAGE;
}

function serviceDetectLanguageRequest(a, b, c) {
    var requestBody = {
        text: a,
        source_lang: "auto",
        target_lang: codeFromLanguage(c)
    };

    var path = getTranslatePath();

    return new RequestData(
        HttpMethod.POST,
        path,
        stringifyJSON(requestBody),
        postHeader(true)
    );
}

function serviceDetectLanguageResponse(a) {
    a = parseJSON(a);
    return getSourceLanguage(a);
}

function serviceTranslateRequest(a, b, c) {
    var text = a;
    b = codeFromLanguage(b);
    c = codeFromLanguage(c);

    var requestBody = {
        text: text,
        source_lang: b,
        target_lang: c
    };

    var path = getTranslatePath();

    return new RequestData(
        HttpMethod.POST,
        path,
        stringifyJSON(requestBody),
        postHeader(true)
    );
}

function serviceTranslateResponse(originalText, responseText, targetLanguage, context) {
    var response = parseJSON(responseText);
    var translatedText = "";

    if (response && (response.data || response.translations)) {
        translatedText = response.data || response.translations[0].text;
        if (!isLanguage(targetLanguage)) {
            targetLanguage = languageFromCode(response.target_lang);
        }
    } else {
        // Обработка ошибки
        return new ResponseData("", UNKNOWN_LANGUAGE, context, "Translation error.");
    }

    return new ResponseData(translatedText, targetLanguage, context, "");
}

function postHeader(isJson) {
    return {
        "Content-Type": "application/json"
    };
}
