import { Entity } from "@loopback/repository";

/** Model Ctor type */
export type Ctor<Model extends Entity> = typeof Entity & {
    prototype: Model;
};
