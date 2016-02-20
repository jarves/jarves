# Test Suite

- Preparing the database and models:

```bash
  Tests/Integration/skeletion/app/console jarves:configuration:database --help
  Tests/Integration/skeletion/app/console jarves:models:build
  Tests/Integration/skeletion/app/console jarves:install:demo localhost /
```

- Fire `phpunit`.