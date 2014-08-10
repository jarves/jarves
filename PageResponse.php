<?php

namespace Jarves;

use Jarves\AssetHandler\AssetInfo;
use Jarves\AssetHandler\CssHandler;
use Jarves\AssetHandler\JsHandler;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\File\FileInfo;
use Jarves\Model\Content;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Jarves\Controller\PageController;

/**
 * This is the response, we use to generate the basic html skeleton.
 * Ths actual body content comes from Core\PageController.
 */
class PageResponse extends Response
{
    /**
     * @var string
     */
    public $docType = 'JarvesBundle:Doctypes:html5.html.twig';

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * Use in <script and <link tags.
     *
     * @var string
     */
    protected $tagEndChar = '>';

    /**
     * @var string
     */
    protected $language = 'en';

    /**
     * All plugin responses. Mostly only one.
     *
     * @var array
     */
    protected $pluginResponse = [];

    /**
     * Asset files.
     *
     * @var array
     */
    protected $assets = [];

    /**
     * @var AssetInfo[]
     */
    protected $assetsInfo = [];

    /**
     * @var AssetInfo[]
     */
    protected $assetsInfoBottom = [];

    /**
     * @var string
     */
    protected $title;

    /**
     * All additional html>head elements.
     *
     * @var array
     */
    protected $header = array();

    /**
     * @var string
     */
    protected $body = '';

    /**
     * @var bool
     */
    protected $renderFrontPage = false;

    /**
     * @var bool
     */
    protected $domainHandling = true;

    /**
     * @var string
     */
    protected $favicon = '@JarvesBundle/images/favicon.ico';

    /**
     * @var bool
     */
    protected $resourceCompression = false;

    /**
     * @var StopwatchHelper
     */
    protected $stopwatch;

    /**
     * Constructor
     */
    public function __construct($content = '', $status = 200, $headers = array())
    {
        parent::__construct($content, $status, $headers);
    }

    /**
     * @param StopwatchHelper $stopwatch
     */
    public function setStopwatch($stopwatch)
    {
        $this->stopwatch = $stopwatch;
    }

