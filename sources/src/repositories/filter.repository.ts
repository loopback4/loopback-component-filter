import {
    juggler,
    Class,
    DefaultCrudRepository,
    DataObject,
    Options,
    Entity,
    Filter,
    Where,
    Count,
} from "@loopback/repository";

import { Ctor } from "../types";

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
>() {
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
            constructor(ctor: Ctor<Model>, dataSource: juggler.DataSource) {
                super(ctor, dataSource);
            }

            /**
             * Create methods
             */
            async create(
                entity: DataObject<Model>,
                options?: Options
            ): Promise<Model> {
                return super.create(entity, options);
            }

            async createAll(
                entities: DataObject<Model>[],
                options?: Options
            ): Promise<Model[]> {
                return super.createAll(entities, options);
            }

            /**
             * Read methods
             */
            async find(
                filter?: Filter<Model>,
                options?: Options
            ): Promise<(Model & ModelRelations)[]> {
                return super.find(filter, options);
            }

            async findOne(
                filter?: Filter<Model>,
                options?: Options
            ): Promise<(Model & ModelRelations) | null> {
                return super.findOne(filter, options);
            }

            async findById(
                id: ModelID,
                filter?: Filter<Model>,
                options?: Options
            ): Promise<Model & ModelRelations> {
                return super.findById(id, filter, options);
            }

            async count(
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
                return super.count(where, options);
            }

            async exists(id: ModelID, options?: Options): Promise<boolean> {
                return super.exists(id, options);
            }

            /**
             * Update methods
             */
            async update(entity: Model, options?: Options): Promise<void> {
                return super.update(entity, options);
            }

            async updateAll(
                data: DataObject<Model>,
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
                return super.updateAll(data, where, options);
            }

            async updateById(
                id: ModelID,
                data: DataObject<Model>,
                options?: Options
            ): Promise<void> {
                return super.updateById(id, data, options);
            }

            async replaceById(
                id: ModelID,
                data: DataObject<Model>,
                options?: Options
            ): Promise<void> {
                return super.replaceById(id, data, options);
            }

            /**
             * Delete methods
             */
            async delete(entity: Model, options?: Options): Promise<void> {
                return super.delete(entity, options);
            }

            async deleteAll(
                where?: Where<Model>,
                options?: Options
            ): Promise<Count> {
                return super.deleteAll(where, options);
            }

            async deleteById(id: ModelID, options?: Options): Promise<void> {
                return super.deleteById(id, options);
            }
        }

        return Repository as any;
    };
}
