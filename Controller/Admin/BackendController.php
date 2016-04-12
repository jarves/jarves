<?php

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\ACL;
use Jarves\Admin\Utils;
use Jarves\Cache\Cacher;
use Jarves\Configuration\Condition;
use Jarves\Filesystem\Filesystem;
use Jarves\Jarves;
use Jarves\Model\Base\GroupQuery;
use Jarves\Model\LanguageQuery;
use Jarves\PageStack;
use Jarves\Properties;
use Jarves\Storage\AbstractStorage;
use Jarves\Storage\StorageFactory;
use Jarves\Tools;
use Propel\Runtime\Map\TableMap;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class BackendController extends Controller
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var PageStack
     */
    protected $pageStack;

    /**
     * @var Utils
     */
    protected $utils;

    /**
     * @var ACL
     */
    protected $acl;

    public function setContainer(ContainerInterface $container = null)
    {
        parent::setContainer($container);

        $this->pageStack = $this->get('jarves.page_stack');
        $this->jarves = $this->get('jarves');
        $this->acl = $this->get('jarves.acl');
        $this->utils = $this->get('jarves.utils');
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Search in all objects"
     * )
     *
     * @Rest\QueryParam(name="query", requirements=".+", strict=true, description="A query")
     *
     * @Rest\Get("/admin/backend/search")
     *
     * @return bool
     */
    public function searchAction(ParamFetcher $paramFetcher)
    {
        $query = $paramFetcher->get('query');
        $result = [
            'errors' => [],
            'items' => []
        ];

        /** @var StorageFactory $storageFactory */
        $storageFactory = $this->get('jarves.storage_factory');

        $condition = new Condition();

        $configs = $this->jarves->getConfigs()->getConfigs();
        $objects = [];
        foreach ($configs as $bundleConfig) {
            if (!$bundleConfig->getObjects()) {
                continue;
            }

            foreach ($bundleConfig->getObjects() as $object) {
                if ('jarves/file' !== $object->getKey()) {
                    $objects[] = $object;
                }
            }
        }

        $objects[] = $this->jarves->getConfigs()->getObject('jarves/file');

        foreach ($objects as $object) {
            /** @var AbstractStorage $storage */
            $storage = $storageFactory->createStorage($object);

            try {
                if ($searchResult = $storage->search($query, clone $condition)) {
                    $result['items'][$object->getKey()] = $searchResult;
                };
            } catch (\Exception $e) {
                $result['errors'][$object->getKey()] = get_class($e) . ': ' . $e->getMessage();
            }
        }

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Clears the cache"
     * )
     *
     * @Rest\Delete("/admin/backend/cache")
     *
     * @return bool
     */
    public function clearCacheAction()
    {
        /** @var Cacher $cacher */
        $cacher = $this->get('jarves.cache.cacher');

        /** @var \AppKernel $kernel */
        $kernel = $this->get('kernel');

        /** @var Filesystem $localFilesystem */
        $localFilesystem = $this->get('jarves.filesystem.local');
        $localFilesystem->remove($kernel->getCacheDir());
        $localFilesystem->mkdir($kernel->getCacheDir());

        $localFilesystem->remove('web/cache');
        $localFilesystem->mkdir('web/cache');

        /** @var StorageFactory $storageFactory */
        $storageFactory = $this->get('jarves.storage_factory');

        foreach ($this->jarves->getConfigs()->getConfigs() as $bundleConfig) {
            $cacher->invalidateCache($bundleConfig->getName());

            if ($bundleConfig->getObjects()) {
                foreach ($bundleConfig->getObjects() as $object) {
                    /** @var AbstractStorage $storage */
                    $storage = $storageFactory->createStorage($object);
                    $storage->clearCache();
                }
            }
        }

        return true;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Saves user settings"
     * )
     *
     * @Rest\RequestParam(name="settings", map=true)
     *
     * @Rest\Post("/admin/backend/user-settings")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function saveUserSettingsAction(ParamFetcher $paramFetcher)
    {
        $settings = $paramFetcher->get('settings');

        $properties = new Properties($settings);

        if ($this->pageStack->getAdminClient()->getUser()->getId() > 0) {
            $this->pageStack->getAdminClient()->getUser()->setSettings($properties);

            return $this->pageStack->getAdminClient()->getUser()->save();
        }

        return false;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Prints the javascript file content of $bundle and $code."
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="code", requirements=".+", strict=true, description="Slash separated entry point path")
     * @Rest\QueryParam(name="onLoad", requirements=".+", strict=true, description="onLoad id")
     * @Rest\Get("/admin/backend/custom-js")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return string javascript
     */
    public function getCustomJsAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $code = $paramFetcher->get('code');
        $onLoad = $paramFetcher->get('onLoad');

        $module = preg_replace('[^a-zA-Z0-9_-]', '', $bundle);
        $code = preg_replace('[^a-zA-Z0-9_-]', '', $code);
        $onLoad = preg_replace('[^a-zA-Z0-9_-]', '', $onLoad);

        $bundle = $this->jarves->getBundle($module);

        $file = $bundle->getPath() . '/Resources/public/admin/js/' . $code . '.js';

        if (!file_exists($file)) {
            $content = "contentCantLoaded_" . $onLoad . "('$file');\n";
        } else {
            $content = file_get_contents($file);
            $content .= "\n";
            $content .= "contentLoaded_" . $onLoad . '();' . "\n";
        }

        $response = new Response($content);
        $response->headers->set('Content-Type', 'text/javascript');

        return $response;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Returns a array with settings for the administration interface"
     * )
     *
     * items:
     *  modules
     *  configs
     *  layouts
     *  contents
     *  navigations
     *  themes
     *  themeProperties
     *  user
     *  groups
     *  langs
     *
     *  Example: settings?keys[]=modules&keys[]=layouts
     *
     * @Rest\QueryParam(name="keys", map=true, requirements=".+", description="List of config keys to filter"))
     *
     * @Rest\Get("/admin/backend/settings")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getSettingsAction(ParamFetcher $paramFetcher)
    {
        $keys = $paramFetcher->get('keys');

        $loadKeys = $keys;
        if (!$loadKeys) {
            $loadKeys = false;
        }

        $res = array();

        if ($loadKeys == false || in_array('modules', $loadKeys)) {
            foreach ($this->jarves->getConfigs() as $config) {
                $res['bundles'][] = $config->getBundleName();
            }
        }

        if ($loadKeys == false || in_array('configs', $loadKeys)) {
            $res['configs'] = $this->jarves->getConfigs()->toArray();
        }

        if (
            $loadKeys == false || in_array('themes', $loadKeys)
        ) {
            foreach ($this->jarves->getConfigs() as $key => $config) {
                if ($config->getThemes()) {
                    foreach ($config->getThemes() as $themeTitle => $theme) {
                        /** @var $theme \Jarves\Configuration\Theme */
                        $res['themes'][$theme->getId()] = $theme->toArray();
                    }
                }
            }
        }

        if ($loadKeys == false || in_array('upload_max_filesize', $loadKeys)) {
            $v = ini_get('upload_max_filesize');
            $v2 = ini_get('post_max_size');
            $b = $this->toBytes(($v < $v2) ? $v : $v2);
            $res['upload_max_filesize'] = $b;
        }

        if ($loadKeys == false || in_array('groups', $loadKeys)) {
            $res['groups'] = GroupQuery::create()->find()->toArray(null, null, TableMap::TYPE_CAMELNAME);
        }

        if ($loadKeys == false || in_array('user', $loadKeys)) {
            if ($settings = $this->pageStack->getAdminClient()->getUser()->getSettings()) {
                if ($settings instanceof Properties) {
                    $res['user'] = $settings->toArray();
                }
            }

            if (!isset($res['user'])) {
                $res['user'] = array();
            }
        }

        if ($loadKeys == false || in_array('system', $loadKeys)) {
            $system = clone $this->jarves->getSystemConfig();
            $system->setDatabase(null);
            $system->setPasswordHashKey('');
            $res['system'] = $system->toArray();
        }

        if ($loadKeys == false || in_array('domains', $loadKeys)) {
            $res['domains'] = $this->container->get('jarves.objects')->getList(
                'JarvesBundle:Domain',
                null,
                array('permissionCheck' => true)
            );
        }

        if ($loadKeys == false || in_array('langs', $loadKeys)) {
            $codes = Tools::listToArray($this->jarves->getSystemConfig()->getLanguages());
            $query = LanguageQuery::create()->filterByCode($codes);

            $tlangs = $query->find()->toArray(
                null,
                null,
                TableMap::TYPE_CAMELNAME
            );

            $langs = [];
            foreach ($tlangs as $lang) {
                $langs[$lang['code']] = $lang;
            }
            #$langs = dbToKeyIndex($tlangs, 'code');
            $res['langs'] = $langs;
        }

        return $res;
    }

    /**
     * @param string $val
     * @return int
     */
    protected function toBytes($val)
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        switch ($last) {
            // The 'G' modifier is available since PHP 5.1.0
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }

        return $val;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Prints compressed script map"
     * )
     *
     * @Rest\Get("/admin/backend/script-map")
     */
    public function loadJsMapAction()
    {
        $this->loadJsAction();
    }

    /**
     * This is a try to increase initial loading performance, but I wasn't lucky.
     *
     * @ApiDoc(
     *  section="Backend",
     *  description="Prints all typscript modules combined"
     * )
     *
     * @Rest\Get("/admin/backend/typescript-modules.ts")
     *
     * @return string CCS
     */
    public function loadTypescriptModules()
    {
        $newestMTime = 0;
        $jsContent = '';

        foreach ($this->jarves->getConfigs() as $bundleConfig) {
            $path = $bundleConfig->getBundleClass()->getPath();

            $assetInfos = $bundleConfig->getAdminPreloadTypescriptModulesInfo();

            foreach ($assetInfos as $assetInfo) {
                $localPath = $this->jarves->resolveInternalPublicPath($assetInfo->getPath());
                $mtime = filemtime($localPath);
                $newestMTime = max($newestMTime, $mtime);

                $content = file_get_contents($localPath);
                $moduleName = sprintf(
                    './bundles/%s/%s',
                    $bundleConfig->getName(),
                    Tools::getRelativePath($localPath, $path . '/Resources/public/')
                );
                $jsContent .= "\n/* ts file $moduleName */\ndeclare module \"$moduleName\" {\n$content\n};\n";
            }
        }

        $ifModifiedSince = $this->pageStack->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $newestMTime)) {
            // Client's cache IS current, so we just respond '304 Not Modified'.

            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $newestMTime) . ' GMT');

            return $response;
        }

        $expires = 60 * 60 * 24 * 14; //2 weeks
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