    /**
     * @return StopwatchHelper
     */
    public function getStopwatch()
    {
        return $this->stopwatch;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves(Jarves $jarves)
    {
        $this->jarves = $jarves;
        $this->getJarves()->getRequest(); //trigger loading of the current request, otherwise we're out of scope
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    /**
     * @param string $favicon
     */
    public function setFavicon($favicon)
    {
        $this->favicon = $favicon;
    }

    /**
     * @return string
     */
    public function getFavicon()
    {
        return $this->favicon;
    }

    /**
     * @param string $tagEndChar
     */
    public function setTagEndChar($tagEndChar)
    {
        $this->tagEndChar = $tagEndChar;
    }

    /**
     * @return string
     */
    public function getTagEndChar()
    {
        return $this->tagEndChar;
    }

    /**
     * @param boolean $domainHandling
     */
    public function setDomainHandling($domainHandling)
    {
        $this->domainHandling = $domainHandling;
    }

    /**
     * @return bool
     */
    public function getDomainHandling()
    {
        return $this->domainHandling;
    }

    /**
     * @param string $body
     */
    public function setBody($body)
    {
        $this->body = $body;
    }

    /**
     * @return string
     */
    public function getBody()
    {
        return $this->body;
    }

    /**
     * @param boolean $renderFrontPage
     */
    public function setRenderFrontPage($renderFrontPage)
    {
        $this->renderFrontPage = $renderFrontPage;
    }

    /**
     * @return boolean
     */
    public function getRenderFrontPage()
    {
        return $this->renderFrontPage;
    }

    /**
     * @param bool $resourceCompression
     */
    public function setResourceCompression($resourceCompression)
    {
        $this->resourceCompression = $resourceCompression;
    }

    /**
     * @return bool
     */
    public function getResourceCompression()
    {
        return $this->resourceCompression;
    }

    /**
     * Adds a css file to the page.
     *
     * @param string $path
     * @param string $contentType
     */
    public function loadAssetFile($path, $contentType = null)
    {
        $this->injectAsset(array('path' => $path, 'contentType' => $contentType));
    }

    protected function injectAsset($definition)
    {
        $assetInfo = new AssetInfo();
        $assetInfo->setPath(@$definition['path']);
        $assetInfo->setOriginalPath(@$definition['path']);
        $assetInfo->setContent(@$definition['content']);
        $assetInfo->setContentType(@$definition['contentType']);

        $this->handleAsset($assetInfo);

        if ('bottom' === strtolower(@$definition['position'])) {
            $this->assetsInfoBottom[] = $assetInfo;
        } else {
            $this->assetsInfo[] = $assetInfo;
        }
    }

    /**
     * If needed the given asset gets compiled and $assetInfo will be modified.
     *
     * @param AssetInfo $assetInfo
     */
    public function handleAsset(&$assetInfo)
    {
        $assetHandlerContainer = $this->getJarves()->getAssetCompilerContainer();
        if ($assetInfo->getPath() && $compiler = $assetHandlerContainer->getCompileHandlerByFileExtension($assetInfo->getPath())) {
            if ($compiledAssetInfo = $compiler->compileFile($assetInfo->getPath())) {
                $assetInfo = $compiledAssetInfo;
            }
        }
    }

    /**
     * Adds a css file to the page.
     *
     * @param string $path
     * @param string $contentType
     */
    public function loadAssetFileAtBottom($path, $contentType = null)
    {
        $this->injectAsset(array('path' => $path, 'contentType' => $contentType, 'position' => 'bottom'));
    }

    /**
     * @param AssetInfo $assetInfo
     */
    public function addAsset(AssetInfo $assetInfo)
    {
        if (array_search($assetInfo, $this->assetsInfo) === false) {
            $this->handleAsset($assetInfo);
            $this->assetsInfo[] = $assetInfo;
        }
    }

    /**
     * @param string $file path to javascript file
     */
    public function addJsFile($file)
    {
        $this->loadAssetFile($file, 'text/javascript');
    }

    /**
     * @param string $script the actual javascript
     */
    public function addJs($script)
    {
        $this->injectAsset(array('content' => $script, 'contentType' => 'text/javascript'));
    }

    /**
     * @param string $style the actual css
     */
    public function addCss($style)
    {
        $this->injectAsset(array('content' => $style, 'contentType' => 'text/css'));
    }

    /**
     * @param string $script the actual javascript
     */
    public function addJsAtBottom($script)
    {
        $this->injectAsset(array('content' => $script, 'contentType' => 'text/javascript', 'position' => 'bottom'));
    }

    /**
     * @param string $file path to css file
     */
    public function addCssFile($file)
    {
        $this->loadAssetFile($file, 'text/css');
    }

    /**
     * @param \Jarves\AssetHandler\AssetInfo[] $assetsInfo
     */
    public function setAssetsInfo($assetsInfo)
    {
        $this->assetsInfo = $assetsInfo;
    }

    /**
     * @return \Jarves\AssetHandler\AssetInfo[]
     */
    public function getAssetsInfo()
    {
        return $this->assetsInfo;
    }

    /**
     * @param \Jarves\AssetHandler\AssetInfo[] $assetsInfoBottom
     */
    public function setAssetsInfoBottom($assetsInfoBottom)
    {
        $this->assetsInfoBottom = $assetsInfoBottom;
    }

    /**
     * @return \Jarves\AssetHandler\AssetInfo[]
     */
    public function getAssetsInfoBottom()
    {
        return $this->assetsInfoBottom;
    }

    /**
     * Adds a additionally HTML header element.
     *
     * @param string $content
     */
    public function addHeader($content)
    {
        $this->header[] = $content;
    }

    /**
     *
     */
    public function renderContent()
    {
        $this->getStopwatch()->start("Render PageResponse");
        $html = $this->buildHtml();
        $this->setContent($html);
        $this->getStopwatch()->stop("Render PageResponse");
    }

    public function prepare(Request $request)
    {
        parent::prepare($request);
        if (!$this->getContent()) {
            $this->renderContent();
        }
    }

    /**
     * Builds the HTML skeleton, sends all HTTP headers and the HTTP body.
     *
     * This handles the SearchEngine stuff as well.
     *
     * @return Response
     */
    public function send()
    {
        $this->setCharset('utf-8');
        $this->getJarves()->getEventDispatcher()->dispatch('core/page-response-send-pre');

        //search engine, todo
//        if (false && Jarves::$disableSearchEngine == false) {
//            SearchEngine::createPageIndex($this->getContent());
//        }

        return parent::send();
    }

    public function getFaviconPath()
    {
        return $this->getJarves()->resolvePublicWebPath($this->getFavicon());
    }

    public function buildHtml()
    {
        $body = $this->getBody();

        if ($this->getRenderFrontPage()) {
            $body = $this->buildBody();
        }

        $templating = $this->getJarves()->getTemplating();

        $data = [
            'pageResponse' => $this,
            'body' => $body,
            'additionalHeaderTags' => $this->getAdditionalHeaderTags()
        ];
        $data = array_merge($data, $this->getAssetTags());

        $html = $templating->render(
            $this->getDocType(),
            $data
        );

        $html = preg_replace(
            '/href="#([^"]*)"/',
            'href="' . $this->getJarves()->getRequest()->getBaseUrl() . '/' . '#$1"',
            $html
        );

//        $html = Jarves::parseObjectUrls($html);
//        $html = Jarves::translate($html);
//        Jarves::removeSearchBlocks($html);

        return $html;
    }

    /**
     * Builds the html header tag for the favicon.
     *
     * @return string
     */
    public function getFaviconTag()
    {
        if ($this->getFavicon()) {
            return sprintf(
                '<link rel="shortcut icon" type="image/x-icon" href="%s">' . chr(10),
                $this->getJarves()->resolveWebPath($this->getFavicon())
            );
        }
    }

    /**
     * Builds the html body of the current page.
     *
     * @return string
     */
    public function buildBody()
    {
        $this->getJarves()->getStopwatch()->start('Build PageBody');
        if (!$page = $this->getJarves()->getCurrentPage()) {
            return '';
        }

        $themeId = $page->getTheme() ?: $this->getJarves()->getCurrentDomain()->getTheme();
        if (!$theme = $this->getJarves()->getConfigs()->getTheme($themeId)) {
            throw new \Exception(sprintf('Theme `%s` not found.', $themeId));
        }

        if (!$layout = $theme->getLayoutByKey($page->getLayout())) {
            throw new \Exception(sprintf('Layout for `%s` in theme `%s` not found.', $page->getLayout(), $themeId));
        }
        $layoutPath = $layout->getFile();

        $template = $this->getJarves()->getTemplating();
        try {
            $html = $template->render(
                $layoutPath,
                array(
                    'baseUrl' => $this->getBaseHref(),
                    'themeProperties' => [] //Jarves::$themeProperties
                )
            );
        } catch(\Exception $e) {
            throw new \Exception(sprintf('Cant render view `%s` of theme `%s`.', $layoutPath, $themeId), 0, $e);
        }

        $this->getJarves()->getStopwatch()->stop('Build PageBody');

        return $html;
    }

    /**
     * Returns `<meta http-equiv="content-type" content="text/html; charset=%s">` based on $this->getCharset().
     *
     * @return string
     */
    public function getContentTypeTag()
    {
        return sprintf(
            '<meta http-equiv="content-type" content="text/html; charset=%s">' . chr(10),
            $this->getCharset()
        );
    }

    /**
     * Returns all additional html header elements.
     */
    public function getAdditionalHeaderTags()
    {
        return implode("\n    ", $this->header) . "\n";
    }

    /**
     * @return string
     */
    public function getDocType()
    {
        return $this->docType;
    }

    /**
     * The template path to the main html skeleton.
     *
     * Default is @JarvesBundle:Doctypes:html5.html.twig.
     *
     * @param string $docType
     */
    public function setDocType($docType)
    {
        $this->docType = $docType;
    }

    /**
     * @param string $language
     */
    public function setLanguage($language)
    {
        $this->language = $language;
    }

    /**
     * @return string
     */
    public function getLanguage()
    {
        return $this->language;
    }

    /**
     * @return string
     */
    public function getBaseHref()
    {
        return $this->getJarves()->getRequest()->getBasePath() . '/';
    }

//    /**
//     * Returns the `<base href="%s"` based on Core\Jarves::getBaseUrl().
//     *
//     * @return string
//     */
//    public function getBaseHrefTag()
//    {
//        return sprintf('<base href="%s" %s', $this->getJarves()->getRequest()->getBasePath().'/', $this->getTagEndChar());
//    }

//    /**
//     * Returns `<meta name="DC.language" content="%s">` filled with the language of the current domain.
//     *
//     * @return string
//     */
//    public function getMetaLanguageTag()
//    {
//        if ($this->getDomainHandling() && $this->getJarves()->getCurrentDomain()) {
//            return sprintf(
//                '<meta name="DC.language" content="%s" %s',
//                Jarves::$domain->getLang(),
//                $this->getTagEndChar()
//            );
//        }
//    }

//    /**
//     * Returns the title as html tag.
//     *
//     * @return string
//     */
//    public function getTitleTag()
//    {
//        if ($this->getDomainHandling() && $this->getJarves()->getCurrentDomain()) {
//            $title = Jarves::$domain->getTitleFormat();
//
//            if (Jarves::$page) {
//                $title = str_replace(
//                    array(
//                         '%title'
//                    ),
//                    array(
//                         Jarves::$page->getAlternativeTitle() ? : Jarves::$page->getTitle()
//                    )
//                    ,
//                    $title
//                );
//            }
//        } else {
//            $title = $this->getTitle();
//        }
//
//        return sprintf("<title>%s</title>\n", $title);
//    }

    /**
     * Sets the html title.
     *
     * @param string $title
     */
    public function setTitle($title)
    {
        $this->title = $title;
    }

    /**
     * Gets the html title.
     *
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @param array $assets
     */
    public function setAssets($assets)
    {
        $this->assets = $assets;
    }

    /**
     * @return array
     */
    public function getAssets()
    {
        return $this->assets;
    }


    /**
     * Compares two PageResponses and returns the difference as array/
     *
     * @param  PageResponse $response
     *
     * @return array
     */
    public function diff(PageResponse $response)
    {
        $diff = array();

        $blacklist = array('pluginResponse');

        foreach ($this as $key => $value) {
            if (in_array($key, $blacklist)) {
                continue;
            }
            $getter = 'get' . ucfirst($key);

            if (!is_callable(array($this, $getter))) {
                continue;
            }

            $particular = null;
            $other = $response->$getter();

            if (is_array($value)) {
                $particular = $this->arrayDiff($value, $other);
            } elseif ($value != $other) {
                $particular = $other;
            }

            if ($particular) {
                $diff[$key] = $particular;
            }
        }

        return $diff;
    }

    /**
     * @param  array $p1
     * @param  arry $p2
     *
     * @return array
     */
    public function arrayDiff($p1, $p2)
    {
        $diff = array();
        foreach ($p2 as $v) {
            if (array_search($v, $p1) === false) {
                $diff[] = $v;
            }
        }

        return $diff;
    }

    /**
     * Patches a diff from $this->diff().
     *
     * @param array $diff
     */
    public function patch(array $diff)
    {
        $refClass = new \ReflectionClass($this);
        $defaults = $refClass->getDefaultProperties();
        foreach ($diff as $key => $value) {
            if (is_array($value) && is_array($this->$key)) {
                $this->$key = array_merge($this->$key, $value);
            } else {
                if (isset($defaults[$key]) && $value != $defaults[$key]) {
                    $this->$key = $value;
                }
            }
        }
    }

    /**
     * @param \Symfony\Component\HttpFoundation\ResponseHeaderBag $headers
     */
    public function setHeaders($headers)
    {
        $this->headers = $headers;
    }

    /**
     * @return \Symfony\Component\HttpFoundation\ResponseHeaderBag
     */
    public function getHeaders()
    {
        return $this->headers;
    }

    /**
     *
     *
     * @param  PluginResponse $response
     *
     * @return PageResponse
     */
    public function setPluginResponse(PluginResponse $response)
    {
        /** @var $content Content */
        $content = $response->getControllerRequest()->attributes->get('_content');
        $this->pluginResponse[$content->getId()] = $response;

        return $this;
    }

    /**
     * @return string
     */
    public function getAssetTags()
    {
        $assetHandlerContainer = $this->getJarves()->getAssetCompilerContainer();

        /** @var $assets \Jarves\AssetHandler\AssetInfo[] */
        $assetsTop = $this->assetsInfo;
        $assetsBottom = $this->assetsInfoBottom;

        $tagsJsTop = '';
        $tagsCssTop = '';
        $tagsJsBottom = '';
        $tagsAssets = '';

        $assetsTopGrouped =[];
        $assetsBottomGrouped = [];

        /** @var \Jarves\AssetHandler\LoaderHandlerInterface[] $loaderMap */
        $loaderMap = [];

        // group all asset per loader
        foreach ($assetsTop as $asset) {
            if ($asset->getContentType()) {
                $loader = $assetHandlerContainer->getLoaderHandlerByContentType($asset->getContentType());
            } else {
                $loader = $assetHandlerContainer->getLoaderHandlerByExtension($asset->getPath());
            }

            if ($loader) {
                $loaderMap[spl_object_hash($loader)] = $loader;
                $assetsTopGrouped[spl_object_hash($loader)][] = $asset;
            }
        }

        // todo, remove duplicate code
        foreach ($assetsBottom as $asset) {
            if ($asset->getContentType()) {
                $loader = $assetHandlerContainer->getLoaderHandlerByContentType($asset->getContentType());
            } else {
                $loader = $assetHandlerContainer->getLoaderHandlerByExtension($asset->getPath());
            }

            if ($loader) {
                $loaderMap[spl_object_hash($loader)] = $loader;
                $assetsBottomGrouped[spl_object_hash($loader)][] = $asset;
            }
        }

        // generate tags top
        foreach ($assetsTopGrouped as $loaderHash => $assets) {
            $loader = $loaderMap[$loaderHash];
            $tags = implode("\n", (array)$loader->getTags($assets, $this->getResourceCompression()));

            if ($loader instanceof CssHandler) {
                $tagsCssTop = $tags;
            } else if ($loader instanceof JsHandler) {
                $tagsJsTop = $tags;
            } else {
                $tagsAssets = $tags;
            }
        }

        // generate tags bottom
        foreach ($assetsBottomGrouped as $loaderHash => $assets) {
            $loader = $loaderMap[$loaderHash];
            $tags = implode("\n", (array)$loader->getTags($assets, $this->getResourceCompression()));

            if ($loader instanceof JsHandler) {
                $tagsJsBottom = $tags;
            }
        }

        return [
            'jsTags' => $tagsJsTop,
            'cssTags' => $tagsCssTop,
            'jsTagsBottom' => $tagsJsBottom,
            'assetTags' => $tagsAssets
        ];
    }

    /**
     *
     * @param Content $content
     *
     * @return string
     */
    public function getPluginResponse($content)
    {
        $id = $content;
        if ($content instanceof Content) {
            $id = $content->getId();
        }

        return isset($this->pluginResponse[$id]) ? $this->pluginResponse[$id] : '';
    }

}
