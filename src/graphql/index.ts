import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLScalarType,
  GraphQLString,
  printType,
} from 'graphql';

const commonFilterFields = (type: GraphQLScalarType) => ({
  in: { type: new GraphQLList(type) },
  nin: { type: new GraphQLList(type) },
  eq: { type },
  ne: { type },
});

const extendedFilterFields = (type: GraphQLScalarType) => ({
  ...commonFilterFields(type),
  gt: { type },
  lt: { type },
  gte: { type },
  lte: { type },
});

export const GraphQLFilterQueryFloat: GraphQLInputObjectType = new GraphQLInputObjectType({
  name: 'FilterQuery_Float',
  fields: () => ({
    ...extendedFilterFields(GraphQLFloat),
    AND: { type: new GraphQLList(GraphQLFilterQueryFloat) },
    OR: { type: new GraphQLList(GraphQLFilterQueryFloat) },
  }),
});

export const GraphQLFilterQueryID: GraphQLInputObjectType = new GraphQLInputObjectType({
  name: 'FilterQuery_ID',
  fields: () => ({
    ...commonFilterFields(GraphQLID),
    AND: { type: new GraphQLList(GraphQLFilterQueryID) },
    OR: { type: new GraphQLList(GraphQLFilterQueryID) },
  }),
});

export const GraphQLFilterQueryInt: GraphQLInputObjectType = new GraphQLInputObjectType({
  name: 'FilterQuery_Int',
  fields: () => ({
    ...extendedFilterFields(GraphQLInt),
    AND: { type: new GraphQLList(GraphQLFilterQueryInt) },
    OR: { type: new GraphQLList(GraphQLFilterQueryInt) },
  }),
});

export const GraphQLFilterQueryString: GraphQLInputObjectType = new GraphQLInputObjectType({
  name: 'FilterQuery_String',
  fields: () => ({
    ...extendedFilterFields(GraphQLString),
    AND: { type: new GraphQLList(GraphQLFilterQueryString) },
    OR: { type: new GraphQLList(GraphQLFilterQueryString) },
    contains: { type: GraphQLString },
  }),
});

export const GraphQLSortDirection: GraphQLEnumType = new GraphQLEnumType({
  name: 'SortDirection',
  values: {
    ASC: { value: 'ASC' },
    DESC: { value: 'DESC' },
  },
});

export const GraphQLLimitOffsetPage: GraphQLInputObjectType = new GraphQLInputObjectType({
  name: 'LimitOffsetPage',
  fields: {
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
  },
});

export const graphQLFilterTypes = [
  printType(GraphQLFilterQueryFloat),
  printType(GraphQLFilterQueryID),
  printType(GraphQLFilterQueryInt),
  printType(GraphQLFilterQueryString),
  printType(GraphQLSortDirection),
  printType(GraphQLLimitOffsetPage),
];
