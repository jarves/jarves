<?php

namespace Jarves;

use Jarves\Client\ClientAbstract;
use Jarves\Configuration\Client;
use Jarves\Configuration\Event;
use Jarves\Configuration\Model;
use Jarves\Configuration\SystemConfig;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\Model\Domain;
use Jarves\Model\Node;
use Jarves\Propel\PropelHelper;
use Symfony\Component\EventDispatcher\GenericEvent;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\DependencyInjection\Container;

class Jarves extends Controller
{

    /**
     * @var Configuration\Configs|Configuration\Bundle[]
     */
    protected $configs;

    /**
     * @var \Symfony\Component\DependencyInjection\Container
     */
    protected $container;

    /**
     * @var RequestStack
     */
    protected $requestStack;

    /**
     * @var Request
     */
    protected $lastRequest;

    /**
     * @var PropelHelper
     */
    protected $propelHelper;

    /**
     * @var SystemConfig
     */
    protected $systemConfig;

    /**
     * Client instance in administration area.
     *
     * @var ClientAbstract
     */
    protected $adminClient;

    /**
     * Frontend client instance.
     *
     * @var ClientAbstract
     */
    protected $client;

    /**
     * @var Utils
     */
    protected $utils;

    /**
     * @var Configuration\Cache
     */
    protected $cache;

    /**
     * @var Model\Domain
     */
    protected $currentDomain;

    /**
     * @var Model\Node
     */
    protected $currentPage;

    /**
     * @var array
     */
    protected $attachedEvents = [];

    /**
     * @param $container
     */
    function __construct(Container $container)
    {
        $this->container = $container;
        Configuration\Model::$serialisationJarvesCore = $this;
    }

    public function prepareNewMasterRequest()
    {
        $this->container->set('jarves.page.response', null);
    }

    /**
     * Creates all symlink in /web/<bundleName> to <bundlePath>/Resources/public
     * if not already.
     */
    public function prepareWebSymlinks()
    {
        chdir($this->getKernel()->getRootDir() . '/..');
        $bundles = 'web/bundles/';
        if (!is_dir($bundles)) {
            if (!@mkdir($bundles)) {
                throw new \Exception(sprintf('Can not create `%s` directory. Please check permissions.', getcwd() . '/' . $bundles));
            }
        }

        foreach ($this->getBundles() as $bundle) {
            if ($bundle) {
                $public = $bundle->getPath() . '/Resources/public';
                if (is_dir($public)) {
                    $web = $bundles . $this->getShortBundleName($bundle->getName());
                    if (!is_link($web)) {
                        symlink(realpath($public), $web);
                    }
                }
            }
        }
    }

    /**
     * Marks a code as invalidate beginning at $time.
     * This is the distributed cache controller. Use it if you want
     * to invalidate caches on a distributed backend (use by `setCache()`
     * and `setDistributedCache()`.
     *
     * You don't have to define the full key, instead you can pass only the starting part of the key.
     * This means, if you have following caches defined:
     *
     *   - news/list/2
     *   - news/list/3
     *   - news/list/4
     *   - news/comments/134
     *   - news/comments/51
     *
     * you can mark all listing caches as invalid by calling
     *   - invalidateCache('news/list');
     *
     * or mark all caches as invalid which starts with `news/` you can call:
     *   - invalidateCache('news');
     *
     *
     * The invalidation mechanism explodes the key by / and checks all levels whether they're marked
     * as invalid (through a microsecond timestamp) or not.
     *
     * Default is $time is `mark all caches as invalid which are older than CURRENT`.
     *
     * @param  string $key
     * @param  integer $time Unix timestamp. Default is microtime(true). Uses float for ms.
     *
     * @return boolean
     */
    public function invalidateCache($key, $time = null)
    {
        if ($this->isDebugMode()) {
            $time = $time ? : microtime(true);
            $micro = sprintf("%06d", ($time - floor($time)) * 1000000);
            $this->getLogger()->addDebug(
                sprintf('Invalidate `%s` (from %s)', $key, date('F j, Y, H:i:s.' . $micro, $time))
            );
        }

        return $this->getCache()->invalidate($key, $time ? : microtime(true));
    }

