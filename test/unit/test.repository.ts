import { Constructor } from "@loopback/core";
import {
    juggler,
    Getter,
    Entity,
    BelongsToAccessor,
    DefaultCrudRepository,
} from "@loopback/repository";

import { FilterRepositoryMixin } from "../../src";

import { User } from "./test.model";

export class UserRepository extends FilterRepositoryMixin<User, string, {}>({
    where: async (context, where) => ({
        and: [{ username: { neq: "user1" } }, where],
    }),
    fields: async (context, fields) => ({
        ...fields,
        password: false,
    }),
})<Constructor<DefaultCrudRepository<User, string, {}>>>(
    DefaultCrudRepository
) {
    public readonly parent: BelongsToAccessor<User, typeof User.prototype.id>;

    constructor(
        ctor: typeof Entity & {
            prototype: User;
        },
        dataSource: juggler.DataSource
    ) {
        super(ctor, dataSource);

        this.parent = this.createBelongsToAccessorFor(
            "parent",
            Getter.fromValue(this)
        );
        this.registerInclusionResolver("parent", this.parent.inclusionResolver);
    }
}
