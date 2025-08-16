/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SendAuthEmailRequestBody {
  email: string;
  username: string;
}

export interface SendAuthEmailResponseBody {
  status: boolean;
}

export interface VerifyAuthEmailRequestBody {
  verificationCode: string;
}

export interface VerifyAuthEmailResponseBody {
  userId: string;
  userToken: string;
}

export interface GetUserInfoRequestBody {
  userToken: string;
}

export interface GetUserInfoResponseBody {
  userId: string;
  username: string;
  email: string;
  eoaAddress: string;
  smartAccountAddress: string;
  balance: Record<
    string,
    {
      id: string;
      chainId: number;
      address: string;
      symbol: string;
      name: string;
      image: string;
      decimals: number;
      rawAmount: string;
      tokenAmount: number;
    }
  >;
}

export interface CreateSessionRequestBody {
  network: string;
  userToken: string;
}

export interface CreateSessionResponseBody {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
}

export interface JoinSessionRequestBody {
  userToken: string;
  sessionCode: string;
}

export interface JoinSessionResponseBody {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
}

export interface GetSessionInfoRequestBody {
  sessionId: string;
  userToken?: string;
}

export interface GetSessionTokenInfo {
  id: string;
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  image: string;
  decimals: number;
  rawAmount: string;
  tokenAmount: number;
  balanceRawAmount: string;
  balanceTokenAmount: number;
}

export interface GetSessionInfoPlayer {
  id: string;
  username: string;
  tokenInfo: GetSessionTokenInfo;
  isOnline: boolean;
}

export interface GetSessionInfoResponseBody {
  sessionId: string;
  sessionCode: string;
  network: string;
  player1: GetSessionInfoPlayer;
  player2?: GetSessionInfoPlayer;
  expiresAt: string;
}

export interface BetSessionRequestBody {
  sessionToken: string;
  rawAmount: string;
}

export interface BetSessionResponseBody {
  success: boolean;
}

export interface SettleSessionReplayRequestBody {
  sessionId: string;
  userId: string;
}

export interface SettleSessionReplayResponseBody {
  success: boolean;
}

export interface GetHistoryRequestBody {
  userToken: string;
}

export interface GetHistoryResponseBodyDataElement {
  id: string;
  category: string;
  timestampId: string;
  sessionId: string;
  userId: string;
  rawAmount: string;
  tokenAmount: string;
  createdAt: string;
}

export interface GetHistoryResponseBody {
  data: GetHistoryResponseBodyDataElement[];
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Hera API
 * @version 1.0
 * @contact
 *
 * APIs for interacting with Hera.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags App
   * @name AppControllerGetHello
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/`,
      method: "GET",
      ...params,
    });

  api = {
    /**
     * No description
     *
     * @tags User
     * @name UserControllerSendAuthEmail
     * @request POST:/api/v1/user/auth/email
     */
    userControllerSendAuthEmail: (
      data: SendAuthEmailRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<SendAuthEmailResponseBody, any>({
        path: `/api/v1/user/auth/email`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserControllerVerifyAuthEmail
     * @request POST:/api/v1/user/auth/verify
     */
    userControllerVerifyAuthEmail: (
      data: VerifyAuthEmailRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<VerifyAuthEmailResponseBody, any>({
        path: `/api/v1/user/auth/verify`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserControllerGetUserInfo
     * @request POST:/api/v1/user/info
     */
    userControllerGetUserInfo: (
      data: GetUserInfoRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<GetUserInfoResponseBody, any>({
        path: `/api/v1/user/info`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerCreateSession
     * @request POST:/api/v1/session/create
     */
    sessionControllerCreateSession: (
      data: CreateSessionRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<CreateSessionResponseBody, any>({
        path: `/api/v1/session/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerJoinSession
     * @request POST:/api/v1/session/join
     */
    sessionControllerJoinSession: (
      data: JoinSessionRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<JoinSessionResponseBody, any>({
        path: `/api/v1/session/join`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerGetSessionInfo
     * @request POST:/api/v1/session/info
     */
    sessionControllerGetSessionInfo: (
      data: GetSessionInfoRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<GetSessionInfoResponseBody, any>({
        path: `/api/v1/session/info`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerBetSession
     * @request POST:/api/v1/session/bet
     */
    sessionControllerBetSession: (
      data: BetSessionRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<BetSessionResponseBody, any>({
        path: `/api/v1/session/bet`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerSettleSessionReplay
     * @request POST:/api/v1/session/settle
     */
    sessionControllerSettleSessionReplay: (
      data: SettleSessionReplayRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<SettleSessionReplayResponseBody, any>({
        path: `/api/v1/session/settle`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Session
     * @name SessionControllerGetHistory
     * @request POST:/api/v1/session/history
     */
    sessionControllerGetHistory: (
      data: GetHistoryRequestBody,
      params: RequestParams = {},
    ) =>
      this.request<GetHistoryResponseBody, any>({
        path: `/api/v1/session/history`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
