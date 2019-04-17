# Contributing

## Testing
Have a localhost postgres database prepared with a database with the name `pleco_test`. The default `postgres` user should have
no password and access to this database. Alternatively, you can override the following environment variables

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DB=pleco_test
```

Then run the command
```
npm run test
```

To run tests for individual packages, check out the package.json, where you can find commands like
```
npm run test:core -> tests the pleco package
npm run test:joi -> tests the pleco-joi package
npm run test:knex -> tests the pleco-knex package
```

### Core Tests
For the core tests (pleco package), we are using the pleco-knex
implementation because this was developed first.
