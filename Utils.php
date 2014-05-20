<?php

namespace Jarves;

use Icap\HtmlDiff\HtmlDiff;
use Jarves\Model\AppLockQuery;
use Jarves\Model\Base\NodeQuery;
use Symfony\Component\HttpFoundation\Response;

class Utils
{
    protected $cachedPageToUrl = [];

    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    protected function generateDiff($objectKey, $origItem)
    {
        $repo = $this->getJarves()->getObjects();
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
                $message[] = ($field->getLabel() ?: $field->getId()).': '.$diff;
            }
        }

        return $message ? '<div class="change">'.implode('</div><div class="change">', $message).'</div>' : '';
    }

    /**
     * Adds a new news-feed entry. If not message (means null) is passed we generate a diff.
     *
     * @param string $objectKey
     * @param array $item
     * @param string $verb
     * @param string|null $message
     */
    public function newNewsFeed($objectKey, $item, $verb, $message = null)
    {
        $repo = $this->getJarves()->getObjects();
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
        if ($this->getJarves()->getClient() && $this->getJarves()->getClient()->getUser()) {
            if ($this->getJarves()->getClient()->getUser()->getFirstName() || $this->getJarves()->getClient()->getUser()->getLastName()) {
                $username = $this->getJarves()->getClient()->getUser()->getFirstName();
                if ($username) $username .= ' ';
                $username .= $this->getJarves()->getClient()->getUser()->getLastName();
            } else {
                $username = $this->getJarves()->getClient()->getUser()->getUsername();
            }
        }

        $newsFeed = new \Jarves\Model\NewsFeed();
        $newsFeed->setUsername($username);
        $newsFeed->setVerb($verb);

        $newsFeed->setTargetObject($objectKey);
        $newsFeed->setTargetPk($repo->getObjectUrlId($objectKey, $item));
        $newsFeed->setTargetLabel($itemLabel);
        $newsFeed->setCreated(time());
        $newsFeed->setMessage(null === $message ? $this->generateDiff($objectKey, $item) : $message);
        $newsFeed->save();
    }

    public function getComposerArray($bundleClass)
    {
        $path = $this->getJarves()->getBundleDir($bundleClass);
        $fs = $this->getJarves()->getFileSystem();
        if ($fs->has($file = $path . '/composer.json')) {
            return json_decode($fs->read($file), true);
        }
    }

    /**
     * Creates a temp folder and returns its path.
     * Please use TempFile::createFolder() class instead.
     *
     * @static
     * @internal
     *
     * @param  string $prefix
     * @param  bool   $fullPath Returns the full path on true and the relative to the current TempFolder on false.
     *
     * @return string Path with trailing slash
     */
    public function createTempFolder($prefix = '', $fullPath = true)
    {
        $tmp = $this->getJarves()->getKernel()->getCacheDir();

        do {
            $path = $tmp . $prefix . dechex(time() / mt_rand(100, 500));
        } while (is_dir($path));

        mkdir($path);

        if ('/' !== substr($path, -1)) {
            $path .= '/';
        }

        return $fullPath ? $path : substr($path, strlen($tmp));
    }

    /**
     * @param string $text
     */
    public function showFullDebug($text = null)
    {
        $exception = new \InternalErrorException();
        $exception->setMessage($text ? : 'Debug stop.');

        static::exceptionHandler($exception);
    }

    /**
     * Returns Domain object
     *
     * @param int $domainId If not defined, it returns the current domain.
     *
     * @return \Jarves\Model\Domain
     * @static
     */
    public function getDomain($domainId = null)
    {
        if (!$domainId) {
            return $this->getJarves()->getCurrentDomain();
        }

        if ($domainSerialized = $this->getJarves()->getDistributedCache('core/object-domain/' . $domainId)) {
            return unserialize($domainSerialized);
        }

        $domain = Model\DomainQuery::create()->findPk($domainId);

        if (!$domain) {
            return false;
        }

        $this->getJarves()->setDistributedCache('core/object-domain/' . $domainId, serialize($domain));

        return $domain;
    }

    /**
     * Returns a super fast cached Page object.
     *
     * @param  int $pageId If not defined, it returns the current page.
     *
     * @return \Page
     * @static
     */
    public function getPage($pageId = null)
    {
        if (!$pageId) {
            return $this->getJarves()->getCurrentPage();
        }

        $data = $this->getJarves()->getDistributedCache('core/object/node/' . $pageId);

        if (!$data) {
            $page = NodeQuery::create()->findPk($pageId);
            $this->getJarves()->setDistributedCache('core/object/node/' . $pageId, serialize($page));
        } else {
            $page = unserialize($data);
        }

        return $page ? : false;
    }

    /**
     * Returns the domain of the given $id page.
     *
     * @static
     *
     * @param  integer $id
     *
     * @return integer|null
     */
    public function getDomainOfPage($id)
    {
        $id2 = null;

        $page2Domain = $this->getJarves()->getDistributedCache('core/node/toDomains');

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

        $this->getJarves()->setDistributedCache('core/node/toDomains', $r2d);

        return $r2d;
    }

    /**
     * @param  integer $domainId
     *
     * @return array
     */
    public function &getCachedPageToUrl($domainId)
    {
        if (isset($cachedPageToUrl[$domainId])) {
            return $cachedPageToUrl[$domainId];
        }

        $cachedPageToUrl[$domainId] = array_flip($this->getCachedUrlToPage($domainId));

        return $cachedPageToUrl[$domainId];
    }

    public function &getCachedUrlToPage($domainId)
    {
        $cacheKey = 'core/urls/' . $domainId;
        $urls = $this->getJarves()->getDistributedCache($cacheKey);

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

            $this->getJarves()->setDistributedCache($cacheKey, $urls);
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
        $webDir = realpath($this->getJarves()->getKernel()->getRootDir().'/../web') .'/';
        $content = '';
        foreach ($files as $assetPath) {

            $cssFile = $this->getJarves()->resolvePublicWebPath($assetPath); //bundles/jarves/css/style.css
            $cssDir = dirname($cssFile) . '/'; //admin/css/...
            $cssDir = str_repeat('../', substr_count($includePath, '/')) . $cssDir;

            $content .= "\n\n/* file: $assetPath */\n\n";
            if (file_exists($file = $webDir . $cssFile)) {
                $h = fopen($file, "r");
                if ($h) {
                    while (!feof($h) && $h) {
                        $buffer = fgets($h, 4096);

                        $buffer = preg_replace('/@import \'([^\/].*)\'/', '@import \'' . $cssDir . '$1\'', $buffer);
                        $buffer = preg_replace('/@import "([^\/].*)"/', '@import "' . $cssDir . '$1"', $buffer);
                        $buffer = preg_replace('/url\(\'([^\/][^\)]*)\'\)/', 'url(\'' . $cssDir . '$1\')', $buffer);
                        $buffer = preg_replace('/url\("([^\/][^\)]*)"\)/', 'url("' . $cssDir . '$1")', $buffer);
                        $buffer = preg_replace('/url\((?!data:image)([^\)"\']*)\)/', 'url(' . $cssDir . '$1)', $buffer);
                        $buffer = str_replace(array('  ', '    ', "\t", "\n", "\r"), '', $buffer);
                        $buffer = str_replace(': ', ':', $buffer);

                        $content .= $buffer;
                    }
                    fclose($h);
                }
            } else {
                $content .= '/* => `' . $cssFile . '` not exist. */';
                $this->getJarves()->getLogger()->error(
                    sprintf('Can not find css file `%s` [%s]', $file, $assetPath)
                );
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

            $path = $this->getJarves()->resolveWebPath($assetPath);
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
                $path = $this->getJarves()->resolveWebPath($assetPath);
                $content .= file_get_contents($path);
            }

            if ($content) {
                $this->getJarves()->getWebFileSystem()->write($oFile, $content);
                return true;
            }

            return false;
        }
    }

    /**
     * Stores all locked keys, so that we can release all,
     * on process terminating.
     *
     * @var array
     */
    public $lockedKeys = array();

    /**
     * Releases all locked aquired by this process.
     *
     * Will be called during process shutdown. (register_shutdown_function)
     */
    public function releaseLocks()
    {
        foreach ($this->lockedKeys as $key => $value) {
            self::appRelease($key);
        }
    }

    /**
     * Locks the process until the lock of $id has been acquired for this process.
     * If no lock has been acquired for this id, it returns without waiting true.
     *
     * Waits max 15seconds.
     *
     * @param  string $id
     * @param  integer $timeout Milliseconds
     *
     * @return boolean
     */
    public function appLock($id, $timeout = 15)
    {

        //when we'll be caleed, then we register our releaseLocks
        //to make sure all locks are released.
        register_shutdown_function([$this, 'releaseLocks']);

        if (self::appTryLock($id, $timeout)) {
            return true;
        } else {
            for ($i = 0; $i < 1000; $i++) {
                usleep(15 * 1000); //15ms
                if (self::appTryLock($id, $timeout)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Tries to lock given id. If the id is already locked,
     * the function returns without waiting.
     *
     * @see appLock()
     *
     * @param  string $id
     * @param  int $timeout Default is 30sec
     *
     * @return bool
     */
    public function appTryLock($id, $timeout = 30)
    {
        //already aquired by this process?
        if ($this->lockedKeys[$id] === true) {
            return true;
        }

        $now = ceil(microtime(true) * 1000);
        $timeout2 = $now + $timeout;

        dbDelete('system_app_lock', 'timeout <= ' . $now);

        try {
            dbInsert('system_app_lock', array('id' => $id, 'timeout' => $timeout2));
            $this->lockedKeys[$id] = true;

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Releases a lock.
     * If you're not the owner of the lock with $id, then you'll kill it anyway.
     *
     * @param string $id
     */
    public function appRelease($id)
    {
        unset($this->lockedKeys[$id]);

        try {
            AppLockQuery::create()->filterById($id)->delete();
            dbDelete('system_app_lock', array('id' => $id));
        } catch (\Exception $e) {
        }
    }

    /**
     * Returns cached propel object.
     *
     * @param  int   $objectClassName If not defined, it returns the current page.
     * @param  mixed $objectPk        Propel PK for $objectClassName int, string or array
     *
     * @return mixed Propel object
     * @static
     */
    public function getPropelCacheObject($objectClassName, $objectPk)
    {
        if (is_array($objectPk)) {
            $npk = '';
            foreach ($objectPk as $k) {
                $npk .= urlencode($k) . '_';
            }
        } else {
            $pk = urlencode($objectPk);
        }

        $cacheKey = 'core/object-caching/' . strtolower(preg_replace('/[^\w]/', '.', $objectClassName)) . '/' . $pk;
        if ($serialized = $this->getJarves()->getDistributedCache($cacheKey)) {
            return unserialize($serialized);
        }

        return $this->setPropelCacheObject($objectClassName, $objectPk);
    }

    /**
     * Returns propel object and cache it.
     *
     * @param int   $objectClassName If not defined, it returns the current page.
     * @param mixed $objectPk        Propel PK for $objectClassName int, string or array
     * @param mixed $object          Pass the object, if you did already fetch it.
     *
     * @return mixed Propel object
     */
    public function setPropelCacheObject($object2ClassName, $object2Pk, $object = false)
    {
        $pk = $object2Pk;
        if ($pk === null && $object) {
            $pk = $object->getPrimaryKey();
        }

        if (is_array($pk)) {
            $npk = '';
            foreach ($pk as $k) {
                $npk .= urlencode($k) . '_';
            }
        } else {
            $pk = urlencode($pk);
        }

        $cacheKey = 'core/object-caching.' . strtolower(preg_replace('/[^\w]/', '.', $object2ClassName)) . '/' . $pk;

        $clazz = $object2ClassName . 'Query';
        $object2 = $object;
        if (!$object2) {
            $object2 = $clazz::create()->findPk($object2Pk);
        }

        if (!$object2) {
            return false;
        }

        $this->getJarves()->setDistributedCache($cacheKey, serialize($object2));

        return $object2;

    }

    /**
     * Removes a object from the cache.
     *
     * @param int   $objectClassName If not defined, it returns the current page.
     * @param mixed $objectPk        Propel PK for $objectClassName int, string or array
     */
    public function removePropelCacheObject($objectClassName, $objectPk = null)
    {
        $pk = $objectPk;
        if ($pk !== null) {
            if (is_array($pk)) {
                $npk = '';
                foreach ($pk as $k) {
                    $npk .= urlencode($k) . '_';
                }
            } else {
                $pk = urlencode($pk);
            }
        }
        $cacheKey = 'core/object-caching.' . strtolower(preg_replace('/[^\w]/', '.', $objectClassName));

        if ($objectPk) {
            $this->getJarves()->deleteDistributedCache($cacheKey . '/' . $pk);
        } else {
            $this->getJarves()->invalidateCache($cacheKey);
        }
    }

}
