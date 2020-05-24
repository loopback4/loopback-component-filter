import { InvocationContext } from "@loopback/context";
import {
    juggler,
    Class,
    DefaultCrudRepository,
    EntityNotFoundError,
    DataObject,
    Options,
    Entity,
    Filter,
    Where,
    Fields,
    Count,
} from "@loopback/repository";

import { Ctor } from "../types";

export interface RepositoryConfig<Model extends Entity> {
    id: keyof Model;
    where: (
        context: InvocationContext,
        where: Where<Model>
    ) => Promise<Where<Model>>;
    fields: (
        context: InvocationContext,
        fields: Fields<Model>
    ) => Promise<Fields<Model>>;
}

/**
 * Repository Type
 */
export interface FilterRepository<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
> extends DefaultCrudRepository<Model, ModelID, ModelRelations> {}

/**
 * Repository Mixin
 */
export function FilterRepositoryMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
>(config: RepositoryConfig<Model>) {
    /**
     * Return function with generic type of repository class, returns mixed in class
     *
     * bugfix: optional type, load type from value
     */
    return function <
        RepositoryClass extends Class<
            DefaultCrudRepository<Model, ModelID, ModelRelations>
        >
    >(
        superClass?: RepositoryClass
    ): RepositoryClass &
        Class<FilterRepository<Model, ModelID, ModelRelations>> {
        const parentClass: Class<DefaultCrudRepository<
            Model,
            ModelID,
            ModelRelations
        >> = superClass || DefaultCrudRepository;

        class Repository extends parentClass
            implements FilterRepository<Model, ModelID, ModelRelations> {
            constructor(ctor: Ctor<Model>, dataSource: juggler.DataSource) {
                super(ctor, dataSource);
            }

            /**
             * Read methods
             */
            async find(
                filter?: Filter<Model>,
                options?: Options
            ): Promise<(Model & ModelRelations)[]> {
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
            }

            async findOne(
                filter?: Filter<Model>,
                options?: Options
            ): Promise<(Model & ModelRelations) | null> {
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
            }

            async findById(
                id: ModelID,
                filter?: Filter<Model>,
                options?: Options
            ): Promise<Model & ModelRelations> {
                const item = await this.findOne(
                    {
                        ...filter,
                        where: filter?.where
                            ? {
                                  and: [
                                      filter.where,
                                      {
                                          [config.id as any]: id,
                                      },
                                  ],
                              }
                            : {
                                  [config.id as any]: id,
                              },
                    },
                    options
                );

                if (!item) {
                    throw new EntityNotFoundError(this.entityClass, id);
                }

                return item;
            }

            async count(
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
                const filterContext = new InvocationContext(
                    undefined as any,
                    this,
                    "count",
                    Array.from(arguments)
                );

                return await super.count(
                    await config.where(filterContext, where || {}),
                    options
                );
            }

            async exists(id: ModelID, options?: Options): Promise<boolean> {
                const count = await this.count(
                    { [config.id as any]: id },
                    options
                );

                return count.count > 0;
            }

            /**
             * Update methods
             */
            async update(entity: Model, options?: Options): Promise<void> {
                await super.updateAll(
                    entity,
                    { [config.id as any]: (entity as any)[config.id] },
                    options
                );
            }

            async updateAll(
                data: DataObject<Model>,
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
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
            }

            async updateById(
                id: ModelID,
                data: DataObject<Model>,
                options?: Options
            ): Promise<void> {
                await this.updateAll(data, { [config.id as any]: id }, options);
            }

            async replaceById(
                id: ModelID,
                data: DataObject<Model>,
                options?: Options
            ): Promise<void> {
                await this.updateAll(data, { [config.id as any]: id }, options);
            }

            /**
             * Delete methods
             */
            async delete(entity: Model, options?: Options): Promise<void> {
                await super.deleteAll(
                    { [config.id as any]: (entity as any)[config.id] },
                    options
                );
            }

            async deleteAll(
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
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
            }

            async deleteById(id: ModelID, options?: Options): Promise<void> {
                await this.deleteAll({ [config.id as any]: id }, options);
            }
        }

        return Repository as any;
    };
}
