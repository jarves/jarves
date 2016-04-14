<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

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

Propel\Runtime\Propel::disableInstancePooling();