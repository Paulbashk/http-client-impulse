import type { RequestConfig, HttpResponse, HttpGetOptions, HttpPostOptions, HttpPutOptions, HttpDeleteOptions } from "./index.types.d.ts";
declare function create(config?: RequestConfig): {
    get<T>(...options: HttpGetOptions): Promise<HttpResponse<T>>;
    post<T>(...options: HttpPostOptions): Promise<HttpResponse<T>>;
    put<T>(...options: HttpPutOptions): Promise<HttpResponse<T>>;
    delete<T>(...options: HttpDeleteOptions): Promise<HttpResponse<T>>;
};
export default create;
