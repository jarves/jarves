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

use Jarves\Admin\FieldTypes\FieldTypes;
use Jarves\Cache\Cacher;
use Jarves\Client\ClientAbstract;
use Jarves\Configuration\Bundle;
use Jarves\Configuration\Client;
use Jarves\Configuration\Configs;
use Jarves\Configuration\Event;
use Jarves\Configuration\Model;
use Jarves\Configuration\SystemConfig;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\Model\Domain;
use Jarves\Model\Node;
use Jarves\Propel\PropelHelper;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpKernel\KernelInterface;

class Jarves
{
    /**
     * @var Configuration\Configs|Configuration\Bundle[]
     */
    protected $configs;

    /**
     * @var Utils
     */
    protected $utils;

    /**
     * @var string
     */
    private $adminPrefix;

    /**
     * @var string
     */
    private $cacheDir;

    /**
     * @var string
     */
    private $rootDir;

    /**
     * @var string
     */
    private $environment;

    /**
     * @var string
     */
    private $debugMode;

    /**
     * @var KernelInterface
     */
    private $kernel;

    /**
     * @var FieldTypes
     */
    private $fieldTypes;

    /**
     * @var JarvesConfig
     */
    private $jarvesConfig;

    /**
     * @param JarvesConfig $jarvesConfig
     * @param string $adminPrefix
     * @param string $cacheDir
     * @param string $rootDir
     * @param string $environment
     * @param string $debugMode
     * @param KernelInterface $kernel
     * @param RequestStack $requestStack
     * @param EventDispatcherInterface $eventDispatcher
     * @param FieldTypes $fieldTypes
     */
    function __construct(JarvesConfig $jarvesConfig, $adminPrefix, $cacheDir, $rootDir, $environment,
                         $debugMode, KernelInterface $kernel,
                         RequestStack $requestStack, EventDispatcherInterface $eventDispatcher,
                         FieldTypes $fieldTypes)
    {
        Configuration\Model::$serialisationJarvesCore = $this;
        $this->adminPrefix = $adminPrefix;
        $this->requestStack = $requestStack;
        $this->cacheDir = $cacheDir;
        $this->rootDir = $rootDir;
        $this->environment = $environment;
        $this->debugMode = $debugMode;
        $this->kernel = $kernel;
        $this->eventDispatcher = $eventDispatcher;
        $this->fieldTypes = $fieldTypes;
        $this->jarvesConfig = $jarvesConfig;
    }

    /**
     * @return string
     */
    public function getCacheDir()
    {
        return $this->cacheDir;
    }

    /**
     * @return string
     */
    public function getRootDir()
    {
        return $this->rootDir;
    }

    /**
     * Resets current PageResponse;
     */
    public function reset()
    {
//        $this->currentPageResponse = null;
    }

    /**
     * @return Admin\FieldTypes\FieldTypes
     */
    public function getFieldTypes()
    {
        return $this->fieldTypes;
    }

