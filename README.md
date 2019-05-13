# Pleco

![Pleco logo](assets/logo.svg)

[![CircleCI](https://circleci.com/gh/dialexa/pleco/tree/master.svg?style=svg&circle-token=94bf2e6d0f46c7e3f4937d8d1acb59fb02b94d0c)](https://circleci.com/gh/dialexa/pleco/tree/master)

## Table of Contents
- [Overview](#overview)
- [Functions](#functions)
  * [Prerequisites](#prerequisites)
  * [getFilterQuery](#getfilterquery)
    + [Subquery Guidelines](#subquery-guidelines)
    + [Usage](#usage)
  * [getSortQuery](#getsortquery)
    + [Usage](#usage-1)
  * [getPageLimitOffsetQuery](#getpagelimitoffsetquery)
    + [Usage](#usage-2)
- [Typescript Types](#typescript-types)
  * [Provided Exports](#provided-exports)
  * [Usage](#usage-3)
- [Extensions](#extensions)
- [Known Limitations](#known-limitations)

## Overview
The pleco libraries provide helpful utilities to make querying on the database layer easier. The library provides
typescript types, GraphQL types, and Joi validation types for filtering, sorting, and paging as well as functions to
perform those operations.

## Functions
The functions that do all the heavy lifting are in `src/functions/index.ts`. Refer to each querybuilder implementation's
package to view the usage for each function.

### Prerequisites
Before we dive into the functions that are provided, `pleco` has some prerequisites
that must be met for the functions to work. Because of the nature of supporting multiple query builders,
extensions must be used to properly call the methods. To convert your query builder to the generic
query builder that `pleco` uses, refer to the extension library documentation.

For more information about the generic query builder, refer to the [Extensions section](#extensions)

Note that all of the examples in this README are using the `pleco-knex` extension.

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
See [pleco-querybuilder-name](#extensions)

### getSortQuery
This function provides sorting functionality. Currently, sorting by, then by is not supported.

#### Usage
See [pleco-querybuilder-name](#extensions)

### getPageLimitOffsetQuery
This function returns a query with `limit` and `offset`. Empty options can
also be passed, so it is safe to call `formPageLimitOffsetQuery` even
with bogus options.

#### Usage
See [pleco-querybuilder-name](#extensions)

## Typescript Types
The typescript types can be found in `src/types/index.ts`.

### Provided Exports
`IFilterQuery<T>`: a generic interface that takes a type argument with a union type of all the supported operations (in, nin, etc).
`IFilterQuery` assumes 1 operation per object.

`SortDirection`: a union type of 'asc' and 'desc'

`ILimitOffsetPage`: an object containing limit and offset as numberse to provide pagination arguments

### Usage
```ts
import { IFilterQuery } from '@dialexa/pleco';

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

## Extensions
`pleco` is able to support multiple query builders by providing a generic, minimal `IQueryBuilder`
interface that only requires a subset of a full query builder features. To support another query builder,
all that is needed is to implement the features needed in the required query builder.

Converting from the query builder you are using to an instance of an extension depends on the extension,
but all extensions will convert back to your query builder by calling `.build()`.

Current supported query builders:

| library | pleco extension |
|---------|-----------------------------|
| knex    | [pleco-knex](https://github.com/dialexa/pleco/tree/master/packages/pleco-knex) |

## Known Limitations
1. Cursor pagination is currently unsupported
2. The id column must be named `id`
3. Multiple sorts is not supported

As always, check the Issues
