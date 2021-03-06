import { MixinTarget, Context } from "@loopback/core";
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

export interface FilterOptions extends Options {
    context: Context;
}

/**
 * This interface contains additional types added to FilterRepositoryMixin type
 */
export interface FilterRepository<
    T extends Entity,
    ID,
    Relations extends object = {}
> {}

/**
 *  +--------+
 *  | create |
 *  +----+---+
 *       |
 *       |
 *  +----v------+
 *  | createAll |
 *  +-----------+
 *
 *
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
    models: (
        context: InvocationContext,
        entities: DataObject<T>[]
    ) => Promise<DataObject<T>[]>;
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
             * Map models and create all entities
             */
            createAll = async (
                entities: DataObject<T>[],
                options?: FilterOptions
            ) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
                    this,
                    "create",
                    Array.from(arguments)
                );

                return await super.createAll(
                    await config.models(filterContext, entities || []),
                    options
                );
            };

            /**
             * Filter create() using createAll()
             */
            create = async (entity: DataObject<T>, options?: FilterOptions) => {
                const result = await this.createAll([entity], options);

                return result[0];
            };

            /**
             * Filter where and find all entities
             */
            find = async (filter?: Filter<T>, options?: FilterOptions) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
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
            findOne = async (filter?: Filter<T>, options?: FilterOptions) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
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
             * Filter findById() using findOne()
             */
            findById = async (
                id: ID,
                filter?: FilterExcludingWhere<T>,
                options?: FilterOptions
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
            count = async (where?: Where<T>, options?: FilterOptions) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
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
             * Filter exists() using count()
             */
            exists = async (id: ID, options?: FilterOptions) => {
                const result = await this.count(
                    this.entityClass.buildWhereForId(id),
                    options
                );

                return result.count > 0;
            };

            /**
             * Filter where, Map models and update all entities
             */
            updateAll = async (
                data: DataObject<T>,
                where?: Where<T>,
                options?: FilterOptions
            ) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
                    this,
                    "update",
                    Array.from(arguments)
                );

                const mappedData = (
                    await config.models(filterContext, [data])
                )[0];
                if (!mappedData) {
                    return {
                        count: 0,
                    };
                }

                return await super.updateAll(
                    mappedData,
                    await config.where(filterContext, where || {}),
                    options
                );
            };

            /**
             * Filter updateById() using updateAll()
             */
            updateById = async (
                id: ID,
                data: DataObject<T>,
                options?: FilterOptions
            ) => {
                await this.updateAll(
                    data,
                    this.entityClass.buildWhereForId(id),
                    options
                );
            };

            /**
             * Filter update() using updateAll()
             */
            update = async (entity: T, options?: FilterOptions) => {
                await this.updateAll(
                    entity,
                    this.entityClass.buildWhereForId(
                        this.entityClass.getIdOf(entity)
                    ),
                    options
                );
            };

            /**
             * Filter replaceById() using updateAll()
             */
            replaceById = async (
                id: ID,
                data: DataObject<T>,
                options?: FilterOptions
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
            deleteAll = async (where?: Where<T>, options?: FilterOptions) => {
                const filterContext = new InvocationContext(
                    options?.context as Context,
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
             * Filter delete() using deleteAll()
             */
            delete = async (entity: T, options?: FilterOptions) => {
                await this.deleteAll(
                    this.entityClass.buildWhereForId(
                        this.entityClass.getIdOf(entity)
                    ),
                    options
                );
            };

            /**
             * Filter deleteById() using deleteAll()
             */
            deleteById = async (id: ID, options?: FilterOptions) => {
                await this.deleteAll(
                    this.entityClass.buildWhereForId(id),
                    options
                );
            };
        }

        return MixedRepository;
    };
}
