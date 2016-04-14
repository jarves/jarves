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

namespace Jarves;

use Icap\HtmlDiff\HtmlDiff;
use Jarves\Cache\Cacher;
use Jarves\Filesystem\Filesystem;
use Jarves\Model\AppLockQuery;
use Jarves\Model\Base\NodeQuery;
use Jarves\Model\Domain;
use Jarves\Model\Node;

class Utils
{
    protected $cachedPageToUrl = [];

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var Filesystem
     */
    protected $webFilesystem;

    /**
     * @var Filesystem
     */
    protected $localFilesystem;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * Utils constructor.
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param Filesystem $localFilesystem
     * @param Filesystem $webFilesystem
     * @param Cacher $cacher
     */
    function __construct(Jarves $jarves, PageStack $pageStack, Filesystem $localFilesystem, Filesystem $webFilesystem, Cacher $cacher)
    {
        $this->jarves = $jarves;
        $this->localFilesystem = $localFilesystem;
        $this->webFilesystem = $webFilesystem;
        $this->cacher = $cacher;
        $this->pageStack = $pageStack;
    }

    /**
     * @param Objects $repo
     * @param $objectKey
     * @param $origItem
     * @return string
     */
    protected function generateDiff(Objects $repo, $objectKey, $origItem)
    {
        $pk = $repo->getObjectPk($objectKey, $origItem);
        $currentItem = $repo->get($objectKey, $pk);
        $definition = $repo->getDefinition($objectKey);

        $changes = [];
        foreach ($definition->getFields() as $field) {
            if ($field->hasFieldType() && !$field->getFieldType()->isDiffAllowed()) {
                //todo, check $field->isDiffAllowed() as well
                continue;
            }

            $k = $field->getId();
            if (!isset($origItem[$k]) || !isset($currentItem[$k])) {
                continue;
            }

            if (!is_string($origItem[$k]) && !is_numeric($origItem[$k])) {
                continue;
            }

            if (!is_string($currentItem[$k]) && !is_numeric($currentItem[$k])) {
                continue;
            }

            $from = strip_tags($origItem[$k]);
            $to = strip_tags($currentItem[$k]);

            if ($from != $to) {
                $htmlDiff = new HtmlDiff($from, $to, true);
                $out = $htmlDiff->outputDiff();
                $changes[$k] = $out->toString();
            }
        }

        $message = [];
        foreach ($changes as $changedKey => $diff) {
            if ($field = $definition->getField($changedKey)) {
                $message[] = ($field->getLabel() ?: $field->getId()) . ': ' . $diff;
            }
        }

        return $message ? '<div class="change">' . implode('</div><div class="change">', $message) . '</div>' : '';
    }

    /**
     * Adds a new news-feed entry. If not message (means null) is passed we generate a diff.
     *
     * @param Objects $repo
     * @param string $objectKey
     * @param array $item
     * @param string $verb
     * @param string|null $message
     * @throws \Propel\Runtime\Exception\PropelException
     */
    public function newNewsFeed(Objects $repo, $objectKey, $item, $verb, $message = null)
    {
        $definition = $repo->getDefinition($objectKey);

        $itemLabel = '';
        if ($labelField = $definition->getLabelField()) {
            $itemLabel = $item[$labelField];
        }

        if (!$itemLabel) {
            $pks = $definition->getPrimaryKeys();
            $itemLabel = '#' . $item[$pks[0]->getId()];
        }

        $username = '[Unknown]';
        $userId = 0;
        if ($user = $this->pageStack->getUser()) {
            $userId = $user->getId();

            if ($user->getFirstName() || $user->getLastName()) {
                $username = $user->getFirstName();
                if ($username) $username .= ' ';
                $username .= $user->getLastName();
            } else {
                $username = $user->getUsername();
            }
        }

        $newsFeed = new \Jarves\Model\NewsFeed();
        $newsFeed->setUsername($username);
        $newsFeed->setUserId($userId);
        $newsFeed->setVerb($verb);

        $newsFeed->setTargetObject($objectKey);
        $newsFeed->setTargetPk($repo->getObjectUrlId($objectKey, $item));
        $newsFeed->setTargetLabel($itemLabel);
        $newsFeed->setCreated(time());
        $newsFeed->setMessage(null === $message ? $this->generateDiff($repo, $objectKey, $item) : $message);
        $newsFeed->save();
    }

    public function getComposerArray($bundleClass)
    {
        $path = $this->jarves->getBundleDir($bundleClass);
        $fs = $this->localFilesystem;
        if ($fs->has($file = $path . '/composer.json')) {
            return json_decode($fs->read($file), true);
        }
    }

//    /**
//     * @param string $text
//     */
//    public function showFullDebug($text = null)
//    {
//        $exception = new \Exception();
//        $exception->setMessage($text ?: 'Debug stop.');
//
//        static::exceptionHandler($exception);
//    }