//        $content = implode($files);

        $response->setContent($jsContent);

        return $response;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Prints all CSS files combined"
     * )
     *
     * @Rest\Get("/admin/backend/css")
     *
     * @return string CCS
     */
    public function loadCssAction()
    {
        $oFile = $this->jarves->getRootDir() . '/../web/cache/admin.style-compiled.css';
        $md5String = '';

        /** @var \Jarves\AssetHandler\Container $assetHandlerContainer */
        $assetHandlerContainer = $this->container->get('jarves.asset_handler.container');

        $files = [];
        foreach ($this->jarves->getConfigs() as $bundleConfig) {
            foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                if (!$assetInfo->isCompressionAllowed()) {
                    continue;
                }

                if ($assetInfo->isStylesheet()) {
                    $path = $this->jarves->resolveWebPath($assetInfo->getPath());
                    if (file_exists($path)) {
                        $files[] = $assetInfo->getPath();
                        $md5String .= filemtime($path);
                    }
                }

                if ($assetInfo->isScss()) {
                    $path = $this->jarves->resolveWebPath($assetInfo->getPath());
                    if (file_exists($path)) {
                        foreach ($assetHandlerContainer->compileAsset($assetInfo) as $subAssetInfo) {
                            $files[] = $subAssetInfo->getPath();
                        }
                        $md5String .= filemtime($path);
                    }
                }
            }
        }

        $handle = @fopen($oFile, 'r');
        $fileUpToDate = false;
        $md5Line = '/* ' . md5($md5String) . "*/\n";

        if ($handle) {
            $line = fgets($handle);
            fclose($handle);
            if ($line == $md5Line) {
                $fileUpToDate = true;
            }
        }

        if (!$fileUpToDate) {
            $content = $this->utils->compressCss(
                $files,
                $this->jarves->getAdminPrefix() . 'admin/backend/'
            );
            $content = $md5Line . $content;
            file_put_contents($oFile, $content);
        }


        $expires = 60 * 60 * 24 * 14;

        $response = new Response(file_get_contents($oFile));
        $response->headers->set('Content-Type', 'text/css');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

        return $response;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Prints all JavaScript files combined"
     * )
     *
     * @Rest\QueryParam(name="printSourceMap", requirements=".+", description="If the sourceMap should printed")
     *
     * @Rest\Get("/admin/backend/script")
     *
     * @return string javascript
     */
    public function loadJsAction()
    {
        $assets = array();
        $md5String = '';
        $newestMTime = 0;

        $jsContent = '';

        foreach ($this->jarves->getConfigs() as $bundleConfig) {
            foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                if (!$assetInfo->isJavaScript()) {
                    continue;
                }
                if (!$assetInfo->isCompressionAllowed()) {
                    continue;
                }

                $path = $this->jarves->resolveWebPath($assetInfo->getPath());
                if (file_exists($path)) {
                    $assets[] = $assetInfo->getPath();
                    $mtime = filemtime($path);
                    $newestMTime = max($newestMTime, $mtime);
                    $md5String .= ">$path.$mtime<";
                    $content = file_get_contents($path);
                    $jsContent .= "\n/* file: {$assetInfo->getPath()} */\n$content\n";
                }
            }
        }

        $ifModifiedSince = $this->pageStack->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $newestMTime)) {
            // Client's cache IS current, so we just respond '304 Not Modified'.

            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $newestMTime) . ' GMT');

            return $response;
        }

        $expires = 60 * 60 * 24 * 14; //2 weeks
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

