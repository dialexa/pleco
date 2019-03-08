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
