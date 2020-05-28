# ![Pleco logo](/assets/logo.svg)

# Pleco Knex

## Table of Contents
- [Overview](#overview)
- [Function Usage](#function-usage)
  * [getFilterQuery](#getfilterquery)
  * [getSortQuery](#getsortquery)
  * [getPageLimitOffsetQuery](#getpagelimitoffsetquery)
- [Recipes](#recipes)
  * [Automating the Creation of Subqueries for Each Column](#automating-the-creation-of-subqueries-for-each-column)

## Overview
pleco-knex provides all the same exports as pleco, but overrides the functions
for ease of use.

## Function Usage
### getFilterQuery
```ts
import { getFilterQuery } from '@dialexa/pleco-knex';

// Suppose vehicles has the columns id, make, model, highwayMPG, cityMPG
// Note that you do not have to create subqueries for columns that exist on the table already

// Create our subqueries
const numberOfUsers = knex
  .select('vehicles.id as resource_id', 'count(*) as value', 'count(*) as sort')
  .from('vehicles')
  .leftJoin('vehicles_users', 'vehicles_users.vehicle_id', 'vehicles.id') // left join so we don't lose vehicles that don't have users
  .groupBy('vehicles');

... // Subqueries for the other filter fields

const subqueries = {
  numberOfUsers,
  ...
};

const filter = {
  AND: [
    { make: { eq: 'nissan' } },
    { model: { in: ['altima', 'sentra'] } },
    { numberOfUsers: { AND: [{ gt: 1000 }, { lt: 1999 }] } },
    {
      OR: [
        { highwayMPG: { gt: 30 } },
        { cityMPG: { gte: 20 } }
      ]
    },
    { userSurveyRating: { gte: 80.5 } }
  ]
};

let query = knex('vehicles').where(builder =>
  // mutate tells us to edit the builder object passed by reference instead of cloning
  getFilterQuery({ filter, subqueries }, { knex, query: builder, mutate: true });
);
```

Additionally, you can denote filter as
```ts
const filter = { // implicit AND
  make: 'nissan', // implicit eq
  model: ['atlima', 'sentra'], // implicit in
  numberOfUsers: { gt: 1000, lt: 1999 },
  OR: [
    { highwayMPG: { gt: 30 } },
    { cityMPG: { gte: 20 } }
  ],
  userSurveyRating: { gte: 80.5 }
}
```

### getSortQuery
Continuing from the code snippet for the [filter function](#getfilterquery). Note that due to the
way that the sort query is generated, passing `mutate: true` will not mutate the original query.
```ts
import { getSortQuery } from '@dialexa/pleco-knex';

const sort = { userSurveyRating: 'ASC' };

query = getSortQuery({ sort, subqueries }, { knex, query });
```

### getPageLimitOffsetQuery
```ts
import { getPageLimitOffsetQuery  } from '@dialexa/pleco-knex';

let query = knex('vehicles');
// Page 3 with page sizes as 25
const page = { limit: 25, offset: 50 };

query = getPageLimitOffsetQuery(page, { knex, query });
```

## Notes on Subqueries
Due to how flexible the library is for filtering arbitrary data, the generated
SQL can be quite large. If just filtering on columns on the table, it is
recommended to not include a subquery for the column. If not subquery is found
for a filter key, the library will assume the filter key is a column on the
table. For example:
```ts
// vehicles has make and model columns
import { getFilterQuery } from '@dialexa/pleco-knex';

const filter = {
  make: 'nissan',
  model: 'altima',
};

let query = knex('vehicles').where(builder =>
  getFilterQuery({ filter }, { knex, query: builder, mutate: true });
```
