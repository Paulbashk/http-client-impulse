import type { 
  ImpulseURL, 
  Params,
  RequestOptions,
  RequestConfig,
  HttpResponse,
  HttpGetOptions,
  HttpPostOptions,
  HttpPutOptions,
  HttpDeleteOptions,
} from "./index.types.d.ts"

// проверка на url 
function isUrl(url: unknown): url is ImpulseURL {
  if(typeof url === 'string') {
    return true
  }

  if(typeof url === 'object' && url !== null) {
    return url instanceof URL
  }

  return false
}

// gpt: проверка BodyData , на чистый объект
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof FormData) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !(value instanceof URLSearchParams)
  )
}

// объединение с baseURL
function buildUrl(url: ImpulseURL, baseURL?: ImpulseURL): URL {
  if(!baseURL) return new URL(url);

  const urlString = url.toString()
  const mormalized = urlString.startsWith('/') ? urlString.slice(1) : urlString

  return new URL(mormalized, baseURL)
}

// Обработка search params опции адаптера
function handleUrlParams(params: Params): URLSearchParams {
  return new URLSearchParams(params as Record<string, string>)
}

// обработка(адаптация) кастомных опций для fetch() опций
function handleRequestOptionsForFetch(options: RequestOptions): RequestOptions {
  const { url, params, ...otherParams } = options
  const newUrl = new URL(url.toString()) // ревью-gpt: лучше сделать новый, дабы было безопаснее, чем мутировать неизвестно-приходящий

  if(params && typeof params === 'object' && params !== null) {
    newUrl.search = handleUrlParams(params).toString()
  }

  return { ...otherParams, url: newUrl }
}

// обработка опций при работе с method [get | delete]: [url], [{url}], [url, options]
function getOptionsWithoutDataForHttp(
  options: HttpGetOptions, 
  config: RequestConfig,
  method: 'GET' | 'DELETE'
): RequestOptions {
  const argsLength = options.length

  // [url] | [{url}]
  if(argsLength === 1) {
    const urlOrOptions = options[0]

    // [url]
    if(isUrl(urlOrOptions)) {
      const url = urlOrOptions

      return { 
        method, 
        url: buildUrl(url, config.baseURL)
      }
    }

    // [{url}]
    const { url, ...optionsWithoutUrl } = urlOrOptions

    if(!isUrl(url)) {
      throw new Error('Invalid url')
    }

    return { 
      ...optionsWithoutUrl, 
      method,  
      url: buildUrl(url, config.baseURL)
    }
  }

  // [url, options]
  const [url, _options] = options

  if(!isUrl(url)) {
    throw new Error('Invalid url')
  }

  return { 
    ..._options,
    method,  
    url: buildUrl(url, config.baseURL)
  }
}

// обработка опций при работе с method [post | put]: [url, data, options]
function getOptionsWithDataForHttp(
  optionsArg: HttpPostOptions, 
  config: RequestConfig,
  method: 'POST' | 'PUT'
): RequestOptions {
  const [url, data, options] = optionsArg

  if(!isUrl(url)) {
    throw new Error('Invalid url')
  }

  const urlWithBase = buildUrl(url, config.baseURL) 

  let body: BodyInit | undefined = data as BodyInit;
  let jsonHeaders: Record<string, string> | undefined;

  if(isPlainObject(data)) {
    body = JSON.stringify(data)
    jsonHeaders = {
      'Content-Type': 'application/json'
    }
  }

  const baseOptions: RequestOptions = {
    method,
    url: urlWithBase,
    body,
  }

  if(options) {

    const { headers: headersOption, ...otherOptions } = options

    const finalHeaders = new Headers(headersOption ?? {}) // gpt: нормализация headers

    if (jsonHeaders) {
      for(const [key, value] of Object.entries(jsonHeaders)) {
        // не перезаписываем, если уже есть 
        if(!finalHeaders.has(key)) {
          finalHeaders.set(key, value)
        }  
      }
    }

    return {
      ...otherOptions, 
      ...baseOptions,
      headers: finalHeaders
    }
  }

  return {
    ...baseOptions,
    ...jsonHeaders
  }
}

// http адаптер: отправка http запросов
async function httpRequest<T>(options: RequestOptions): Promise<HttpResponse<T>> {
  const { url, ...optionsWithoutUrl } = handleRequestOptionsForFetch(options)

  const response = await fetch(url, optionsWithoutUrl)

  if(!response.ok) {
    const errorData = await response.text()

    throw new Error(`HTTP ${response.status}: ${errorData}`)
  }

  const data = await response.json()

  return { 
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    url: response.url
  }
}

function create(config?: RequestConfig) {
  const baseURL = config?.baseURL

  return {
    async get<T>(...options: HttpGetOptions) {
      const optionsForRequest = getOptionsWithoutDataForHttp(
        options,
        {
          baseURL
        },
        'GET'
      )

      return await httpRequest<T>(optionsForRequest)
    },
    async post<T>(...options: HttpPostOptions) {
      const optionsForRequest = getOptionsWithDataForHttp(
        options,
        {
          baseURL
        },
        'POST'
      )

      return await httpRequest<T>(optionsForRequest)
    },
    async put<T>(...options: HttpPutOptions) {
      const optionsForRequest = getOptionsWithDataForHttp(
        options,
        {
          baseURL
        },
        'PUT'
      )

      return await httpRequest<T>(optionsForRequest)
    },
    async delete<T>(...options: HttpDeleteOptions) {
      const optionsForRequest = getOptionsWithoutDataForHttp(
        options,
        {
          baseURL
        },
        'DELETE'
      )

      return await httpRequest<T>(optionsForRequest)
    },
  }
}

export default create
