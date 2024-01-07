import {type ReleaseObject} from "./ReleaseObject";

export type ReleaseObjectToInsert = Omit<ReleaseObject, "id" | "createdAt" | "queuedTo" | "postedAt" | "editHash">
