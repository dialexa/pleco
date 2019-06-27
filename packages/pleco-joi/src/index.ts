import Joi from 'joi';

type GraphQLFilterScalar = 'Boolean' | 'ID' | 'String' | 'Int' | 'Float';

const filterInputBasicSchema = (joiType: Joi.Schema): object => ({
  in: Joi.array().items(joiType),
  nin: Joi.array().items(joiType),
  eq: joiType.allow(null),
  ne: joiType.allow(null),
});

const filterInputExtendedSchema = (joiType: Joi.Schema): object => ({
  ...filterInputBasicSchema(joiType),
  gt: joiType,
  lt: joiType,
  gte: joiType,
  lte: joiType,
});

const filterInputStringSchema = (joiType: Joi.Schema): object => ({
  ...filterInputExtendedSchema(joiType),
  contains: joiType,
});

const filterInputSchemas = (joiType: Joi.Schema): object => ({
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
