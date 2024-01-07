import {type z} from "zod";
import {type ReleaseStubSchema} from "./ReleaseStubSchema";

export type ReleaseStub = z.infer<typeof ReleaseStubSchema>