    /**
     * @return bool
     */
    public function isDebugMode()
    {
        return $this->getKernel()->isDebug();
    }

    /**
     * Returns a distributed cache value.
     *
     * @see setDistributedCache() for more information
     *
     * @param string $key
     *
     * @return mixed Null if not found
     */
    public function getDistributedCache($key)
    {
        $this->getStopwatch()->start(sprintf('Get Cache `%s`', $key));
        $fastCache = $this->getFastCache();
        $distributedCache = $this->getCache();

        $invalidationKey = $key . '/!invalidationCheck';
        $timestamp = $distributedCache->get($invalidationKey);
        $cache = null;

        $result = null;
        if ($timestamp !== null) {
            $cache = $fastCache->get($key);
            if (is_array($cache) && isset($cache['timestamp']) && $cache['timestamp'] == $timestamp) {
                $result = $cache['data'];
            }
        }
        $this->getStopwatch()->stop(sprintf('Get Cache `%s`', $key));

        return $result;
    }

    /**
     * @param $key
     */
    public function deleteDistributedCache($key)
    {
        $fastCache = $this->getFastCache();
        $distributedCache = $this->getCache();

        $fastCache->delete($key);
        $distributedCache->delete($key . '/!invalidationCheck');
    }

    /**
     * Sets a distributed cache.
     *
     * This stores a ms timestamp on the distributed cache (Jarves::setCache())
     * and the actual data on the high-speed cache driver (Jarves::setFastCache()).
     * This mechanism makes sure, you gain the maximum performance by using the
     * fast cache driver to store the actual data and using the distributed cache driver
     * to store a ms timestamp where we can check (over several jarves.cms installations)
     * whether the cache is still valid or not.
     *
     * Use Jarves::invalidateCache($key) to invalidate this cache.
     * You don't have to define the full key, instead you can pass only a part of the key.
     *
     * @see invalidateCache for more information.
     *
     * Don't mix the usage of getDistributedCache() and getCache() since this method
     * stores extra values at the value, which makes getCache() returning something invalid.
     *
     * @param string $key
     * @param mixed $value Only simple data types. Serialize your value if you have objects/arrays.
     * @param int $lifeTime
     *
     * @return boolean
     * @static
     */
    public function setDistributedCache($key, $value, $lifeTime = null)
    {
        $fastCache = $this->getFastCache();
        $distributedCache = $this->getCache();

        $invalidationKey = $key . '/!invalidationCheck';
        $timestamp = microtime();

        $cache['data'] = $value;
        $cache['timestamp'] = $timestamp;

        return $fastCache->set($key, $cache, $lifeTime) && $distributedCache->set(
            $invalidationKey,
            $timestamp,
            $lifeTime
        );
    }

    /**
     * Returns the current adminClient instance.
     * If not exists, we create it and start the session process.
     *
     * Note that this method creates a new AbstractClient instance and starts
     * the whole session process mechanism (with sending sessions ids etc)
     * if the adminClient does not exists already.
     *
     * @return ClientAbstract
     */
    public function getAdminClient()
    {
        $systemClientConfig = $this->getSystemConfig()->getClient(true);
        $defaultClientClass = $systemClientConfig->getClass();

        if (null === $this->adminClient) {
            $this->adminClient = new $defaultClientClass($this, $systemClientConfig);
            $this->adminClient->start();
            if (null === $this->client) {
                $this->client = $this->adminClient;
            }
        }

        return $this->adminClient;
    }

    /**
     * @return ClientAbstract
     *
     */
    public function getClient()
    {
        if ($this->client) {
            return $this->client;
        }

        $systemClientConfig = $this->getSystemConfig()->getClient(true);
        $defaultClientClass = $systemClientConfig->getClass();

        $domainClientConfigXml = $this->getCurrentDomain() ? $this->getCurrentDomain()->getSessionProperties() : '';
        $domainClientConfig = $systemClientConfig;

        if ($domainClientConfigXml) {
            $domainClientConfig = new Client($domainClientConfigXml);
        }

        $domainClientClass = $domainClientConfig->getClass() ? : $defaultClientClass;

        return $this->client = new $domainClientClass($this, $domainClientConfig);
    }

