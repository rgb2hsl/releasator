import {type Env} from "../env";
import {error} from "itty-router";
import {type RichRequest} from "../types/RichRequest";
import {type Config, ConfigSchema} from "../config/ConfigSchema";
import {type ZodError} from "zod";
import {fromZodError} from "zod-validation-error";

export function createConfig(env: Env) {
    let config: Config;

    // TODO try catch
    const rawConfigParsed = JSON.parse(env.SERVICE_CONFIG);

    const configParseResult = ConfigSchema.safeParse({
        ...rawConfigParsed,
        allowedOrigins: [ env.GUI_ROOT ]
    });

    if (!configParseResult.success) {
        const validationError = fromZodError(configParseResult.error as ZodError);
        const errorMessage = `Error parsing SERVICE_CONFIG from [vars]. ${validationError.message}`;
        console.error(errorMessage);
        return {
            success: false,
            error: errorMessage
        };
    }

    config = configParseResult.data;

    if (config.notificationServices.includes("slack")) {
        config.slackService = {
            adminChannelWebhook: env.SLACK_ADMIN_CHANNEL_WEBHOOK ?? "",
            notificationsChannelWebhook: env.SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK ?? ""
        };

        const configResult = ConfigSchema.safeParse(config);

        if (!configResult.success) {
            const validationError = fromZodError(configResult.error as ZodError);
            const errorMessage = `SLACK_ADMIN_CHANNEL_WEBHOOK or (and) SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK is invalid, but notificationServices is included in notificationServices. ${validationError.message}`;
            console.error(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }

        config = configResult.data
    }

    return {
        success: true,
        data: config
    };
}

export const withConfig = (request: RichRequest, env: Env) => {
    const configResult = createConfig(env);

    if (configResult.success && configResult.data) {
        request.serviceConfig = configResult.data;
    } else {
        return error(500, configResult.error);
    }

};
