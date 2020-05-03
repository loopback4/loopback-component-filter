import { InvocationArgs, InvocationContext } from "@loopback/context";
import { Application, CoreBindings } from "@loopback/core";
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

/**
 * Repository Config
 */
export interface FilterContext<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
> {
    target: DefaultCrudRepository<Model, ModelID, ModelRelations>;
    methodName: keyof DefaultCrudRepository<Model, ModelID, ModelRelations>;
    args: InvocationArgs;
    invocationContext: InvocationContext;
}

export interface RepositoryConfig<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
> {
    id: string;
    where: (
        context: FilterContext<Model, ModelID, ModelRelations>,
        where: Where<Model>
    ) => Promise<Where<Model>>;
    fields: (
        context: FilterContext<Model, ModelID, ModelRelations>,
        fields: Fields<Model>
    ) => Promise<Fields<Model>>;
}

/**
 * Repository Type
 */
export interface FilterCrudRepository<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
> extends DefaultCrudRepository<Model, ModelID, ModelRelations> {}

/**
 * Repository Mixin
 */
export function FilterCrudRepositoryMixin<
    Model extends Entity,
    ModelID,
    ModelRelations extends object = {}
>(config: RepositoryConfig<Model, ModelID, ModelRelations>) {
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
        Class<FilterCrudRepository<Model, ModelID, ModelRelations>> {
        const parentClass: Class<DefaultCrudRepository<
            Model,
            ModelID,
            ModelRelations
        >> = superClass || DefaultCrudRepository;

        class Repository extends parentClass
            implements FilterCrudRepository<Model, ModelID, ModelRelations> {
            private application: Application;

            constructor(
                ctor: Ctor<Model>,
                dataSource: juggler.DataSource,
                application: Application
            ) {
                super(ctor, dataSource);

                this.application = application;
            }

            /**
             * Get FilterContext method
             */
            private getFilterContext(
                args: IArguments
            ): FilterContext<Model, ModelID, ModelRelations> {
                return {
                    target: this,
                    methodName: args.callee.name as any,
                    args: Array.from(args),
                    invocationContext: new InvocationContext(
                        this.application,
                        this.application.getSync(
                            CoreBindings.CONTROLLER_CURRENT
                        ) as any,
                        this.application.getSync(
                            CoreBindings.CONTROLLER_METHOD_NAME
                        ),
                        this.application.getSync(
                            CoreBindings.CONTROLLER_METHOD_META
                        )
                    ),
                };
            }

            /**
             * Read methods
             */
            async find(
                filter?: Filter<Model>,
                options?: Options
            ): Promise<(Model & ModelRelations)[]> {
                const filterContext = this.getFilterContext(arguments);

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
                const filterContext = this.getFilterContext(arguments);

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
                const filterContext = this.getFilterContext(arguments);

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
                const filterContext = this.getFilterContext(arguments);

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
                const filterContext = this.getFilterContext(arguments);

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
