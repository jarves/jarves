<?php

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Admin\Utils;
use Jarves\Jarves;
use Jarves\Model\Base\GroupQuery;
use Jarves\Model\LanguageQuery;
use Jarves\Properties;
use Jarves\Tools;
use Propel\Runtime\Map\TableMap;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\Response;

class BackendController extends Controller
{
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
        $utils = new Utils($this->getJarves());

        $utils->clearCache();

        return true;
    }

    /**
     * @return Jarves
     */
    protected function getJarves()
    {
        return $this->get('jarves');
    }

    /**
     * @ApiDoc(
     *  section="Backend",
     *  description="Saves user settings"
     * )
     *
     * @Rest\RequestParam(name="settings", array=true)
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

        if ($this->getJarves()->getAdminClient()->getUser()->getId() > 0) {
            $this->getJarves()->getAdminClient()->getUser()->setSettings($properties);
            return $this->getJarves()->getAdminClient()->getUser()->save();
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

        $bundle = $this->getJarves()->getBundle($module);

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
     * @Rest\QueryParam(name="keys", array=true, requirements=".+", description="List of config keys to filter"))
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
            foreach ($this->getJarves()->getConfigs() as $config) {
                $res['bundles'][] = $config->getBundleName();
            }
        }

        if ($loadKeys == false || in_array('configs', $loadKeys)) {
            $res['configs'] = $this->getJarves()->getConfigs()->toArray();
        }

        if (
            $loadKeys == false || in_array('themes', $loadKeys)
        ) {
            foreach ($this->getJarves()->getConfigs() as $key => $config) {
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
            if ($settings = $this->getJarves()->getAdminClient()->getUser()->getSettings()) {
                if ($settings instanceof Properties) {
                    $res['user'] = $settings->toArray();
                }
            }

            if (!isset($res['user'])) {
                $res['user'] = array();
            }
        }

        if ($loadKeys == false || in_array('system', $loadKeys)) {
            $system = clone $this->getJarves()->getSystemConfig();
            $system->setDatabase(null);
            $system->setPasswordHashKey('');
            $res['system'] = $system->toArray();
        }

        if ($loadKeys == false || in_array('domains', $loadKeys)) {
            $res['domains'] = $this->getJarves()->getObjects()->getList('JarvesBundle:Domain', null, array('permissionCheck' => true));
        }

        if ($loadKeys == false || in_array('langs', $loadKeys)) {
            $codes = Tools::listToArray($this->getJarves()->getSystemConfig()->getLanguages());
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
        $this->loadJsAction(true);
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

        $oFile = $this->getJarves()->getKernel()->getRootDir(). '/../web/cache/admin.style-compiled.css';
        $md5String = '';

        $files = [];
        foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
            foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                if (!$assetInfo->isStylesheet()) continue;

                $path = $this->getJarves()->resolveWebPath($assetInfo->getPath());
                if (file_exists($path)) {
                    $files[] = $assetInfo->getPath();
                    $md5String .= filemtime($path);
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
            $content = $this->getJarves()->getUtils()->compressCss($files, $this->getJarves()->getAdminPrefix() . 'admin/backend/');
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
     * @param boolean $printSourceMap
     *
     * @return string javascript
     */
    public function loadJsAction($printSourceMap = null)
    {
        $printSourceMap = filter_var($printSourceMap, FILTER_VALIDATE_BOOLEAN);
        $oFile = 'cache/admin.script-compiled.js';

        $files = array();
        $assets = array();
        $md5String = '';
        $newestMTime = 0;

        foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
            foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                if (!$assetInfo->isJavaScript()) continue;

                $path = $this->getJarves()->resolveWebPath($assetInfo->getPath());
                if (file_exists($path)) {
                    $assets[] = $assetInfo->getPath();
                    $files[] = '--js ' . escapeshellarg($this->getJarves()->resolveInternalPublicPath($assetInfo->getPath()));
                    $mtime = filemtime($path);
                    $newestMTime = max($newestMTime, $mtime);
                    $md5String .= ">$path.$mtime<";
                }
            }
        }

        $ifModifiedSince = $this->getJarves()->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $newestMTime)) {
            // Client's cache IS current, so we just respond '304 Not Modified'.

            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $newestMTime).' GMT');
            return $response;
        }

        $expires = 60 * 60 * 24 * 14; //2 weeks
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

        $sourceMap = $oFile . '.map';
        $cmdTest = 'java -version';
        $closure = 'vendor/google/closure-compiler/compiler.jar';
        $compiler = escapeshellarg(realpath('../' . $closure));
        $cmd = 'java -jar ' . $compiler . ' --js_output_file ' . escapeshellarg($oFile);
        $returnVal = 0;
        $debugMode = false;

        if ($printSourceMap) {
            $content = file_get_contents($sourceMap);
            $content = str_replace('"bundles/', '"../../../bundles/', $content);
            $content = str_replace('"cache/admin.script-compiled.js', '"jarves/admin/backend/script.js', $content);
            $response->setContent($content);
            return $response;
        }

        $handle = @fopen($oFile, 'r');
        $fileUpToDate = false;
        $md5Line = '//' . md5($md5String) . "\n";

        if ($handle) {
            $line = fgets($handle);
            fclose($handle);
            if ($line == $md5Line) {
                $fileUpToDate = true;
            }
        }

        if ($fileUpToDate) {
            $content = file_get_contents($oFile);
            $response->setContent(substr($content, 35));
            return $response;
        } else {
            if (!$debugMode) {
                system($cmdTest, $returnVal);
            }

            if (0 === $returnVal) {
                $cmd .= ' --create_source_map ' . escapeshellarg($sourceMap);
                $cmd .= ' --source_map_format=V3';

                $cmd .= ' ' . implode(' ', $files);
                $cmd .= ' 2>&1';
                $output = shell_exec($cmd);
                if (0 !== strpos($output, 'Unable to access jarfile')) {
                    if (false !== strpos($output, 'ERROR - Parse error')) {
                        $content = 'alert(\'Parse Error\');';
                        $content .= $output;
                        $response->setContent($content);
                        return $response;
                    }
                    $content = file_get_contents($oFile);
                    $sourceMapUrl = '//@ sourceMappingURL=script-map';
                    $content = $md5Line . $content . $sourceMapUrl;
                    file_put_contents($oFile, $content);

                    $response->setContent(substr($content, 35));
                    return $response;
                }

            }


            $content = '';
            foreach ($assets as $assetPath) {
                $content .= "/* $assetPath */\n\n";
                $path = $this->getJarves()->resolvePath($assetPath, 'Resources/public');
                $content .= file_get_contents($path);
            }

            $response->setContent($content);
            return $response;
        }
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

        foreach ($this->getJarves()->getConfigs() as $bundleName => $bundleConfig) {
            foreach ($bundleConfig->getAllEntryPoints() as $subEntryPoint) {
                $path = $subEntryPoint->getFullPath();

                if (substr_count($path, '/') <= 3) {
                    if ($subEntryPoint->isLink()) {
                        if ($this->getJarves()->getACL()->check('jarvesbundle:entryPoint', '/' . $path)) {
                            $entryPoints[] = array(
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
                    //if ($this->getJarves()->checkUrlAccess($code . "/$key")) {
                    unset($value2['children']);
                    $links[$key] = $value2;
                    //}
                } else {
                    $value2['children'] = $childs;
                    $links[$key] = $value2;
                }

            } else {
                //if ($this->getJarves()->checkUrlAccess($code . "/$key")) {
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
