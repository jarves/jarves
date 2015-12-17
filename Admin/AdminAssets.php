<?php

namespace Jarves\Admin;


use Jarves\Jarves;
use Jarves\Model\DomainQuery;

class AdminAssets
{

    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param \Jarves\Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function appendAngularTemplates()
    {
        $response = $this->getJarves()->getPageResponse();

        foreach ($this->getJarves()->getConfigs() as $bundle) {
            $templates = $bundle->getAdminAngularTemplatesInfo();
            foreach ($templates as $template) {
                $publicPath = $this->getJarves()->resolvePublicWebPath($template->getPath());
                $localPath = $this->getJarves()->resolveInternalPublicPath($template->getPath());

                $content = file_get_contents($localPath);
                $content = str_replace('</script>', '', $content);
                $response->addHeader('<script type="text/ng-template" id="' . $publicPath. '">' . $content . '</script>');
            }
        }
    }

    public function addSessionScripts()
    {
        $response = $this->getJarves()->getPageResponse();

        $client = $this->getJarves()->getAdminClient();
        if (!$client) {
            $client = $this->getJarves()->getClient();
        }

        $session = array();
        $session['userId'] = $client->getUserId();
        $session['sessionid'] = $client->getToken();
        $session['tokenid'] = $client->getTokenId();
        $session['lang'] = $client->getSession()->getLanguage();
        $session['access'] = $this->getJarves()->getACL()->check('JarvesBundle:EntryPoint', '/admin');
        if ($client->getUserId()) {
            $session['username'] = $client->getUser()->getUsername();
            $session['lastLogin'] = $client->getUser()->getLastlogin();
            $session['firstName'] = $client->getUser()->getFirstName();
            $session['lastName'] = $client->getUser()->getLastName();

            $email = $client->getUser()->getEmail();
            $session['emailMd5'] = $email ? md5(strtolower(trim($email))) : null;
            $session['imagePath'] = $client->getUser()->getImagePath();
        }

        $css = 'window._session = ' . json_encode($session) . ';';
        $response->addJs($css);
    }

    public function addLanguageResources()
    {
        $response = $this->getJarves()->getPageResponse();
        $prefix = substr($this->getJarves()->getAdminPrefix(), 1);

        $response->addJsFile($prefix . '/admin/ui/languages');
//        $response->addJsFile($prefix . '/admin/ui/language?lang=en&javascript=1');
        $response->addJsFile($prefix . '/admin/ui/language-plural?lang=en');
    }

    public function addMainResources($options = array())
    {
        $response = $this->getJarves()->getPageResponse();
        $request = $this->getJarves()->getRequest();
        $options['noJs'] = isset($options['noJs']) ? $options['noJs'] : false;

        $prefix = substr($this->getJarves()->getAdminPrefix(), 1);

        $response->addJs(
            '
        window._baseUrl = ' . json_encode($request->getBasePath() . '/') . '
        window._baseUrlApi = ' . json_encode($request->getBaseUrl() . '/'),
            3000
        );

        if ($this->getJarves()->getKernel()->isDebug()) {
            foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
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

            foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
                foreach ($bundleConfig->getAdminAssetsInfo() as $assetInfo) {
                    if ($options['noJs'] && $assetInfo->isJavaScript()) {
                        continue;
                    }

                    if ($assetInfo->getPath()) {
                        // load javascript files, that are not accessible (means those point to a controller)
                        // because those can't be compressed
                        $path = $this->getJarves()->resolveWebPath($assetInfo->getPath());
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
        $page = $this->getJarves()->getCurrentPage();

        $response = $this->getJarves()->getPageResponse();

        // TODO, remove mootools dependency. WE NEED MOOTOOLS PRIME FOR THAT!
        $response->addJsFile('@JarvesBundle/admin/mootools-core-1.4.5-fixed-memory-leak.js');
        $response->addJsFile('@JarvesBundle/admin/mootools-more.js');

        //$response->addJs('jarves = parent.jarves;');

        $response->setResourceCompression(false);
        $response->setDomainHandling(false);

        $request = $this->getJarves()->getRequest();

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