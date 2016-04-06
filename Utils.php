<?php

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
            if (!$field->getFieldType()->isDiffAllowed()) {
                //todo, made $field->isDiffAllowed() as well
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
        if ($this->pageStack->getClient() && $this->pageStack->getClient()->getUser()) {
            if ($this->pageStack->getClient()->getUser()->getFirstName() || $this->pageStack->getClient()->getUser()->getLastName()) {
                $username = $this->pageStack->getClient()->getUser()->getFirstName();
                if ($username) $username .= ' ';
                $username .= $this->pageStack->getClient()->getUser()->getLastName();
            } else {
                $username = $this->pageStack->getClient()->getUser()->getUsername();
            }
        }

        $newsFeed = new \Jarves\Model\NewsFeed();
        $newsFeed->setUsername($username);
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
     * Returns Domain object
     *
     * @param int $domainId If not defined, it returns the current domain.
     *
     * @return \Jarves\Model\Domain
     */
    public function getDomain($domainId = null)
    {
        if (!$domainId) {
            return $this->pageStack->getCurrentDomain();
        }

        if ($domainSerialized = $this->cacher->getDistributedCache('core/object-domain/' . $domainId)) {
            return unserialize($domainSerialized);
        }

        $domain = Model\DomainQuery::create()->findPk($domainId);

        if (!$domain) {
            return false;
        }

        $this->cacher->setDistributedCache('core/object-domain/' . $domainId, serialize($domain));

        return $domain;
    }

    /**
     * @param        $nodeOrId
     * @param bool $fullUrl
     * @param bool $suppressStartNodeCheck
     * @param Domain $domain
     *
     * @return string
     */
    public function getNodeUrl($nodeOrId, $fullUrl = false, $suppressStartNodeCheck = false, Domain $domain = null)
    {
        $id = $nodeOrId;

        if (!$nodeOrId) {
            $nodeOrId = $this->pageStack->getCurrentPage();
        }

        if ($nodeOrId instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $domainId = $nodeOrId instanceof Node ? $nodeOrId->getDomainId() : $this->getDomainOfPage($id);
        $currentDomain = $domain ?: $this->pageStack->getCurrentDomain();

        if (!$suppressStartNodeCheck && $currentDomain->getStartnodeId() === $id) {
            $url = '/';
        } else {
            $urls = $this->getCachedPageToUrl($domainId);
            $url = isset($urls[$id]) ? $urls[$id] : '';
        }

        //do we need to add app_dev.php/ or something?
        $prefix = '';
        if ($request = $this->pageStack->getRequest()) {
            $prefix = substr(
                $request->getBaseUrl(),
                strlen($request->getBasePath())
            );
        }

        if (false !== $prefix) {
            $url = substr($prefix, 1) . $url;
        }

        if ($fullUrl || !$currentDomain || $domainId != $currentDomain->getId()) {
            $domain = $currentDomain ?: $this->getDomain($domainId);

            $domainName = $domain->getRealDomain();
            if ($domain->getMaster() != 1) {
                $url = $domainName . $domain->getPath() . $domain->getLang() . '/' . $url;
            } else {
                $url = $domainName . $domain->getPath() . $url;
            }

            $isSecure = $this->pageStack->getRequest() ? $this->pageStack->getRequest()->isSecure() : false;

            $url = 'http' . ($isSecure ? 's' : '') . '://' . $url;
        }

        //crop last /
        if (substr($url, -1) == '/') {
            $url = substr($url, 0, -1);
        }

        //crop first /
        if (substr($url, 0, 1) == '/') {
            $url = substr($url, 1);
        }

        if ($url == '/') {
            $url = '.';
        }

        return $url;
    }


    /**
     * Returns a super fast cached Page object.
     *
     * @param  int $pageId If not defined, it returns the current page.
     *
     * @return Node
     */
    public function getPage($pageId = null)
    {
        if (!$pageId) {
            return $this->pageStack->getCurrentPage();
        }

        $data = $this->cacher->getDistributedCache('core/object/node/' . $pageId);

        if (!$data) {
            $page = NodeQuery::create()->findPk($pageId);
            $this->cacher->setDistributedCache('core/object/node/' . $pageId, serialize($page));
        } else {
            $page = unserialize($data);
        }

        return $page ?: false;
    }

    /**
     * Returns the domain of the given $id page.
     *
     * @param  integer $id
     *
     * @return integer|null
     */
    public function getDomainOfPage($id)
    {
        $id2 = null;

        $page2Domain = $this->cacher->getDistributedCache('core/node/toDomains');

        if (!is_array($page2Domain)) {
            $page2Domain = $this->updatePage2DomainCache();
        }

        $id = ',' . $id . ',';
        foreach ($page2Domain as $domain_id => &$pages) {
            $pages = ',' . $pages . ',';
            if (strpos($pages, $id) !== false) {
                $id2 = $domain_id;
            }
        }

        return $id2;
    }

    public function updatePage2DomainCache()
    {
        $r2d = array();
        $items = NodeQuery::create()
            ->select(['Id', 'DomainId'])
            ->find();

        foreach ($items as $item) {
            $r2d[$item['DomainId']] = (isset($r2d[$item['DomainId']]) ? $r2d[$item['DomainId']] : '') . $item['Id'] . ',';
        }

        $this->cacher->setDistributedCache('core/node/toDomains', $r2d);

        return $r2d;
    }

    /**
     * Returns a array map nodeId -> url
     *
     * @param  integer $domainId
     *
     * @return array
     */
    public function getCachedPageToUrl($domainId)
    {
        return array_flip($this->getCachedUrlToPage($domainId));
    }

    /**
     * Returns a array map url -> nodeId
     *
     * @param integer $domainId
     *
     * @return array
     *
     * @throws \Propel\Runtime\Exception\PropelException
     */
    public function getCachedUrlToPage($domainId)
    {
        $cacheKey = 'core/urls/' . $domainId;
        $urls = $this->cacher->getDistributedCache($cacheKey);

        if (!$urls) {

            $nodes = NodeQuery::create()
                ->select(array('id', 'urn', 'lvl', 'type'))
                ->filterByDomainId($domainId)
                ->orderByBranch()
                ->find();

            //build urls array
            $urls = array();
            $level = array();

            foreach ($nodes as $node) {
                if ($node['lvl'] == 0) {
                    continue;
                } //root

                if ($node['type'] == 3) {
                    continue;
                } //deposit

                if ($node['type'] == 2 || $node['urn'] == '') {
                    //folder or empty url
                    $level[$node['lvl'] + 0] = isset($level[$node['lvl'] - 1]) ? $level[$node['lvl'] - 1] : '';
                    continue;
                }

                $url = isset($level[$node['lvl'] - 1]) ? $level[$node['lvl'] - 1] : '';
                $url .= '/' . $node['urn'];

                $level[$node['lvl'] + 0] = $url;

                $urls[$url] = $node['id'];
            }

            $this->cacher->setDistributedCache($cacheKey, $urls);
        }

        return $urls;
    }

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