    /**
     * Creates all symlink in /web/<bundleName> to <bundlePath>/Resources/public
     * if not already.
     */
    public function prepareWebSymlinks()
    {
        chdir($this->rootDir . '/..');
        $bundles = 'web/bundles/';
        if (!is_dir($bundles)) {
            if (!@mkdir($bundles)) {
                throw new \Exception(
                    sprintf('Can not create `%s` directory. Please check permissions.', getcwd() . '/' . $bundles)
                );
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
     * @return bool
     */
    public function isDebugMode()
    {
        return $this->debugMode;
    }

    /**
     * Terminates everything, each post request event.
     */
    public function terminate()
    {
    }


    /**
     * @deprecated  use jarvesConfig->getSystemConfig
     * @return SystemConfig
     */
    public function getSystemConfig()
    {
        return $this->jarvesConfig->getSystemConfig();
    }

    /**
     * @deprecated  use pageStack->getCurrentRequest
     * @return Request
     */
    public function getRequest()
    {
    }

    public function getCache()
    {
        throw new \Exception('Use jarves.cache.distributed service.');
    }

    /**
     * Returns the short bundle name of $bundleName.
     *
     * It's used for example in the web/bundles/ directory.
     *
     * @param string $bundleName
     *
     * @return string
     */
    public function getShortBundleName($bundleName)
    {
        return preg_replace('/bundle$/', '', strtolower($bundleName));
    }

    /**
     * @return string
     */
    public function getWebCacheDir()
    {
        return 'web/cache/';
    }

    /**
     * Returns a configuration for a bundle.
     *
     * @param $bundleName
     *
     * @return Configuration\Bundle|null
     */
    public function getConfig($bundleName)
    {
        $bundle = $this->getBundle($bundleName);
        if ($bundle) {
            return $this->getConfigs()->getConfig($bundle->getName());
        }

        return null;
    }

    /**
     * @param string $bundleName
     * @return Configuration\Bundle|null
     */
    public function getOrCreateConfig($bundleName)
    {
        $bundle = $this->getBundle($bundleName);
        if ($bundle) {
            $config = $this->getConfigs()->getConfig($bundle->getName());
            if (!$config) {
                return new Bundle($bundle, $this, null);
            }

            return $config;
        }

        return null;
    }

    /**
     * Returns a real Bundle config object, which is being read from the configurations
     * files without bootstrap. So this configuration does not contain any changes from
     * autoCrud, object-attributes, field modifications and other configuration manipulations from the bootstrap.
     *
     * When no configurations are found, it returns a completely new Jarves\Configuration\Bundle object.
     *
     * @param string $bundleName
     * @return Bundle
     */
    public function getRealConfig($bundleName)
    {
        $configs = new Configs($this);
        $configs->loadBundles([$bundleName]);

        $config = $configs->getConfig($bundleName);

        if (!$config) {
            $bundle = $this->getBundle($bundleName);
            return new Bundle($bundle, $this, null);
        }

        return $config;
    }

    /**
     * Returns all configurations for all registered bundles.
     *
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
        foreach ($this->kernel->getBundles() as $bundleName => $bundle) {
            $bundles[$bundleName] = $bundle;
        }

        return $bundles;
    }

    /**
     * @param string $bundleName
     *
     * @return \Symfony\Component\HttpKernel\Bundle\BundleInterface|null
     */
    public function getBundle($bundleName)
    {
        if (false !== ($slash = strpos($bundleName, '/'))) {
            $bundleName = substr($bundleName, 0, $slash);
        }

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

        return null;
    }

    /**
     * Returns the bundle name.
     *
     * Jarves\JarvesBundle => JarvesBundle
     *
     * @param string $bundleClass
     *
     * @return string
     */
    public function getBundleName($bundleClass)
    {
        $lastSlash = strrpos($bundleClass, '\\');

        return $lastSlash ? substr($bundleClass, $lastSlash + 1) : $bundleClass;
    }

    /**
     * @param string $bundleName full className or bundleName or short bundleName
     *
     * @return string|null with leading / relative to root folder
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
        $current = realpath($this->rootDir . '/..');
        if ($path) {
            $path = Tools::getRelativePath($path, $current);
            if ('/' !== substr($path, -1)) {
                $path .= '/';
            }

            return $path;
        }

        return null;
    }

    /**
     * @return string
     */
    public function getRoot()
    {
        return realpath($this->rootDir . '/..');
    }

    /**
     * Checks if a (jarves) bundle is activated.
     *
     * @param string $bundleName
     *
     * @return bool
     */
    public function isActiveBundle($bundleName)
    {
        return null !== $this->getBundle($bundleName);
    }

    /**
     * @param string $bundleName
     *
     * @return bool
     */
    public function isJarvesBundle($bundleName)
    {
        $root = realpath($this->rootDir . '/..') . '/';
        $path = $root . $this->getBundleDir($bundleName) . 'Resources/config/';
        if (file_exists($path . 'jarves.xml')) {
            return true;
        }

        $files = glob($path . 'jarves.*.xml');

        return count($files) > 0;
    }

    /**
     * Returns the normalize jarves_admin_prefix parameter.
     *
     * @return string
     */
    public function getAdminPrefix()
    {
        $prefix = $this->adminPrefix;

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

        $root = realpath($this->rootDir . '/../');

        if ($bundle = $this->getBundleFromPath($path, $bundleName)) {

            $path = substr($path, strlen($bundleName) + 1);

            $bundlePath = $bundle->getPath();
            $suffix = trim($suffix, '/');
            $path = trim($path, '/');
            $bundlePath = '/' . trim($bundlePath, '/');

            $path = $bundlePath . ($suffix ? '/' . $suffix : '') . '/' . $path;
        } else {
            $path = $root . $path;
        }

        if ($relativePath) {
            return Tools::getRelativePath($path, $root);
        }

        return $path;
    }

    /**
     * @param string $path
     * @param string $bundleName will be modified when found
     *
     * @return null|\Symfony\Component\HttpKernel\Bundle\BundleInterface
     *
     * @throws BundleNotFoundException
     */
    public function getBundleFromPath($path, &$bundleName = '')
    {
        $path = preg_replace('/:+/', '/', $path);
        preg_match('/\@?([a-zA-Z0-9\-_\.\\\\]+)/', $path, $matches);

        if ($matches && isset($matches[1])) {
            try {
                $bundle = $this->getBundle($matches[1]);
                $bundleName = $matches[1];
                return $bundle;
            } catch (\InvalidArgumentException $e) {
                throw new BundleNotFoundException(
                    sprintf(
                        'Bundle for `%s` (%s) not found.',
                        $matches[1],
                        $path
                    )
                );
            }
        }

        return null;
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
                $bundle = $this->getBundle(str_replace('@', '', $matches[1]));
            } catch (\InvalidArgumentException $e) {
                throw new BundleNotFoundException(
                    sprintf(
                        'Bundle for `%s` (%s) not found.',
                        $matches[1],
                        $path
                    ), 0, $e
                );
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
        //if its a external path?
        if (strpos($path, '://') !== false) {
            return $path;
        }

        $webDir = realpath($this->rootDir . '/../web') . '/';

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

        if ($this->requestStack->getMasterRequest()) {
            //do we need to add app_dev.php/ or something?
            $prefix = substr(
                $this->requestStack->getMasterRequest()->getBaseUrl(),
                strlen($this->requestStack->getMasterRequest()->getBasePath())
            );

            if (false !== $prefix) {
                if ($prefix && $prefix = substr($prefix, 1)) {
                    $path = $prefix . '/' . $path;
                }
            }
        }

        return $path;
    }

    /**
     * Loads all configurations from all registered bundles (BundleName/Resources/config/jarves*.xml)
     * @param Cacher $cacher
     *
     * @return null|callable returns a callable that should be called when config stuff have been registered
     */
    public function loadBundleConfigs(Cacher $cacher)
    {
        $cached = $cacher->getFastCache('core/configs');
        $bundles = array_keys($this->kernel->getBundles());

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

            return function() use ($hash, $cacher) {
                $cached = serialize(
                    [
                        'md5' => $hash,
                        'data' => $this->configs
                    ]
                );

                $cacher->setFastCache('core/configs', $cached);
            };
        }
    }

    /**
     * Returns the installation id.
     *
     * @return string
     */
    public function getId()
    {
        return 'jarves-' . ($this->getSystemConfig()->getId() ?: 'no-id');
    }

}