import { MixinTarget } from "@loopback/core";
import { InvocationContext } from "@loopback/context";
import {
    DefaultCrudRepository,
    DataObject,
    Options,
    Entity,
    Filter,
    FilterExcludingWhere,
    Where,
    Fields,
    EntityNotFoundError,
} from "@loopback/repository";

/**
 * This interface contains additional types added to FilterRepositoryMixin type
 */
export interface FilterRepository<
    T extends Entity,
    ID,
    Relations extends object = {}
> {}

/**
 *  +----------+    +--------+
 *  | findById |    | exists |
 *  +----+-----+    +---+----+
 *       |              |
 *       |              |
 *  +----v----+     +---v---+
 *  | findOne |     | count |
 *  +---------+     +-------+
 *
 *
 *  +--------+    +------------+   +-------------+
 *  | update |    | updateById |   | replaceById |
 *  +----+---+    +-----+------+   +-------+-----+
 *       |              |                  |
 *       |              |                  |
 *       |        +-----v-----+            |
 *       +--------> updateAll <------------+
 *                +-----------+
 *
 *
 *  +--------+    +------------+
 *  | delete |    | deleteById |
 *  +--+-----+    +------+-----+
 *     |                 |
 *     |                 |
 *     |  +-----------+  |
 *     +--> deleteAll <--+
 *        +-----------+
 */
/**
 * Filter repository mixin, add CRUD operations supporting filter
 */
export function FilterRepositoryMixin<
    T extends Entity,
    ID,
    Relations extends object = {}
>(config: {
    where: (context: InvocationContext, where: Where<T>) => Promise<Where<T>>;
    fields: (
        context: InvocationContext,
        fields: Fields<T>
    ) => Promise<Fields<T>>;
}) {
    return function <
        R extends MixinTarget<DefaultCrudRepository<T, ID, Relations>>
    >(superClass: R) {
        class MixedRepository
            extends superClass
            implements FilterRepository<T, ID, Relations> {
            /**
             * Filter where and find all entities
             */
            find = async (filter?: Filter<T>, options?: Options) => {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "read",
                    Array.from(arguments)
                );

                return await super.find(
                    {
                        ...filter,
                        where: await config.where(
                            filterContext,
                            filter?.where || {}
                        ),
                        fields: await config.fields(
                            filterContext,
                            filter?.fields || {}
                        ),
                    },
                    options
                );
            };

            /**
             * Filter where and find one entity
             */
            findOne = async (filter?: Filter<T>, options?: Options) => {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "read",
                    Array.from(arguments)
                );

                return await super.findOne(
                    {
                        ...filter,
                        where: await config.where(
                            filterContext,
                            filter?.where || {}
                        ),
                        fields: await config.fields(
                            filterContext,
                            filter?.fields || {}
                        ),
                    },
                    options
                );
            };

            /**
             * History findById() using findOne()
             */
            findById = async (
                id: ID,
                filter?: FilterExcludingWhere<T>,
                options?: Options
            ) => {
                const result = await this.findOne(
                    {
                        ...filter,
                        where: this.entityClass.buildWhereForId(id),
                    },
                    options
                );

                if (result) {
                    return result;
                } else {
                    throw new EntityNotFoundError(this.entityClass, id);
                }
            };

            /**
             * Filter where and count all entities
             */
            count = async (where?: Where<T>, options?: Options) => {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "read",
                    Array.from(arguments)
                );

                return await super.count(
                    await config.where(filterContext, where || {}),
                    options
                );
            };

            /**
             * History exists() using count()
             */
            exists = async (id: ID, options?: Options) => {
                const result = await this.count(
                    this.entityClass.buildWhereForId(id),
                    options
                );

                return result.count > 0;
            };

            /**
             * Filter where and update all entities
             */
            updateAll = async (
                data: DataObject<T>,
                where?: Where<T>,
                options?: Options
            ) => {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "update",
                    Array.from(arguments)
                );

                return await super.updateAll(
                    data,
                    await config.where(filterContext, where || {}),
                    options
                );
            };

            /**
             * History updateById() using updateAll()
             */
            updateById = async (
                id: ID,
                data: DataObject<T>,
                options?: Options
            ) => {
                await this.updateAll(
                    data,
                    this.entityClass.buildWhereForId(id),
                    options
                );
            };

            /**
             * History update() using updateAll()
             */
            update = async (entity: T, options?: Options) => {
                await this.updateAll(
                    entity,
                    this.entityClass.buildWhereForId(
                        this.entityClass.getIdOf(entity)
                    ),
                    options
                );
            };

            /**
             * History replaceById() using updateAll()
             */
            replaceById = async (
                id: ID,
                data: DataObject<T>,
                options?: Options
            ) => {
                await this.updateAll(
                    {
                        ...Object.fromEntries(
                            Object.entries(
                                this.entityClass.definition.properties
                            ).map(([key, _]) => [key, undefined])
                        ),
                        ...data,
                    },
                    this.entityClass.buildWhereForId(id),
                    options
                );
            };

            /**
             * Filter where and delete all entities
             */
            deleteAll = async (where?: Where<T>, options?: Options) => {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "delete",
                    Array.from(arguments)
                );

                return await super.deleteAll(
                    await config.where(filterContext, where || {}),
                    options
                );
            };

            /**
             * History delete() using deleteAll()
             */
            delete = async (entity: T, options?: Options) => {
                await this.deleteAll(
                    this.entityClass.buildWhereForId(
                        this.entityClass.getIdOf(entity)
                    ),
                    options
                );
            };

            /**
             * History deleteById() using deleteAll()
             */
            deleteById = async (id: ID, options?: Options) => {
                await this.deleteAll(
                    this.entityClass.buildWhereForId(id),
                    options
                );
            };
        }

        return MixedRepository;
    };
}
