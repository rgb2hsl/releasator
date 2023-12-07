import { type Env } from '../env';
import { error } from 'itty-router';
import { type RichRequest } from '../types/RichRequest';
import { type Config, ConfigSchema } from '../config/ConfigSchema';
import { type ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const withConfig = (request: RichRequest,  env: Env) => {
    let config: Config;

    try {
        config = ConfigSchema.parse(JSON.parse(env.SERVICE_CONFIG));
    } catch (e) {
        const validationError = fromZodError(e as ZodError);
        const errorMessage = `Error parsing SERVICE_CONFIG from [vars]. ${validationError.message}`;
        console.error(errorMessage);
        return error(500, errorMessage);
    }

    if (config.notificationServices.includes("slack")) {
        config.slackService = {
            adminChannelWebhook: env.SLACK_ADMIN_CHANNEL_WEBHOOK ?? "",
            notificationsChannelWebhook: env.SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK ?? "",
        }

        try {
            config = ConfigSchema.parse(config);
        } catch (e) {
            const validationError = fromZodError(e as ZodError);
            const errorMessage = `SLACK_ADMIN_CHANNEL_WEBHOOK or (and) SLACK_NOTIFICATIONS_CHANNEL_WEBHOOK is invalid, but notificationServices is included in notificationServices. ${validationError.message}`;
            console.error(errorMessage);
            return error(500, errorMessage);
        }
    }

    request.serviceConfig = config;
}
