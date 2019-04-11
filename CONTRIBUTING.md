# Contributing

## Testing
Have a localhost postgres database prepared with a database with the name `querybuilder_graphql_filter_test`. The default `postgres` user should have
no password and access to this database. Additionally, you can override the following environment variables

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DB_NAME=querybuilder_graphql_filter_test
```

Then run the command
```
yarn test
```

To run tests for individual packages, check out the package.json, where you can find commands like
```
yarn test:core -> tests the db-graphql-filter package
yarn test:joi -> tests the db-graphql-filter-joi package
yarn test:knex -> tests the db-graphql-filter-knex package
```

### Core Tests
For the core tests (db-graphql-filter package), we are using the db-graphql-filter-knex
implementation because this was developed first.