    /**
     * @param bool $withCache
     *
     * @return SystemConfig
     */
    public function getSystemConfig($withCache = true)
    {
        if (null === $this->systemConfig) {

            $configFile = $this->getKernel()->getRootDir() . '/config/config.jarves.xml';
            $configEnvFile = $this->getKernel()->getRootDir() . '/config/config.jarves_' . $this->getKernel()->getEnvironment() . '.xml';
            if (file_exists($configEnvFile)) {
                $configFile = $configEnvFile;
            }

            $cacheFile = $configFile . '.cache.php';
            $systemConfigCached = @file_get_contents($cacheFile);

            $cachedSum = 0;
            if ($systemConfigCached) {
                $cachedSum = substr($systemConfigCached, 0, 32);
                $systemConfigCached = substr($systemConfigCached, 33);
            }

            $systemConfigHash = file_exists($configFile) ? md5(filemtime($configFile)) : -1;

            if ($withCache && $systemConfigCached && $cachedSum === $systemConfigHash) {
                $this->systemConfig = @unserialize($systemConfigCached);
            }

            if (!$this->systemConfig) {
                $configXml = file_exists($configFile) ? file_get_contents($configFile) : [];
                $this->systemConfig = new SystemConfig($configXml, $this);
                file_put_contents($cacheFile, $systemConfigHash . "\n" . serialize($this->systemConfig));
            }

//            if (!$this->systemConfig->getDatabase()) {
//                $database = $this->container->get('jarves.configuration.database');
//                $this->systemConfig->setDatabase($database);
//            }

        }

        return $this->systemConfig;
        //return $this->container->get('jarves.configuration');
    }

    /**
     * @return Node|null
     */
    public function getCurrentPage()
    {
        return $this->currentPage;
    }

    /**
     * @return Domain|null
     */
    public function getCurrentDomain()
    {
        return $this->currentDomain;
    }

    /**
     * @param Node $currentPage
     */
    public function setCurrentPage($currentPage)
    {
        $this->currentPage = $currentPage;
    }

    /**
     * @param Domain $currentDomain
     */
    public function setCurrentDomain($currentDomain)
    {
        $this->currentDomain = $currentDomain;
    }

    /**
     * @return Request
     */
    public function getRequest()
    {
        if (null === $this->requestStack) {
            $this->requestStack = $this->container->get('request_stack');
        }

        $request = $this->requestStack->getCurrentRequest();

        if (!$request) {
            $request = $this->lastRequest;
        } else {
            $this->lastRequest = $request;
        }

        return $request;
    }

    /**
     * @return \Jarves\Cache\AbstractCache
     */
    public function getCache()
    {
        if (null === $this->cache) {
            $cache = $this->getSystemConfig()->getCache(true);
            $class = $cache->getClass();
            $this->cache = new $class($cache);
        }

        return $this->cache;
    }

    /**
     * Returns the short bundle name of $bundleName.
     *
     * It's used for example in the web/bundles/ directory.
     *
     * @param string $bundleName
     * @return string
     */
    public function getShortBundleName($bundleName)
    {
        return preg_replace('/bundle$/', '', strtolower($bundleName));
    }

    /**
     * @return \Symfony\Bundle\FrameworkBundle\Templating\EngineInterface
     */
    public function getTemplating()
    {
        $this->container->get('twig')->addGlobal('baseUrl', $this->getRequest()->getBaseUrl() . '/');

        return $this->container->get('templating');
    }

    /**
     * @return string
     */
    public function getWebCacheDir()
    {
        return 'web/cache/';
    }

    /**
     * @return Utils
     */
    public function getUtils()
    {
        if (null === $this->utils) {
            $this->utils = new Utils($this);
        }

        return $this->utils;
    }

    /**
     * @param $bundleName
     *
     * @return Configuration\Bundle
     */
    public function getConfig($bundleName)
    {
        $bundle = $this->getBundle($bundleName);
        if ($bundle) {
            return $this->getConfigs()->getConfig($bundle->getName());
        }
    }

    /**
     * @return Configuration\Configs|Configuration\Bundle[]
     */
    public function getConfigs()
    {
        return $this->configs;
    }

    /**
     * @param Configuration\Configs $configs
     */
    public function setConfigs(Configuration\Configs $configs)
    {
        $this->configs = $configs;
    }

