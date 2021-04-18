import Joi from '@hapi/joi';

type GraphQLFilterScalar = 'Boolean' | 'ID' | 'String' | 'Int' | 'Float';

interface IFilterInputBasicSchema {
  in: Joi.Schema;
  nin: Joi.Schema;
  eq: Joi.Schema;
  ne: Joi.Schema;
}

const filterInputBasicSchema = (joiType: Joi.Schema): IFilterInputBasicSchema => ({
  in: Joi.array().items(joiType),
  nin: Joi.array().items(joiType),
  eq: joiType.allow(null),
  ne: joiType.allow(null),
});

interface IFilterInputExtendedSchema extends IFilterInputBasicSchema {
  gt: Joi.Schema;
  lt: Joi.Schema;
  gte: Joi.Schema;
  lte: Joi.Schema;
}

const filterInputExtendedSchema = (joiType: Joi.Schema): IFilterInputExtendedSchema => ({
  ...filterInputBasicSchema(joiType),
  gt: joiType,
  lt: joiType,
  gte: joiType,
  lte: joiType,
});

interface IFilterInputStringSchema extends IFilterInputExtendedSchema {
  contains: Joi.Schema;
}

const filterInputStringSchema = (joiType: Joi.Schema): IFilterInputStringSchema => ({
  ...filterInputExtendedSchema(joiType),
  contains: joiType,
});

interface IFilterInputSchema {
  Boolean: IFilterInputBasicSchema;
  Float: IFilterInputExtendedSchema;
  ID: IFilterInputBasicSchema;
  Int: IFilterInputExtendedSchema;
  String: IFilterInputStringSchema;
}

const filterInputSchemas = (joiType: Joi.Schema): IFilterInputSchema => ({
  Boolean: filterInputBasicSchema(joiType),
  Float: filterInputExtendedSchema(joiType),
  ID: filterInputBasicSchema(joiType),
  Int: filterInputExtendedSchema(joiType),
  String: filterInputStringSchema(joiType),
});

export const filterQuerySchema = (graphQLType: GraphQLFilterScalar, joiType: Joi.Schema): Joi.SchemaLike =>
  Joi.alternatives().try([
    Joi.object().keys({
      AND: Joi.lazy(() => Joi.array().items(filterQuerySchema(graphQLType, joiType))),
      OR: Joi.lazy(() => Joi.array().items(filterQuerySchema(graphQLType, joiType))),
      ...filterInputSchemas(joiType)[graphQLType],
    }),
    joiType,
    Joi.array().items(joiType),
  ]);

export const sortDirectionSchema = Joi.string().valid(['asc', 'desc']).insensitive().uppercase();

export const limitOffsetPageSchema = Joi.object().keys({
  limit: Joi.number().integer().min(0),
  offset: Joi.number().integer().min(0),
});
