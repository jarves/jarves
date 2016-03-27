# Test Suite

- Preparing the database and models:

```bash
  Tests/Integration/skeletion/app/console jarves:configuration:database --help
  
  Tests/Integration/skeletion/app/console propel:model:build
  Tests/Integration/skeletion/app/console propel:migration:diff
  Tests/Integration/skeletion/app/console propel:migration:up
  
  Tests/Integration/skeletion/app/console jarves:install:demo localhost /
```

- Fire `phpunit`.