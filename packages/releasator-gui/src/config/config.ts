import {ConfigSchema} from "../types/config";

export const c = ConfigSchema.parse({
    API_ROOT: process.env.API_ROOT
});
