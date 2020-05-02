import {
    juggler,
    Class,
    DefaultCrudRepository,
    DataObject,
    Options,
    Filter,
    Where,
    Count,
    EntityNotFoundError,
} from "@loopback/repository";

import { Ctor } from "../types";

export interface HistoryOptions extends Options {
    crud?: true;
    maxDate?: Date;
}

/**
 * Repository Type
 */
export interface HistoryCrudRepository<
    Model extends HistoryEntity,
    ModelRelations extends HistoryEntityRelations
> extends DefaultCrudRepository<Model, string, ModelRelations> {}

/**
 * Repository Mixin
 */
export function HistoryCrudRepositoryMixin<
    Model extends HistoryEntity,
    ModelRelations extends HistoryEntityRelations
>() {
    /**
     * Return function with generic type of repository class, returns mixed in class
     *
     * bugfix: optional type, load type from value
     */
    return function <
        RepositoryClass extends Class<
            DefaultCrudRepository<Model, string, ModelRelations>
        >
    >(
        superClass?: RepositoryClass
    ): RepositoryClass & Class<HistoryCrudRepository<Model, ModelRelations>> {
        const parentClass: Class<DefaultCrudRepository<
            Model,
            string,
            ModelRelations
        >> = superClass || DefaultCrudRepository;

        class Repository extends parentClass
            implements HistoryCrudRepository<Model, ModelRelations> {
            constructor(ctor: Ctor<Model>, dataSource: juggler.DataSource) {
                super(ctor, dataSource);
            }

            /**
             * Check unique create
             */
            private async createUnique(entities: DataObject<Model>[]) {
                /**
                 * 1. duplicate(unique(x),unique(y),unique(z)) == false
                 */
                const modelUniquesFields = Object.entries(
                    this.entityClass.definition.properties
                )
                    .filter(([_, definition]) => definition.unique)
                    .map(([fieldName, _]) => fieldName);

                const entitiesUniquesFields = modelUniquesFields
                    .map((fieldName) =>
                        entities.map<string>((entity: any) => entity[fieldName])
                    )
                    .filter((field) => field);

                const hasDuplicateUniqueFields = entitiesUniquesFields
                    .map(
                        (fields) =>
                            Object.values(
                                fields.reduce<{ [key: string]: number }>(
                                    (prev, item) => ({
                                        ...prev,
                                        [item]: (prev.item || 0) + 1,
                                    }),
                                    {}
                                )
                            ).filter((fieldsCount) => fieldsCount > 1).length >
                            0
                    )
                    .reduce(
                        (prev, hasDuplicate) => prev || hasDuplicate,
                        false
                    );

                if (hasDuplicateUniqueFields) {
                    throw new EntityUniqueConflictError(
                        this.entityClass,
                        modelUniquesFields
                    );
                }

                /**
                 * 2. count(and: [
                 *          {endDate:null},
                 *          {or: [unique(x),unique(y),unique(z)]}
                 *    ]) == 0
                 */
                const uniqueConditions = modelUniquesFields
                    .map((fieldName, index) => ({
                        fieldName: fieldName,
                        fields: entitiesUniquesFields[index],
                    }))
                    .filter(({ fields }) => fields.length > 0)
                    .map(({ fieldName, fields }) => ({
                        [fieldName]: { inq: fields },
                    }));

                if (uniqueConditions.length > 0) {
                    const uniqueFieldsCount = await super.count({
                        and: [
                            { endDate: null },
                            { or: uniqueConditions },
                        ] as any,
                    });

                    if (uniqueFieldsCount.count > 0) {
                        throw new EntityUniqueConflictError(
                            this.entityClass,
                            modelUniquesFields
                        );
                    }
                }
            }

            /**
             * Create methods
             */
            private async createHistory(
                entities: DataObject<Model>[],
                options?: HistoryOptions
            ): Promise<Model[]> {
                /**
                 * create(uid:null,beginDate:$now,endDate:null,id:null)
                 */
                const date = new Date();

                return await super.createAll(
                    entities.map((entity) => ({
                        ...entity,
                        uid: undefined,
                        beginDate: date,
                        endDate: null,
                        id: undefined,
                    })),
                    options
                );
            }

            async create(
                entity: DataObject<Model>,
                options?: HistoryOptions
            ): Promise<Model> {
                if (options && options.crud) {
                    return super.create(entity, options);
                }

                await this.createUnique([entity]);

                return (await this.createHistory([entity], options))[0];
            }

            async createAll(
                entities: DataObject<Model>[],
                options?: HistoryOptions
            ): Promise<Model[]> {
                if (options && options.crud) {
                    return super.createAll(entities, options);
                }

                await this.createUnique(entities);

                return await this.createHistory(entities, options);
            }

            /**
             * Read methods
             */
            private async findHistory(
                group: boolean,
                filter: Filter,
                options?: HistoryOptions
            ): Promise<(Model & ModelRelations)[]> {
                /**
                 * where: {id:id,endDate<=date|endDate:null}
                 * select(where)
                 * group(beginDate:last)
                 */
                let result = await super.find(filter as any, options);

                if (group) {
                    // find last entities group by id and save last entities in object
                    let lastEntities: any = {};
                    result.forEach((entity) => {
                        if (
                            !lastEntities[entity.id] ||
                            lastEntities[entity.id].beginDate < entity.beginDate
                        ) {
                            lastEntities[entity.id] = entity;
                        }
                    });

                    // filter only last entity of every group (by id)
                    result = result.filter(
                        (entity) => lastEntities[entity.id].uid === entity.uid
                    );
                }

                return result;
            }

            async find(
                filter?: Filter<Model>,
                options?: HistoryOptions
            ): Promise<(Model & ModelRelations)[]> {
                if (options && options.crud) {
                    return super.find(filter, options);
                }

                const maxDate = options && options.maxDate;
                const maxDateCondition = maxDate ? { lt: maxDate } : null;

                /** Create history filter by endDate, id */
                let historyFilter;
                if (filter && filter.where) {
                    historyFilter = {
                        ...filter,
                        where: {
                            and: [{ endDate: maxDateCondition }, filter.where],
                        },
                    };
                } else {
                    historyFilter = {
                        ...filter,
                        where: { endDate: maxDateCondition },
                    };
                }

                return await this.findHistory(
                    Boolean(maxDate),
                    historyFilter,
                    options
                );
            }

            async findOne(
                filter?: Filter<Model>,
                options?: HistoryOptions
            ): Promise<(Model & ModelRelations) | null> {
                if (options && options.crud) {
                    return super.findOne(filter, options);
                }

                const maxDate = options && options.maxDate;
                const maxDateCondition = maxDate ? { lt: maxDate } : null;

                /** Create history filter by endDate, id */
                let historyFilter;
                if (filter && filter.where) {
                    historyFilter = {
                        ...filter,
                        where: {
                            and: [{ endDate: maxDateCondition }, filter.where],
                        },
                    };
                } else {
                    historyFilter = {
                        ...filter,
                        where: { endDate: maxDateCondition },
                    };
                }

                const result = await this.findHistory(
                    Boolean(maxDate),
                    historyFilter,
                    options
                );

                if (result[0]) {
                    return result[0];
                }
                return null;
            }

            async findById(
                id: string,
                filter?: Filter<Model>,
                options?: HistoryOptions
            ): Promise<Model & ModelRelations> {
                if (options && options.crud) {
                    return super.findById(id, filter, options);
                }

                const maxDate = options && options.maxDate;
                const maxDateCondition = maxDate ? { lt: maxDate } : null;

                /** Create history filter by endDate, id */
                let historyFilter;
                if (filter && filter.where) {
                    historyFilter = {
                        ...filter,
                        where: {
                            and: [
                                {
                                    id: id,
                                    endDate: maxDateCondition,
                                },
                                filter.where,
                            ],
                        },
                    };
                } else {
                    historyFilter = {
                        ...filter,
                        where: {
                            id: id,
                            endDate: maxDateCondition,
                        },
                    };
                }

                const result = await this.findHistory(
                    Boolean(maxDate),
                    historyFilter,
                    options
                );

                if (result[0]) {
                    return result[0];
                }
                throw new EntityNotFoundError(this.entityClass, id);
            }

            async count(
                where?: Where<Model>,
                options?: HistoryOptions
            ): Promise<Count> {
                if (options && options.crud) {
                    return super.count(where, options);
                }

                const maxDate = options && options.maxDate;
                const maxDateCondition = maxDate ? { lt: maxDate } : null;

                /** Create history filter by endDate, id */
                let historyFilter;
                if (where) {
                    historyFilter = {
                        where: {
                            and: [{ endDate: maxDateCondition }, where],
                        },
                    };
                } else {
                    historyFilter = {
                        where: { endDate: maxDateCondition },
                    };
                }

                const result = await this.findHistory(
                    Boolean(maxDate),
                    historyFilter,
                    options
                );

                return {
                    count: result.length,
                };
            }

            async exists(
                id: string,
                options?: HistoryOptions
            ): Promise<boolean> {
                if (options && options.crud) {
                    return super.exists(id, options);
                }

                const maxDate = options && options.maxDate;
                const maxDateCondition = maxDate ? { lt: maxDate } : null;

                /** Create history filter by endDate, id */
                let historyFilter = {
                    where: {
                        id: id,
                        endDate: maxDateCondition,
                    },
                };

                const result = await this.findHistory(
                    Boolean(maxDate),
                    historyFilter,
                    options
                );

                if (result[0]) {
                    return true;
                }
                return false;
            }

            /**
             * Check unique update
             */
            private async updateUnique(data: DataObject<Model>, where: Where) {
                /**
                 * 1. count(and: [
                 *          {endDate:null},
                 *          unique(x)
                 *    ]) == 0
                 */
                const modelUniquesFields = Object.entries(
                    this.entityClass.definition.properties
                )
                    .filter(([_, definition]) => definition.unique)
                    .map(([fieldName, _]) => fieldName);

                const uniqueConditions = modelUniquesFields
                    .map((fieldName) => ({
                        fieldName: fieldName,
                        field: (data as any)[fieldName],
                    }))
                    .filter(({ field }) => field)
                    .map(({ fieldName, field }) => ({
                        [fieldName]: field,
                    }));

                if (uniqueConditions.length > 0) {
                    const uniqueFieldsCount = await super.count({
                        and: [
                            { endDate: null },
                            { or: uniqueConditions },
                        ] as any,
                    });

                    if (uniqueFieldsCount.count > 0) {
                        throw new EntityUniqueConflictError(
                            this.entityClass,
                            modelUniquesFields
                        );
                    }
                }

                /**
                 * 2. if (count(and: [
                 *          {endDate: null},
                 *          where
                 *    ]) > 1) => unique(x).length == 0
                 */
                const targetCount = await super.count(where as any);

                if (targetCount.count > 1 && modelUniquesFields.length > 0) {
                    throw new EntityUniqueConflictError(
                        this.entityClass,
                        modelUniquesFields
                    );
                }
            }

            /**
             * Update methods
             */
            private async updateHistory(
                data: DataObject<Model>,
                replace: boolean,
                where: Where,
                options?: HistoryOptions
            ): Promise<Count> {
                /**
                 * where: {id:id,endDate:null}
                 * select(where)
                 * create(uid:null,beginDate:$now,endDate:null)
                 * update(where) => endDate: $now
                 */
                const date = new Date();

                const entities = await super.find(
                    {
                        where: where as any,
                    },
                    options
                );

                await super.createAll(
                    entities.map((entity) => ({
                        ...(replace ? {} : entity),
                        ...data,
                        uid: undefined,
                        beginDate: date,
                        endDate: null,
                        id: entity.id,
                    })),
                    options
                );

                return await super.updateAll(
                    { endDate: date },
                    {
                        uid: { inq: entities.map((entity) => entity.uid) },
                    } as any,
                    options
                );
            }

            async update(
                entity: Model,
                options?: HistoryOptions
            ): Promise<void> {
                if (options && options.crud) {
                    return super.update(entity, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter = {
                    id: entity.id,
                    endDate: null,
                };

                await this.updateUnique(entity, historyFilter);

                await this.updateHistory(entity, false, historyFilter, options);
            }

            async updateAll(
                data: DataObject<Model>,
                where?: Where<Model>,
                options?: HistoryOptions
            ): Promise<Count> {
                if (options && options.crud) {
                    return super.updateAll(data, where, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter;
                if (where) {
                    historyFilter = { and: [{ endDate: null }, where] };
                } else {
                    historyFilter = { endDate: null };
                }

                await this.updateUnique(data, historyFilter);

                return await this.updateHistory(
                    data,
                    false,
                    historyFilter,
                    options
                );
            }

            async updateById(
                id: string,
                data: DataObject<Model>,
                options?: HistoryOptions
            ): Promise<void> {
                if (options && options.crud) {
                    return super.updateById(id, data, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter = {
                    id: id,
                    endDate: null,
                };

                await this.updateUnique(data, historyFilter);

                await this.updateHistory(data, false, historyFilter, options);
            }

            async replaceById(
                id: string,
                data: DataObject<Model>,
                options?: HistoryOptions
            ): Promise<void> {
                if (options && options.crud) {
                    return super.replaceById(id, data, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter = {
                    id: id,
                    endDate: null,
                };

                await this.updateUnique(data, historyFilter);

                await this.updateHistory(data, true, historyFilter, options);
            }

            /**
             * Delete methods
             */
            private async deleteHistory(
                where: Where,
                options?: HistoryOptions
            ): Promise<Count> {
                /**
                 * where: {id:id,endDate:null}
                 * update(where) => endDate: $now
                 */
                return await super.updateAll(
                    { endDate: new Date() },
                    where as any,
                    options
                );
            }

            async delete(
                entity: Model,
                options?: HistoryOptions
            ): Promise<void> {
                if (options && options.crud) {
                    return super.delete(entity, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter = {
                    id: entity.id,
                    endDate: null,
                };

                await this.deleteHistory(historyFilter, options);
            }

            async deleteAll(
                where?: Where<Model>,
                options?: HistoryOptions
            ): Promise<Count> {
                if (options && options.crud) {
                    return super.deleteAll(where, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter;
                if (where) {
                    historyFilter = { and: [{ endDate: null }, where] };
                } else {
                    historyFilter = { endDate: null };
                }

                return await this.deleteHistory(historyFilter, options);
            }

            async deleteById(
                id: string,
                options?: HistoryOptions
            ): Promise<void> {
                if (options && options.crud) {
                    return super.deleteById(id, options);
                }

                /** Create history filter by endDate, id */
                let historyFilter = {
                    id: id,
                    endDate: null,
                };

                await this.deleteHistory(historyFilter, options);
            }
        }

        return Repository as any;
    };
}
