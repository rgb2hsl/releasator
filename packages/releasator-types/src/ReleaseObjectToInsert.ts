import {type ReleaseObject} from "./ReleaseObject.js";

export type ReleaseObjectToInsert = Omit<ReleaseObject, "id" | "createdAt" | "queuedTo" | "postedAt" | "editHash">