    /**
     * Returns all Symfony Bundles.
     *
     * @return \Symfony\Component\HttpKernel\Bundle\BundleInterface[]
     */
    public function getBundles()
    {
        $bundles = [];
        foreach ($this->getKernel()->getBundles() as $bundleName => $bundle) {
            $bundles[$bundleName] = $bundle;
        }

        return $bundles;
    }

    /**
     * @param string $bundleName
     * @return \Symfony\Component\HttpKernel\Bundle\BundleInterface
     */
    public function getBundle($bundleName)
    {
        foreach ($this->getBundles() as $bundle) {
            if (strtolower($bundle->getName()) == strtolower($bundleName)
                || $this->getShortBundleName($bundle->getName()) == strtolower($bundleName)
                || get_class($bundle) == $bundleName
            ) {
                return $bundle;
            }
        }

        if (class_exists($bundleName)) {
            $reflection = new \ReflectionClass($bundleName);
            if ($reflection->implementsInterface('Symfony\Component\HttpKernel\Bundle\BundleInterface')) {
                return $reflection->newInstance();
            }
        }
    }

    /**
     * Returns the bundle name.
     *
     * Jarves\JarvesBundle => JarvesBundle
     *
     * @param string $bundleClass
     * @return string
     */
    public function getBundleName($bundleClass)
    {
        $lastSlash = strrpos($bundleClass, '\\');

        return $lastSlash ? substr($bundleClass, $lastSlash + 1) : $bundleClass;
    }

    /**
     * @param string $bundleName full className or bundleName or short bundleName
     * @return string with trailing /, relative to root folder
     */
    public function getBundleDir($bundleName)
    {
        $bundle = $this->getBundle($bundleName);
        $path = null;
        if ($bundle) {
            $path = $bundle->getPath();
        } else {
            if (class_exists($bundleName)) {
                $reflection = new \ReflectionClass($bundleName);
                $path = dirname($reflection->getFileName());
            }
        }
        $current = realpath($this->getKernel()->getRootDir() . '/..');
        if ($path) {
            $path = Tools::getRelativePath($path, $current);
            if ('/' !== substr($path, -1)) {
                $path .= '/';
            }

            return $path;
        }
    }

    /**
     * @return string
     */
    public function getRoot()
    {
        return realpath($this->getKernel()->getRootDir() . '/..');
    }

    /**
     * Checks if a (jarves) bundle is activated.
     *
     * @param string $bundleName
     * @return bool
     */
    public function isActiveBundle($bundleName)
    {
        return null !== $this->getBundle($bundleName);
    }

    /**
     * @param string $bundleName
     * @return bool
     */
    public function isJarvesBundle($bundleName)
    {
        $root = realpath($this->getKernel()->getRootDir() . '/..') . '/';
        $path = $root . $this->getBundleDir($bundleName) . 'Resources/config/';
        if (file_exists($path . 'jarves.xml')) {
            return true;
        }

        $files = glob($path . 'jarves.*.xml');

        return count($files) > 0;
    }

