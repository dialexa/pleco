# Contributing

## Testing
Have a localhost postgres database prepared with a database with the name `db_query_utils_test`. The default `postgres` user should have
no password and access to this database. Alternatively, you can override the following environment variables

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DB=db_query_utils_test
```

Then run the command
```
npm run test
```

To run tests for individual packages, check out the package.json, where you can find commands like
```
npm run test:core -> tests the db-query-utils package
npm run test:joi -> tests the db-query-utils-joi package
npm run test:knex -> tests the db-query-utils-knex package
```

### Core Tests
For the core tests (db-query-utils package), we are using the db-query-utils-knex
implementation because this was developed first.
