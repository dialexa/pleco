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
  model: ['atlima', 'sentra'] // implicit in
  numberOfUsers: { gt: 1000, lt: 1999 },
  {
    OR: [
      { highwayMPG: { gt: 30 } },
      { cityMPG: { gte: 20 } }
    ]
  },
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
