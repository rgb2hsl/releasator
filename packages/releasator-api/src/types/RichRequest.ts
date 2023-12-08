import { type Config } from '../config/ConfigSchema';

export interface RichRequest extends Request {
    token: string | null,
    serviceConfig: Config,
}
