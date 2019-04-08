# DB GraphQL Filter Knex

## Overview
db-graphql-filter-knex provides all the same exports as db-graphql-filter, but overrides the functions
for ease of use.

## Function Usage
### getFilterQuery
```ts
import { getFilterQuery } from 'db-graphql-filter-knex';

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
  builder = getFilterQuery({ filter, subqueries }, { knex, queryBuilder: builder });
});
```

### getSortQuery
Continuing from the code snippet for the [filter function](#getfilterquery)
```ts
import { getSortQuery } from 'db-graphql-filter-knex';

const sort = { userSurveyRating: 'asc' };

query = getSortQuery({ sort, subqueries }, { knex, queryBuilder: query });
```

### getPageLimitOffsetQuery
```ts
import { getPageLimitOffsetQuery  } from 'db-graphql-filter-knex';

let query = knex('vehicles');
// Page 3 with page sizes as 25
const page = { limit: 25, offset: 50 };

query = getPageLimitOffsetQuery(page, { knex, queryBuilder: query });
```
