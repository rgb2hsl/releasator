import {z} from "zod";

export const RepoStringSchema = z.string().min(1).regex(
    /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
    "Must be a valid GitHub <owner>/<repo> format"
);