    /**
     * @param $nodeOrId
     * @param bool $fullUrl
     * @return string
     */
    public function getNodeUrl($nodeOrId, $fullUrl = false, $suppressStartNodeCheck = false)
    {
        $id = $nodeOrId;
        if ($nodeOrId instanceof Node) {
            $id = $nodeOrId->getId();
        }

        if (!$nodeOrId) {
            $nodeOrId = $this->getCurrentPage();
        }

        $domainId = $nodeOrId instanceof Node ? $nodeOrId->getDomainId() : $this->getUtils()->getDomainOfPage(
            $nodeOrId + 0
        );
        $currentDomain = $this->getCurrentDomain();

        if (!$suppressStartNodeCheck && $currentDomain->getStartnodeId() === $id) {
            $url = '/';
        } else {
            $urls =& $this->getUtils()->getCachedPageToUrl($domainId);
            $url = isset($urls[$id]) ? $urls[$id] : '';
        }

        //do we need to add app_dev.php/ or something?
        $prefix = substr(
            $this->requestStack->getMasterRequest()->getBaseUrl(),
            strlen($this->requestStack->getMasterRequest()->getBasePath())
        );

        if (false !== $prefix) {
            $url = substr($prefix, 1) . $url;
        }

        if ($fullUrl || !$currentDomain || $domainId != $currentDomain->getId()) {
            $domain = $currentDomain ? : $this->getUtils()->getDomain($domainId);

            $domainName = $domain->getRealDomain();
            if ($domain->getMaster() != 1) {
                $url = $domainName . $domain->getPath() . $domain->getLang() . '/' . $url;
            } else {
                $url = $domainName . $domain->getPath() . $url;
            }

            $url = 'http' . ($this->getRequest()->isSecure() ? 's' : '') . '://' . $url;
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
     * Returns the normalize jarves_admin_prefix parameter.
     *
     * @return string
     */
    public function getAdminPrefix()
    {
        $prefix = $this->container->getParameter('jarves_admin_prefix');

        if (!$prefix) {
            return '/jarves';
        }

        if ('/' !== $prefix[0]) {
            $prefix = '/' . $prefix;
        }

        if ('/' === substr($prefix, -1)) {
            $prefix = substr($prefix, 0, -1);
        }

        return $prefix;
    }

    /**
     *
     *
     * ('@JarvesBundle/Resources/public/test.png') => /var/www/jarves/src/Jarves/Resources/public/test.png
     * ('@JarvesBundle/Resources/public/test.png', '', true) => src/Jarves/Resources/public/test.png
     *
     * ('@JarvesBundle/test.png', 'Resources/public/') => /var/www/jarves/src/Jarves/Resources/public/test.png
     * ('@JarvesBundle/test.png') => /var/www/jarves/src/Jarves/test.png
     *
     * ('images/test.png') => /var/www/jarves/images/webtest.png
     *
     * @param string $path
     * @param string $suffix
     * @param bool $relativePath
     *
     * @return string without trailing slash when relative
     *
     * @throws Exceptions\BundleNotFoundException
     */
    public function resolvePath($path, $suffix = '', $relativePath = false)
    {
        $path = preg_replace('/:+/', '/', $path);
        preg_match('/\@?([a-zA-Z0-9\-_\.\\\\]+)/', $path, $matches);

        $root = realpath($this->getKernel()->getRootDir() . '/../');
        if ($matches && isset($matches[1])) {
            try {
                $bundle = $this->getKernel()->getBundle($matches[1]);
            } catch (\InvalidArgumentException $e) {
                throw new BundleNotFoundException(sprintf(
                    'Bundle for `%s` (%s) not found.',
                    $matches[1],
                    $path
                ), 0, $e);
            }

            $path = substr($path, strlen($matches[1]) + 1);

            $bundlePath = $bundle->getPath();
            $suffix = trim($suffix, '/');
            $path = trim($path, '/');
            $bundlePath = '/' . trim($bundlePath, '/');

            $path = $bundlePath . ($suffix ? '/' . $suffix : '' ) . '/' . $path;
        } else {
            $path = $root . $path;
        }

        if ($relativePath) {
            return Tools::getRelativePath($path, $root);
        }

        return $path;
    }

    /**
     * Shortcut for $this->resolvePath($path, 'Resources/public')
     *
     * ('@JarvesBundle/admin/js/test.js') => /var/www/jarves/src/Jarves/Resources/public/admin/js/test.js
     *
     * @param string $path
     * @return mixed
     */
    public function resolveInternalPublicPath($path)
    {
        return $this->resolvePath($path, 'Resources/public');
    }

    /**
     *
     * ('@JarvesBundle/admin/js/test.js') => web/bundles/jarves/admin/js/test.js
     *
     * ('images/test.png') => web/images/webtest.png
     *
     * @param string $path
     * @return string
     * @throws Exceptions\BundleNotFoundException
     */
    public function resolveWebPath($path)
    {
        if ($path && '@' !== $path[0]) {
            return 'web/' . $path;
        }

        preg_match('/(\@?[a-zA-Z0-9\-_\.\\\\]+)/', $path, $matches);
        if ($matches && isset($matches[1])) {
            try {
                $bundle = $this->getKernel()->getBundle(str_replace('@', '', $matches[1]));
            } catch (\InvalidArgumentException $e) {
                throw new BundleNotFoundException(sprintf(
                    'Bundle for `%s` (%s) not found.',
                    $matches[1],
                    $path
                ), 0, $e);
            }
            $targetDir = 'web/bundles/' . $this->getShortBundleName($bundle->getName());

            return $targetDir . substr($path, strlen($matches[0]));
        }

        return 'web/' . $path;
    }

    /**
     *
     * ('@JarvesBundle/admin/js/test.js') => bundles/jarves/admin/js/test.js
     *
     * ('images/test.png') => images/webtest.png
     *
     * ('routepath/do-something') => routepath/do-something
     * ('routepath/do-something') => app_dev.php/routepath/do-something
     *
     * ('http://external.tld/style.css') => http://external.tld/style.css
     *
     * @param string $path
     * @return string
     */
    public function resolvePublicWebPath($path)
    {
        $webDir = realpath($this->getKernel()->getRootDir().'/../web') . '/';

        if ($path && '@' === $path[0]) {
            try {
                $path = $this->resolveWebPath($path);
                $path = substr($path, strpos($path, '/') + 1);
            } catch (BundleNotFoundException $e) {
            }
        }

        if (file_exists($webDir . $path)) {
            return $path;
        }

        //if its a external path?
        if (preg_match('/^(http|https|\/\/)/', $path)) {
            return $path;
        }

        if ($this->getRequest()) {
            //do we need to add app_dev.php/ or something?
            $prefix = substr(
                $this->getRequest()->getBaseUrl(),
                strlen($this->getRequest()->getBasePath())
            );

            if (false !== $prefix) {
                $path = substr($prefix, 1) . '/' . $path;
            }
        }

        return $path;
    }

    /**
     * @param bool $forceNoCache
     */
    public function loadBundleConfigs($forceNoCache = false)
    {
        $this->getStopwatch()->start('Load Bundle Configs');
        $cached = $this->getFastCache()->get('core/configs');
        $bundles = array_keys($this->container->getParameter('kernel.bundles'));

        $configs = new Configuration\Configs($this);

        $hashes = [];
        foreach ($bundles as $bundleName) {
            $hashes[] = $configs->getConfigHash($bundleName);
        }
        $hash = md5(implode('.', $hashes));

        if ($cached) {
            $cached = unserialize($cached);
            if (is_array($cached) && $cached['md5'] == $hash) {
                $this->configs = $cached['data'];
                $this->configs->setCore($this);
            }
        }

        if (!$this->configs) {
            $this->configs = new Configuration\Configs($this, $bundles);
            $this->configs->boot();
            $cached = serialize(
                [
                    'md5' => $hash,
                    'data' => $this->configs
                ]
            );

            $this->getFastCache()->set('core/configs', $cached);
        }

        foreach ($this->configs as $bundleConfig) {
            if ($events = $bundleConfig->getListeners()) {
                foreach ($events as $event) {

                    $this->attachEvent($event);
                    $fn = function (GenericEvent $genericEvent) use ($event) {
                        if ($event->isCallable($genericEvent)) {
                            $event->call($genericEvent);
                        }
                    };
                    $this->getEventDispatcher()->addListener($event->getKey(), $fn);
                }
            }
        }
        $this->getStopwatch()->stop('Load Bundle Configs');
    }

    public function attachEvent(Event $event)
    {
        $fn = function (GenericEvent $genericEvent) use ($event) {
            if ($event->isCallable($genericEvent)) {
                $event->call($genericEvent);
            }
        };

        $this->getEventDispatcher()->addListener($event->getKey(), $fn);
        $this->attachedEvents[] = [
            'key' => $event->getKey(),
            'event' => $event,
            'callback' => $fn
        ];
    }

    public function detachEvents()
    {
        foreach ($this->attachedEvents as $eventInfo) {
            $this->getEventDispatcher()->removeListener($eventInfo['key'], $eventInfo['callback']);
        }

        $this->attachedEvents = [];
    }

    /**
     * @return array
     */
    public function getAttachedEvents()
    {
        return $this->attachedEvents;
    }

    /**
     * Returns the installation id.
     *
     * @return string
     */
    public function getId()
    {
        return 'jarves-' . ($this->getSystemConfig()->getId() ? : 'no-id');
    }

}