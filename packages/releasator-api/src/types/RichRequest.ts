import {type Config} from "../config/ConfigSchema";

export interface RichRequest extends RequestWithConfig {
    token: string | null,
    serviceConfig: Config,
}

export interface RequestWithConfig extends Request {
    serviceConfig: Config,
}
