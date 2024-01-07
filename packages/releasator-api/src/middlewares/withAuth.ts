import {type Env} from "../env";
import {error} from "itty-router";
import {type RichRequest} from "../types/RichRequest";

export const withAuth = (request: RichRequest, env: Env) => {
    const token = request.headers.get("Authorization");

    if (token !== `Bearer ${env.AUTH_SUPER_TOKEN}`) return error(401, "Unauthorised");

    request.token = token;
};
