import {z} from "zod";

export const ConfigSchema = z.object({
    allowedDemoDomains: z.array(z.string()),
    knownContributors: z.array(z.object({
        githubLogin: z.string(),
        slackUID: z.string().optional(),
        telegramUsername: z.string().optional(),
        name: z.string().optional()
    })),
    knownProducts: z.array(z.object({
        repoString: z.string(),
        name: z.string(),
        website: z.string().optional()
    })),
    notificationServices: z.array(z.union([z.literal("slack"), z.string()])),
    notificationDelayMinutes: z.number(),
    slackService: z.object({
        adminChannelWebhook: z.string().url(),
        notificationsChannelWebhook: z.string().url()
    }).optional()
});

export type Config = z.infer<typeof ConfigSchema>
