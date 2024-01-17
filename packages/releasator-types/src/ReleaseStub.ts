import {type z} from "zod";
import {type ReleaseStubSchema} from "./ReleaseStubSchema.js";

export type ReleaseStub = z.infer<typeof ReleaseStubSchema>