    /**
     * @param array $files
     * @param string $includePath The directory where to compressed css is. with trailing slash!
     *
     * @return string
     */
    public function compressCss(array $files, $includePath = '')
    {
        $webDir = realpath($this->jarves->getRootDir() . '/../web') . '/';
        $content = '';
        foreach ($files as $assetPath) {

            $cssFile = $this->jarves->resolvePublicWebPath($assetPath); //bundles/jarves/css/style.css
            $cssDir = dirname($cssFile) . '/'; //admin/css/...
            $cssDir = str_repeat('../', substr_count($includePath, '/')) . $cssDir;

            $content .= "\n\n/* file: $assetPath */\n\n";
            if (file_exists($file = $webDir . $cssFile)) {
                $h = fopen($file, "r");
                if ($h) {
                    while (!feof($h) && $h) {
                        $buffer = fgets($h, 4096);

                        $buffer = preg_replace('/@import \'(?!.*:\/\/)([^\/].*)\'/', '@import \'' . $cssDir . '$1\'', $buffer);
                        $buffer = preg_replace('/@import "(?!.*:\/\/)([^\/].*)"/', '@import "' . $cssDir . '$1"', $buffer);
                        $buffer = preg_replace('/url\(\'(?!.*:\/\/)([^\/][^\)]*)\'\)/', 'url(\'' . $cssDir . '$1\')', $buffer);
                        $buffer = preg_replace('/url\(\"(?!.*:\/\/)([^\/][^\)]*)\"\)/', 'url(\"' . $cssDir . '$1\")', $buffer);
                        $buffer = preg_replace('/url\((?!.*data:image)(?!.*:\/\/)([^\/\'].*)\)/', 'url(' . $cssDir . '$1)', $buffer);

                        $buffer = str_replace(array('  ', '    ', "\t", "\n", "\r"), '', $buffer);
                        $buffer = str_replace(': ', ':', $buffer);

                        $content .= $buffer;
                    }
                    fclose($h);
                }
            } else {
                $content .= '/* => `' . $cssFile . '` not exist. */';
            }
        }

        return $content;
    }

    public function compressJs(array $assets, $targetPath)
    {
        $oFile = $targetPath;

        $files = [];
        $md5String = '';
        $newestMTime = 0;

        foreach ($assets as $assetPath) {

            $path = $this->jarves->resolveWebPath($assetPath);
            $files[] = '--js ' . escapeshellarg($path);
            $mtime = filemtime($path);
            $newestMTime = max($newestMTime, $mtime);
            $md5String .= ">$path.$mtime<";
        }

        $sourceMap = $oFile . '.map';
        $cmdTest = 'java -version 2>&1';
        $closure = 'vendor/google/closure-compiler/compiler.jar';
        $compiler = escapeshellarg(realpath('../' . $closure));
        $cmd = 'java -jar ' . $compiler . ' --js_output_file ' . escapeshellarg('web/' . $oFile);
        $returnVal = 0;
        $debugMode = false;

        $handle = @fopen($oFile, 'r');
        $fileUpToDate = false;
        $md5Line = '//' . md5($md5String) . "\n";

        if ($handle) {
            $line = fgets($handle);
            fclose($handle);
            if ($line === $md5Line) {
                $fileUpToDate = true;
            }
        }

        if (false && $fileUpToDate) {
            return true;
        } else {
            if (!$debugMode) {
                exec($cmdTest, $outputTest, $returnVal);
            }

            if (0 === $returnVal) {
                $cmd .= ' --create_source_map ' . escapeshellarg('web/' . $sourceMap);
                $cmd .= ' --source_map_format=V3';

                $cmd .= ' ' . implode(' ', $files);
                $cmd .= ' 2>&1';
                $output = [];
                exec($cmd, $output, $returnVal);
                if (0 === $returnVal) {
//                    if (false === strpos($output, 'ERROR - Parse error')) {
                    $content = file_get_contents('web/' . $oFile);
                    $sourceMapUrl = '//@ sourceMappingURL=' . basename($sourceMap);
                    $content = $md5Line . $content . $sourceMapUrl;
                    file_put_contents('web/' . $oFile, $content);
                    return true;
//                    }
                }

            }

            $content = '';
            foreach ($assets as $assetPath) {
                $content .= "\n/* $assetPath */\n\n";
                $path = $this->jarves->resolveWebPath($assetPath);
                $content .= file_get_contents($path);
            }

            if ($content) {
                $this->webFilesystem->write($oFile, $content);
                return true;
            }

            return false;
        }
    }

}
