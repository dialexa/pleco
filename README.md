# Knex GraphQL Filter

## Overview
knex-graphql-filter provides 4 things to make filtering easier with a knex, GraphQL stack. The library
is inspired by MongoDB's filtering syntax.
1. [GraphQL Types](#graphql-types)
2. [Typescript Types](#typescript-types)
3. [Joi Validation Schemas](#joi-validation-schemas)
4. [Filtering, Sorting, Paginating Functions](#functions)

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

In addition to the 4 `FilterQuery_*` types, knex-graphql-filter also provides
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
import { IFilterQuery } from 'knex-graphql-filter';

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
The rules for filters are:
- each filter query can contain nested AND or OR
- the filter can only have what is provided in the GraphQL type according to the table in the [GraphQL section](#graphql-types)
- each filter object can only have one key
- the filter can be empty

### Provided Exports
`filterQuerySchema`: a function that returns the schema pertaining to the `IFilterQuery` typescript type or the `FilterQuery_*` type.

#### Usage
```ts
import { filterQuerySchema } from 'knex-graphql-filter';

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
import { sortDirectionSchema } from 'knex-graphql-filter';

const vehicleSortSchemaKeys = {
  numberOfUsers: sortDirectionSchema,
  userSurveyRating: sortDirectionSchema,
};

const vehicleSortSchema = Joi.object().keys(vehicleSortSchemaKeys).oxor(Object.keys(vehicleSortSchemaKeys));
```

`limitOffsetPageSchema`: validates that an object containing optional `limit` and `offset` are non-negative integers

## Functions
The functions that do all the heavy lifting are in `src/functions/index.ts`.

### `formFilterQuery(knex: Knex, query: Knex.QueryBuilder, filter: IFilter, subqueries: Record<string, Knex.QueryBuilder>): Knex.QueryBuilder`
This function forms the filter query. The arguments are
- `knex`: the instance of Knex to use for raw queries
- `query`: the query builder to add the `WHERE` clauses to
- `filter`: the filter object (more info in usage)
- `subqueries`: a dictionary of subquery name to knex queries

#### Subquery Guidelines
1. It is recommended for the subquery result to have as many rows as rows in the base table.
   This means defining defaults or setting some values as NULL. An example of this is calculating
   survey mood for users. Not all users have surveys, but if they do not have any surveys, they
   should still have what we consider to be "neutral" survey mood. When filtering by neutral survey
   mood, if we do not include these NULL rows, then we will miss these users.
2. All subqueries must return the following columns named exactly like this:
     - resource_id: the id of the resource being queried i.e. the id column.
     - value: the value that is being matched against the filter for the resource with the resource_id
     - sort: the value that is used to determine sort order (often the same as value). If you know that
             you will not be sorting using this subquery, there is no need to have the sort column
3. Every field that is passed in to the filter function should have a subquery associated with it. If there
   are fields that do not have any subqueries that you need to filter by, this must be handled outside of
   the filter library.

#### Usage
```ts
import { formFilterQuery } from 'knex-graphql-filter';

// See Recipes section to see how to automate these trivial subqueries
const make = knex('vehicles').select('id as resource_id', 'make as value', 'make as sort');
const model = knex('vehicles').select('id as resource_id', 'model as value', 'model as sort');

// Create our subqueries
const numberOfUsers = knex
  .select('vehicles.id as resource_id', 'count(*) as value', 'count(*) as sort')
  .from('vehicles')
  .leftJoin('vehicles_users', 'vehicles_users.vehicle_id', 'vehicles.id') // left join so we don't lose vehicles that don't have users
  .groupBy('vehicles');

... // Subqueries for the other filter fields

const subqueries = {
  make,
  model,
  numberOfUsers,
  ...
};

const filter = {
  AND: [
    AND: [
      { make: { eq: "nissan" } },
      { numberOfUsers: { AND: [{ gt: 1000 }, { lt: 1999 }] } },
      {
        OR: [
          { highwayMPG: { gt: 30 } },
          { cityMPG: { gte: 20 } }
        ]
      },
      { userSurveyRating: { gte: 80.5 } }
    ]
  ]
};

let query = knex('vehicles').where(builder => {
  builder = formFilterQuery(knex, builder, filter, subqueries);
});
```

### `getSortQuery(knex: Knex, query: Knex.QueryBuilder, sort: Record<string, SortDirection>, subqueries: Record<string, Knex.QueryBuilder>): Knex.QueryBuilder`
This function provides sorting functionality. It returns a Knex.QueryBuilder because the implementation
wraps the existing query in another query. The reason for this is because we cannot sort by fields
we are not selecting if we are using `DISTINCT`.

#### Usage
Continuing from the code snippet for the [filter function](#usage-2)
```ts
import { getSortQuery } from 'knex-graphql-filter';

const sort = { userSurveyRating: 'asc' };

query = getSortQuery(knex, query, sort, subqueries);
```

### `formPageLimitOffsetQuery(knex: Knex, query: Knex.QueryBuilder, page: ILimitOffsetPage): Knex.QueryBuilder`
This function returns a query with `limit` and `offset`. Empty options can
also be passed, so it is safe to call `formPageLimitOffsetQuery` even
with bogus options.

#### Usage
```ts
import { formPageLimitOffsetQuery } from 'knex-graphql-filter';

let query = knex('vehicles');
// Page 3 with page sizes as 25
const page = { limit: 25, offset: 50 };

query = formPageLimitOffsetQuery(knex, query, page);
```

## Recipes
### Automating the Creation of Subqueries for Each Column
It is tedious to have to make subqueries for each column manually. We have found use in the following for postgres:
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
