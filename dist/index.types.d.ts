export type ImpulseURL = string | URL;
export interface Params {
    [key: string]: string | number;
}
interface DefaultOptions extends RequestInit {
}
export interface RequestConfig {
    baseURL?: string;
    defaultOptions?: DefaultOptions;
}
interface BodyObject {
}
export type RequestDataBody = BodyInit | BodyObject | null;
export interface HttpResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
    url: string;
}
export interface RequestOptions extends RequestInit {
    url: ImpulseURL;
    params?: Params;
}
export type RequestOptionsWithoutUrl = Omit<RequestOptions, "url">;
type RequestOptionsWithoutUrlAndMethod = Omit<RequestOptionsWithoutUrl, "method">;
type RequestOptionsWithoutMethod = Omit<RequestOptions, 'method'>;
type HttpOptions = [ImpulseURL | RequestOptionsWithoutMethod] | [ImpulseURL, RequestOptionsWithoutUrlAndMethod] | [RequestOptionsWithoutMethod];
type HttpDataOptions = [ImpulseURL] | [ImpulseURL, RequestDataBody] | [ImpulseURL, RequestDataBody, RequestOptionsWithoutUrlAndMethod];
export type HttpGetOptions = HttpOptions;
export type HttpDeleteOptions = HttpOptions;
export type HttpPostOptions = HttpDataOptions;
export type HttpPutOptions = HttpDataOptions;
export {};
