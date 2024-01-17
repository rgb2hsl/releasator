import { type APIConfig } from 'releasator-types';


export interface RichRequest extends RequestWithConfig {
    token: string | null,
    serviceConfig: APIConfig,
}

export interface RequestWithConfig extends Request {
    serviceConfig: APIConfig,
}
