# ![Pleco logo](/assets/logo.svg)

# Pleco GraphQL

## Table of Contents
- [Overview](#overview)
- [GraphQL Types](#graphql-types)
  * [Provided Exports](#provided-exports)
    + [Notes](#notes)
  * [Usage](#usage)

## Overview
This library provides GraphQL types that can be used to form your own filter types

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

In addition to the 4 `FilterQuery_*` types, pleco-graphql also provides
- `SortDirection`: an enum of `ASC` and `DESC`
- `LimitOffsetPage`: an input object with limit and offset
- `graphQLTypes` which is a string containing the definitions of all the types in SDL.

All these exports were written using what they will appear as in SDL. The javascript objects are:

| SDL Name            | Javascript Export        |
|---------------------|--------------------------|
| FilterQuery\_ID     | GraphQLFilterQueryID     |
| FilterQuery\_String | GraphQLFilterQueryString |
| FilterQuery\_Int    | GraphQLFilterQueryInt    |
| FilterQuery\_Float  | GraphQLFilterQueryFloat  |
| SortDirection       | GraphQLSortDirection     |
| LimitOffsetPage     | GraphQLLimitOffsetPage   |

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
This will specify that the user wants all vehicles whose make is "nissan", who has between 1000-1999 users (exclusive),
whose user survey ratings is greater than or equal to 80.5
and whose MPG satisifies either highway strictly greater than 30mpg or city greater than or equal to 20mpg, and
sorted by userSurveyRating ascending.
