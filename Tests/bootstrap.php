<?php

use Doctrine\Common\Annotations\AnnotationRegistry;
use Composer\Autoload\ClassLoader;

$file = __DIR__.'/../vendor/autoload.php';
if (!file_exists($file)) {
    throw new RuntimeException('Install dependencies to run test suite.');
}

/** @var $autoload \Composer\Autoload\ClassLoader */
$autoload = require_once $file;

AnnotationRegistry::registerLoader(array($autoload, 'loadClass'));

$autoload->add('', realpath(__DIR__ . '/../../../'));
$autoload->add('', realpath(__DIR__ . '/Integration/skeletion/src/'));