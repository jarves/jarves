# Test Suite

- Preparing the database and models:

```bash
  php Tests/Integration/skeletion/app/console jarves:configuration:database --help
  
  php Tests/Integration/skeletion/app/console propel:model:build
  php Tests/Integration/skeletion/app/console propel:migration:diff
  php Tests/Integration/skeletion/app/console propel:migration:up
  
  php Tests/Integration/skeletion/app/console jarves:install:demo localhost /
  rm -rf Tests/Integration/skeletion/app/cache/*
```

- Fire `vendor/bin/phpunit`.