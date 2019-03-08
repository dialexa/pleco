import Joi from 'joi';

import { GraphQLFilterScalar } from '../types';

const filterInputBasicSchema = (joiType: Joi.Schema) => ({
  in: Joi.array().items(joiType),
  nin: Joi.array().items(joiType),
  eq: joiType.allow(null),
  ne: joiType.allow(null),
});

const filterInputExtendedSchema = (joiType: Joi.Schema) => ({
  ...filterInputBasicSchema(joiType),
  gt: joiType,
  lt: joiType,
  gte: joiType,
  lte: joiType,
});

const filterInputStringSchema = (joiType: Joi.Schema) => ({
  ...filterInputExtendedSchema(joiType),
  contains: joiType,
});

const filterInputSchemas = (joiType: Joi.Schema) => ({
  Float: filterInputExtendedSchema(joiType),
  ID: filterInputBasicSchema(joiType),
  Int: filterInputExtendedSchema(joiType),
  String: filterInputStringSchema(joiType),
});

export const filterQuerySchema = (graphQLType: GraphQLFilterScalar, joiType: Joi.Schema): Joi.SchemaLike => Joi.object().keys({
  AND: Joi.lazy(() => Joi.array().items(filterQuerySchema(graphQLType, joiType))),
  OR: Joi.lazy(() => Joi.array().items(filterQuerySchema(graphQLType, joiType))),
  ...filterInputSchemas(joiType)[graphQLType],
}).oxor(...['AND', 'OR', ...Object.keys(filterInputSchemas(joiType)[graphQLType])]);

export const sortDirectionSchema = Joi.string().valid(['asc', 'desc']).insensitive().uppercase();

export const limitOffsetPageSchema = Joi.object().keys({
  limit: Joi.number().integer().min(0),
  offset: Joi.number().integer().min(0),
});
