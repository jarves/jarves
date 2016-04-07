<?php


use Doctrine\Common\Annotations\AnnotationRegistry;

$file = __DIR__.'/../vendor/autoload.php';
if (!file_exists($file)) {
    throw new RuntimeException('Install dependencies to run test suite.');
}

/** @var $autoload \Composer\Autoload\ClassLoader */
$autoload = include $file;

AnnotationRegistry::registerLoader(array($autoload, 'loadClass'));

$autoload->set('', realpath(__DIR__ . '/../../../'));
$autoload->set('', realpath(__DIR__ . '/Integration/skeletion/src/'));