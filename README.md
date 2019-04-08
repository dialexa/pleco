# DB GraphQL Filter

## Overview
db-graphql-filter provides 4 things to make filtering easier with GraphQL on the database layer. The library
is inspired by MongoDB's filtering syntax.
1. [GraphQL Types](#graphql-types)
2. [Typescript Types](#typescript-types)
3. [Joi Validation Schemas](#joi-validation-schemas)
4. [Filtering, Sorting, Paginating Functions](#functions)
5. [Extensions](#extensions)

## GraphQL Types
All the GraphQL types can be found in `src/graphql/index.ts`. For each `GraphQLScalarType` (excluding `Boolean`),
which includes `ID`, `Int`, `String`, and `Float`, we provide a GraphQL type
allowing users to provide comparison operations like `in`, `lt`, `gt`, `eq`, as well as the nesting
abilities with `AND` and `OR`.

### Provided Exports
| operation | FilterQuery\_ID | FilterQuery\_String | FilterQuery\_Int | FilterQuery\_Float |
|-----------|-----------------|---------------------|------------------|--------------------|
| AND       | ✔               | ✔                   | ✔                | ✔                  |
| OR        | ✔               | ✔                   | ✔                | ✔                  |
| in        | ✔               | ✔                   | ✔                | ✔                  |
| nin       | ✔               | ✔                   | ✔                | ✔                  |
| eq        | ✔               | ✔                   | ✔                | ✔                  |
| ne        | ✔               | ✔                   | ✔                | ✔                  |
| gt        |                 | ✔                   | ✔                | ✔                  |
| lt        |                 | ✔                   | ✔                | ✔                  |
| gte       |                 | ✔                   | ✔                | ✔                  |
| lte       |                 | ✔                   | ✔                | ✔                  |
| contains  |                 | ✔                   |                  |                    |

In addition to the 4 `FilterQuery_*` types, db-graphql-filter also provides
- `SortDirection`: an enum of `ASC` and `DESC`
- `LimitOffsetPage`: an input object with limit and offset
- `graphQLFilterTypes` which is a string containing the definitions of all the types in SDL.

All these exports were written using what they will appear as in SDL. The javascript objects are:

| SDL Name            | Javascript Export        |
|---------------------|--------------------------|
| FilterQuery\_ID     | GraphQLFilterQueryID     |
| FilterQuery\_String | GraphQLFilterQueryString |
| FilterQuery\_Int    | GraphQLFilterQueryInt    |
| FilterQuery\_Float  | GraphQLFilterQueryFloat  |
| SortDirection       | GraphQLSortDirection     |
| LimitOffsetPagee    | GraphQLLimitOffsetPage   |

#### Notes
- `null` can be passed to `eq` and `ne` and will do a `whereNull` and `whereNotNull`, respectively
- `contains` is case insensitive

### Usage
Take the following GraphQL schema
```graphql
type Vehicle {
  make: String
  model: String
}

input VehicleFilterInput {
  AND: [VehicleFilterInput]
  OR: [VehicleFilterInput]

  "fields on the vehicle table"
  make: FilterQuery_String
  model: FilterQuery_String

  "fields not directly on the vehicle table"
  numberOfUsers: FilterQuery_Int
  highwayMPG: FilterQuery_Int
  cityMPG: FilterQuery_Int
  userSurveyRating: FilterQuery_Float
}

input VehicleSortInput {
  numberOfUsers: SortDirection
  userSurveyRating: SortDirection
}

type Query {
  vehicles(filter: VehicleFilterInput, sort: VehicleSortInput): [Vehicle]
}
```

Using this input, a user could construct the following filter query:
```graphql
query GetVehicles ($filter: VehicleFilterInput, $sort: VehicleSortInput) {
  vehicles (filter: $filter, sort: $sort) {
    make
    model
  }
}
```
with variables
```json
{
  "filter": {
    "AND": [
      { "make": { "eq": "nissan" } },
      { "numberOfUsers": { "AND": [{ "gt": 1000 }, { "lt": 1999 }] } },
      {
        "OR": [
          { "highwayMPG": { "gt": 30 } },
          { "cityMPG": { "gte": 20 } }
        ]
      },
      { "userSurveyRating": { "gte": 80.5 } }
    ]
  },
  "sort": {
    "userSurveyRating": "ASC"
  }
}
```
This will specify that hte user wants all vehicles whose make is "nissan", who has between 1000-1999 users (exclusive),
whose user survey ratings is greater than or equal to 80.5
and whose MPG satisifies either highway strictly greater than 30mpg or city greater than or equal to 20mpg, and
sorted by userSurveyRating ascending.
We see the flexibility and power that the user has with this infinitely nested syntax.

We will explore how we can filter by fields not on the vehicle table in the [functions section](#functions).

## Typescript Types
The typescript types can be found in `src/types/index.ts`. These act as a translation of the GraphQL types to typescript.

### Provided Exports
`GraphQLFilterTypes`: a union type of `string` and `number`, since all the provided GraphQL types are either strings or numbers in typescript.

`IFilterQuery<T>`: a generic interface that takes a type argument with a union type of all the GraphQL operations (in, nin, etc).
`IFilterQuery` assumes 1 operation per object. More about this in the [joi validation section](#joi-validation-schemas).

`SortDirection`: a union type of 'asc' and 'desc'

`ILimitOffsetPage`: an object containing limit and offset as numberse to provide pagination arguments

### Usage
If we wanted to translate the `VehicleFilterInput` GraphQL type to Typescript, this is what we would do:
```ts
import { IFilterQuery } from 'db-graphql-filter';

export interface IVehicleFilterInput {
  AND: IVehicleFilterInput[];
  OR: IVehicleFilterInput[];

  make: IFilterQuery<string>;
  model: IFilterQuery<string>;

  numberOfUsers: IFilterQuery<number>;
  highwayMPG: IFilterQuery<number>;
  cityMPG: IFilterQuery<number>;
  userSurveyRating: IFilterQuery<number>;
}
```

## Joi Validation Schemas
The joi validation schemas can be found in `src/joi/index.ts`. These provide additional protection around what the user inputs.

### Provided Exports
`filterQuerySchema`: a function that returns the schema pertaining to the `IFilterQuery` typescript type or the `FilterQuery_*` type.

The rules for filters are:
- each filter query can contain nested AND or OR
- the filter can only have what is provided in the GraphQL type according to the table in the [GraphQL section](#graphql-types)
- each filter object can only have one key
- the filter can be empty

#### Usage
```ts
import { filterQuerySchema } from 'db-graphql-filter';

const vehicleFilterSchemaKeys = {
  AND: Joi.array().items(Joi.lazy(() => vehicleFilterSchema)),
  OR: Joi.array().items(Joi.lazy(() => vehicleFilterSchema)),
  make: filterQuerySchema('String', Joi.string()),
  model: filterQuerySchema('String', Joi.string()),
  // We can define any Joi schema
  numberOfUsers: filterQuerySchema('Int', Joi.number().integer().min(0)),
  highwayMPG: filterQuerySchema('Int', Joi.number().integer().min(0)),
  cityMPG: filterQuerySchema('Int', Joi.number().integer().min(0)),
  userSurveyRating: filterQUerySchema('Float', Joi.number().min(0).max(100)),
};

const vehicleFilterSchema = Joi.object().keys(vehicleFilterSchemaKeys).oxor(Object.keys(vehicleFilterSchemaKeys));
```

`sortDirectionSchema`: validates that the argument to a sort operation is 'ASC' or 'DESC' (case insensitive).
Validating against this schema will also automatically convert the input to uppercase.

#### Usage
```ts
import { sortDirectionSchema } from 'db-graphql-filter';

const vehicleSortSchemaKeys = {
  numberOfUsers: sortDirectionSchema,
  userSurveyRating: sortDirectionSchema,
};

const vehicleSortSchema = Joi.object().keys(vehicleSortSchemaKeys).oxor(Object.keys(vehicleSortSchemaKeys));
```

`limitOffsetPageSchema`: validates that an object containing optional `limit` and `offset` are non-negative integers

## Functions
The functions that do all the heavy lifting are in `src/functions/index.ts`. Refer to each querybuilder implementation's
package to view the usage for each function.

### Prerequisites
Before we dive into the functions that are provided, `db-graphql-filter` has some prerequisites
that must be met for the functions to work. Because of the nature of supporting multiple query builders,
extensions must be used to properly call the methods. To convert your query builder to the generic
query builder that `db-graphql-filter` uses, refer to the extension library documentation.

For more information about the generic query builder, refer to the [Extensions section](#extensions)

Note that all of the examples in this README are using the `db-graphql-filter-knex` extension.

### getFilterQuery
This function forms the filter query. The arguments are
- `args`: an object with
  - `filter`: the filter object of the form we have been using so far
  - `subqueries`: a record of subqueries that maps the filter i.e. numberOfUsers to a query
- `query`: the query builder to build off of

#### Subquery Guidelines
1. It is recommended for the subquery result to have as many rows as rows in the base table.
   This means defining defaults or setting some values as NULL for some rows.
2. All subqueries must return the following columns named exactly like this:
     - resource_id: the id of the resource being queried i.e. the id column.
     - value: the value that is being matched against the filter for the resource with the resource_id
     - sort: the value that is used to determine sort order (often the same as value). If you know that
             you will not be sorting using this subquery, there is no need to have the sort column
3. Every field that is passed in to the filter function should have a subquery associated with it. If there
   are fields that do not have any subqueries that you need to filter by, this must be handled outside of
   the filter library.

#### Usage
See db-graphql-filter-[querybuilder-name]

### getSortQuery
This function provides sorting functionality. Currently, sorting by, then by is not supported.

#### Usage
See db-graphql-filter-[querybuilder-name]

### getPageLimitOffsetQuery
This function returns a query with `limit` and `offset`. Empty options can
also be passed, so it is safe to call `formPageLimitOffsetQuery` even
with bogus options.

#### Usage
See db-graphql-filter-[querybuilder-name]

## Extensions
`db-graphql-filter` is able to support multiple query builders by providing a generic, minimal `IQueryBuilder`
interface that only requires a subset of a full query builder features. To support another query builder,
all that is needed is to implement the features needed in the required query builder.

Converting from the query builder you are using to an instance of an extension depends on the extension,
but all extensions will convert back to your query builder by calling `.build()`.

Current supported query builders:

| library | db-graphql-filter extension |
|---------|-----------------------------|
| knex    | db-graphql-filter-knex      |

## Recipes
### Automating the Creation of Subqueries for Each Column
It is tedious to have to make subqueries for each column manually. We have found use in the following for postgres + knex:
```ts
const columnNames = await knex('vehicles').columnInfo().then(Object.keys);

const subqueries = {};
columnNames.forEach(column => {
  subqueries[convertToCamelcase(column)] = knex('vehicles').select(
    'id as resource_id',
    knex.raw('?? as value', [ column ]),
    knex.raw('?? as sort', [ column ]),
  )
});
```

## Known Limitations
1. Cursor pagination is currently unsupported
2. The id column must be named `id`
3. Multiple sorts is not supported
