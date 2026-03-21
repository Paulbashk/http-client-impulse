// проверка на url
function isUrl(url) {
    if (typeof url === 'string') {
        return true;
    }
    if (typeof url === 'object' && url !== null) {
        return url instanceof URL;
    }
    return false;
}
// gpt: проверка BodyData , на чистый объект
function isPlainObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        !(value instanceof FormData) &&
        !(value instanceof Blob) &&
        !(value instanceof ArrayBuffer) &&
        !(value instanceof URLSearchParams));
}
// объединение с baseURL
function buildUrl(url, baseURL) {
    if (!baseURL)
        return new URL(url);
    const urlString = url.toString();
    const mormalized = urlString.startsWith('/') ? urlString.slice(1) : urlString;
    return new URL(mormalized, baseURL);
}
// Обработка search params опции адаптера
function handleUrlParams(params) {
    return new URLSearchParams(params);
}
// обработка(адаптация) кастомных опций для fetch() опций
function handleRequestOptionsForFetch(options) {
    const { url, params, ...otherParams } = options;
    const newUrl = new URL(url.toString()); // ревью-gpt: лучше сделать новый, дабы было безопаснее, чем мутировать неизвестно-приходящий
    if (params && typeof params === 'object' && params !== null) {
        newUrl.search = handleUrlParams(params).toString();
    }
    return { ...otherParams, url: newUrl };
}
// обработка опций при работе с method [get | delete]: [url], [{url}], [url, options]
function getOptionsWithoutDataForHttp(options, config, method) {
    const argsLength = options.length;
    // [url] | [{url}]
    if (argsLength === 1) {
        const urlOrOptions = options[0];
        // [url]
        if (isUrl(urlOrOptions)) {
            const url = urlOrOptions;
            return {
                method,
                url: buildUrl(url, config.baseURL)
            };
        }
        // [{url}]
        const { url, ...optionsWithoutUrl } = urlOrOptions;
        if (!isUrl(url)) {
            throw new Error('Invalid url');
        }
        return {
            ...optionsWithoutUrl,
            method,
            url: buildUrl(url, config.baseURL)
        };
    }
    // [url, options]
    const [url, _options] = options;
    if (!isUrl(url)) {
        throw new Error('Invalid url');
    }
    return {
        ..._options,
        method,
        url: buildUrl(url, config.baseURL)
    };
}
// обработка опций при работе с method [post | put]: [url, data, options]
function getOptionsWithDataForHttp(optionsArg, config, method) {
    const [url, data, options] = optionsArg;
    if (!isUrl(url)) {
        throw new Error('Invalid url');
    }
    const urlWithBase = buildUrl(url, config.baseURL);
    let body = data;
    let jsonHeaders;
    if (isPlainObject(data)) {
        body = JSON.stringify(data);
        jsonHeaders = {
            'Content-Type': 'application/json'
        };
    }
    const baseOptions = {
        method,
        url: urlWithBase,
        body,
    };
    if (options) {
        const { headers: headersOption, ...otherOptions } = options;
        const finalHeaders = new Headers(headersOption ?? {}); // gpt: нормализация headers
        if (jsonHeaders) {
            for (const [key, value] of Object.entries(jsonHeaders)) {
                // не перезаписываем, если уже есть 
                if (!finalHeaders.has(key)) {
                    finalHeaders.set(key, value);
                }
            }
        }
        return {
            ...otherOptions,
            ...baseOptions,
            headers: finalHeaders
        };
    }
    return {
        ...baseOptions,
        ...jsonHeaders
    };
}
// http адаптер: отправка http запросов
async function httpRequest(options) {
    const { url, ...optionsWithoutUrl } = handleRequestOptionsForFetch(options);
    const response = await fetch(url, optionsWithoutUrl);
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
    }
    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url
    };
}
function create(config) {
    const baseURL = config?.baseURL;
    return {
        async get(...options) {
            const optionsForRequest = getOptionsWithoutDataForHttp(options, {
                baseURL
            }, 'GET');
            return await httpRequest(optionsForRequest);
        },
        async post(...options) {
            const optionsForRequest = getOptionsWithDataForHttp(options, {
                baseURL
            }, 'POST');
            return await httpRequest(optionsForRequest);
        },
        async put(...options) {
            const optionsForRequest = getOptionsWithDataForHttp(options, {
                baseURL
            }, 'PUT');
            return await httpRequest(optionsForRequest);
        },
        async delete(...options) {
            const optionsForRequest = getOptionsWithoutDataForHttp(options, {
                baseURL
            }, 'DELETE');
            return await httpRequest(optionsForRequest);
        },
    };
}
export default create;