//        $content = implode($files);

        $response->setContent($jsContent);

        return $response;
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Returns all available menu/entryPoint items for the main navigation bar in the administration"
     * )
     *
     * @Rest\View()
     * @Rest\Get("/admin/backend/menus")
     *
     * @return array
     */
    public function getMenusAction()
    {
        $entryPoints = array();

        foreach ($this->jarves->getConfigs() as $bundleName => $bundleConfig) {
            foreach ($bundleConfig->getAllEntryPoints() as $subEntryPoint) {
                $path = $subEntryPoint->getFullPath();

                if (substr_count($path, '/') <= 3) {
                    if ($subEntryPoint->isLink()) {
                        if ($this->acl->check('jarvesbundle:entryPoint', '/' . $path)) {
                            $entryPoints[$path] = array(
                                'label' => $subEntryPoint->getLabel(),
                                'icon' => $subEntryPoint->getIcon(),
                                'fullPath' => $path,
                                'path' => $subEntryPoint->getPath(),
                                'type' => $subEntryPoint->getType(),
                                'system' => $subEntryPoint->getSystem(),
                                'templateUrl' => $subEntryPoint->getTemplateUrl(),
                                'level' => substr_count($path, '/')
                            );
                        }
                    }
                }
            }
        }

        return $entryPoints;
    }

    /**
     * @param string $code
     * @param string $value
     * @return array
     */
    protected function getChildMenus($code, $value)
    {
        $links = array();
        foreach ($value['children'] as $key => $value2) {

            if ($value2['children']) {

                $childs = $this->getChildMenus($code . "/$key", $value2);
                if (count($childs) == 0) {
                    //if ($this->jarves->checkUrlAccess($code . "/$key")) {
                    unset($value2['children']);
                    $links[$key] = $value2;
                    //}
                } else {
                    $value2['children'] = $childs;
                    $links[$key] = $value2;
                }

            } else {
                //if ($this->jarves->checkUrlAccess($code . "/$key")) {
                $links[$key] = $value2;
                //}
            }
            if ((!$links[$key]['type'] && !$links[$key]['children']) || $links[$key]['isLink'] === false) {
                unset($links[$key][$key]);
            }

        }

        return $links;
    }

}
