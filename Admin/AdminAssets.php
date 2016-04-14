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

namespace Jarves\Admin;


use Jarves\ACL;
use Jarves\ACLRequest;
use Jarves\Jarves;
use Jarves\Model\DomainQuery;
use Jarves\PageStack;

class AdminAssets
{

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var ACL
     */
    private $acl;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param ACL $acl
     */
    function __construct(Jarves $jarves, PageStack $pageStack, ACL $acl)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
        $this->acl = $acl;
    }

    public function appendAngularTemplates()
    {
        $response = $this->pageStack->getPageResponse();

        foreach ($this->jarves->getConfigs() as $bundle) {
            $templates = $bundle->getAdminAngularTemplatesInfo();
            foreach ($templates as $template) {
                $publicPath = $this->jarves->resolvePublicWebPath($template->getPath());
                $localPath = $this->jarves->resolveInternalPublicPath($template->getPath());

                $content = file_get_contents($localPath);
                $content = str_replace('</script>', '', $content);
                $response->addHeader('<script type="text/ng-template" id="' . $publicPath. '">' . $content . '</script>');
            }
        }
    }

    public function addSessionScripts()
    {
        $response = $this->pageStack->getPageResponse();


        $session = array();
        $session['userId'] = null;
        $session['lang'] = 'en';

        if ($this->pageStack->getSession() && $this->pageStack->getSession()->has('admin_language')) {
            $session['lang'] = $this->pageStack->getSession()->get('admin_language');
        }

        $session['access'] = $this->acl->check(ACLRequest::create('jarves/entryPoint', '/admin'));

        if ($this->pageStack->isLoggedIn()) {
            $user = $this->pageStack->getUser();
            $session['userId'] = $user->getId();
            $session['username'] = $user->getUsername();
            $session['lastLogin'] = $user->getLastLogin();
            $session['firstName'] = $user->getFirstName();
            $session['lastName'] = $user->getLastName();

//            $email = $user->getEmail();
//            $session['emailMd5'] = $email ? md5(strtolower(trim($email))) : null;
            $session['imagePath'] = $user->getImagePath();
        }

        $session['token'] = get_class($this->pageStack->getToken());
        $css = 'window._session = ' . json_encode($session) . ';';
        $response->addJs($css);
    }

    public function addLanguageResources()
    {
        $response = $this->pageStack->getPageResponse();
        $prefix = substr($this->jarves->getAdminPrefix(), 1);

        $response->addJsFile($prefix . '/admin/ui/languages');
        $response->addJsFile($prefix . '/admin/ui/language?lang=en&javascript=1');
        $response->addJsFile($prefix . '/admin/ui/language-plural?lang=en');
    }

    public function addMainResources($options = array())
    {
        $response = $this->pageStack->getPageResponse();
        $request = $this->pageStack->getRequest();
        $options['noJs'] = isset($options['noJs']) ? $options['noJs'] : false;

        $prefix = substr($this->jarves->getAdminPrefix(), 1);

        $response->addJs(
            '
        window._path = window._baseUrl = ' . json_encode($request->getBasePath() . '/') . '
        window._pathAdmin = ' . json_encode($request->getBaseUrl() . '/' . $prefix . '/')
        , 3001);

        if ($this->jarves->isDebugMode()) {
            foreach ($this->jarves->getConfigs() as $bundleConfig) {
                foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                    if ($options['noJs'] && $assetInfo->isJavaScript()) {
                        continue;
                    }

                    $response->addAsset($assetInfo);
                }
            }
        } else {
            $response->addCssFile($prefix . '/admin/backend/css');
            if (!$options['noJs']) {
                $response->addJsFile($prefix . '/admin/backend/script', 3000);
            }

            foreach ($this->jarves->getConfigs() as $bundleConfig) {
                foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                    if ($options['noJs'] && $assetInfo->isJavaScript()) {
                        continue;
                    }

                    if ($assetInfo->getPath()) {
                        // load javascript files, that are not accessible (means those point to a controller)
                        // because those can't be compressed
                        $path = $this->jarves->resolveWebPath($assetInfo->getPath());
                        if (!file_exists($path)) {
                            $response->addAsset($assetInfo);
                            continue;
                        }
                    }

                    if ($assetInfo->getContent()) {
                        // load inline assets because we can't compress those
                        $response->addAsset($assetInfo);
                        continue;
                    }

                    if (!$assetInfo->isCompressionAllowed()) {
                        $response->addAsset($assetInfo);
                    }
                }
            }
        }

        $response->setDocType('JarvesBundle:Admin:index.html.twig');
        $response->addHeader('<meta name="viewport" content="initial-scale=1.0" >');
        $response->addHeader('<meta name="apple-mobile-web-app-capable" content="yes">');

        $response->setResourceCompression(false);
    }

    public function handleKEditor()
    {
        $this->addMainResources(['noJs' => true]);
        $this->addSessionScripts();
        $page = $this->pageStack->getCurrentPage();

        $response = $this->pageStack->getPageResponse();

        // TODO, remove mootools dependency. WE NEED MOOTOOLS PRIME FOR THAT!
        $response->addJsFile('@JarvesBundle/admin/mootools-core-1.4.5-fixed-memory-leak.js');
        $response->addJsFile('@JarvesBundle/admin/mootools-more.js');

        //$response->addJs('jarves = parent.jarves;');

        $response->setResourceCompression(false);
        $response->setDomainHandling(false);

        $request = $this->pageStack->getRequest();

        $nodeArray['id'] = $page->getId();
        $nodeArray['title'] = $page->getTitle();
        $nodeArray['domainId'] = $page->getDomainId();
        $nodeArray['theme'] = $page->getTheme();
        $nodeArray['layout'] = $request->query->get('_jarves_editor_layout') ?: $page->getLayout();

        $domain = DomainQuery::create()->findPk($page->getDomainId());
        $domainArray['id'] = $domain->getId();
        $domainArray['domain'] = $domain->getDomain();
        $domainArray['path'] = $domain->getPath();
        $domainArray['theme'] = $domain->getTheme();
        $domainArray['themeProperties'] = $domain->getThemeProperties();

        $options = [
            'id' => $request->query->get('_jarves_editor_id'),
            'node' => $nodeArray,
            'domain' => $domainArray
        ];

        if (is_array($extraOptions = $request->query->get('_jarves_editor_options'))) {
            $options = array_merge($options, $extraOptions);
            $options['standalone'] = filter_var($options['standalone'], FILTER_VALIDATE_BOOLEAN);
        }

        $response->addJsAtBottom(
            'window.editor = new parent.jarves.Editor(' . json_encode($options) . ', document.documentElement);'
        );
    }

} 