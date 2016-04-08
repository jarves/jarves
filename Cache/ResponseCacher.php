<?php

namespace Jarves\Cache;

use Jarves\Exceptions\FileNotFoundException;
use Jarves\Jarves;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
use Jarves\PluginResponse;
use Jarves\PluginResponseInterface;
use Symfony\Component\Templating\EngineInterface;

class ResponseCacher
{
    /**
     * @var Jarves
     */
    private $jarves;
    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var EngineInterface
     */
    private $templating;
    /**
     * @var PageStack
     */
    private $pageStack;
    /**
     * @var PageResponseFactory
     */
    private $pageResponseFactory;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param Cacher $cacher
     * @param EngineInterface $templating
     * @param PageResponseFactory $pageResponseFactory
     */
    public function __construct(Jarves $jarves, PageStack $pageStack, Cacher $cacher,
                                EngineInterface $templating, PageResponseFactory $pageResponseFactory)
    {
        $this->jarves = $jarves;
        $this->cacher = $cacher;
        $this->templating = $templating;
        $this->pageStack = $pageStack;
        $this->pageResponseFactory = $pageResponseFactory;
    }

    /**
     * @param string $view
     *
     * @return mixed
     *
     * @throws FileNotFoundException
     * @throws \Jarves\Exceptions\BundleNotFoundException
     */
    public function getViewMTime($view)
    {
        $view = $this->jarves->resolvePath($view, 'Resources/views/');

        if (!file_exists($view)) {
            throw new FileNotFoundException(sprintf('File `%s` not found.', $view));
        }

        return filemtime($view);
    }


    /**
     * Returns a rendered view. If we find data behind the given cache
     * it uses this data instead of calling $data. So this function
     * does not cache the whole rendered html. To do so use renderFullCache().
     *
     * In this cache method, the template engine is always called. If you want to cache
     * this as well, use renderFullCached().
     *
     * Example:
     *
     *  return $this->renderCache('myCache', 'plugin1/default.tpl', function(){
     *     return array('items' => heavyDbQuery());
     * });
     *
     * Note: The $data callable is only called if the cache needs to regenerate.
     * If the callable $data returns NULL, then this will return NULL, too.
     *
     * @param string $cacheKey
     * @param string $view
     * @param array|callable $data Pass the data as array or a data provider function.
     *
     * @see method `render` to get more information.
     *
     * @return string
     */
    public function renderCached($cacheKey, $view, $data = null)
    {
        $cache = $this->cacher->getDistributedCache($cacheKey);
        $mTime = $this->getViewMTime($view);

        if (!$cache || !$cache['data'] || !is_array($cache) || $mTime != $cache['fileMTime']) {

            $data2 = $data;
            if (is_callable($data)) {
                $data2 = call_user_func($data, $view);
                if ($data2 === null) {
                    return null;
                }
            }

            $cache = array(
                'data' => $data2,
                'fileMTime' => $mTime
            );

            $this->cacher->setDistributedCache($cacheKey, $cache);
        }

        return $this->pageResponseFactory->createPluginResponse($this->templating->render($view, $cache['data']));
    }

    /**
     * Returns a rendered view. If we find html behind the given cache
     * it returns this directly. This is a couple os ms faster than `renderCached`
     * since the template engine is never used when there's a valid cache.
     *
     * Example:
     *
     *  return $this->renderFullCached('myCache', 'plugin1/default.tpl', function(){
     *     return array('items' => heavyDbQuery());
     * });
     *
     * Note: The $data callable is only called if the cache needs to regenerate.
     *
     * If the callable $data returns NULL, then this will return NULL, too, without entering
     * the actual rendering process.
     *
     * @param string $cacheKey
     * @param string $view
     * @param array|callable $data Pass the data as array or a data provider function.
     * @param integer $lifeTime In seconds. Default is one hour/3600 seconds.
     * @param bool $force Force to bypass the cache and always call $data. For debuggin purposes.
     *
     * @see method `render` to get more information.
     *
     * @return PluginResponseInterface|null
     */
    public function renderFullCached($cacheKey, $view, $data = null, $lifeTime = null, $force = false)
    {
        $cache = $this->cacher->getDistributedCache($cacheKey);
        $mTime = $this->getViewMTime($view);

        if (!is_string($cache)) {
            $cache = null;
        } else {
            $cache = unserialize($cache);
        }

        if ($force || !$cache || !$cache['content'] || !is_array($cache) || $mTime != $cache['fileMTime']) {

            $oldResponse = clone $this->pageStack->getPageResponse();

            $data2 = $data;
            if (is_callable($data)) {
                $data2 = call_user_func($data, $view);
                if (null === $data2) {
                    //the data callback returned NULL so this means
                    //we aren't the correct controller for this request
                    //or the request contains invalid input
                    return null;
                }
            }

            $content = $this->templating->render($view, $data2);
            $response = $this->pageStack->getPageResponse();
            $diff = $oldResponse->diff($response);

            $cache = array(
                'content' => $content,
                'fileMTime' => $mTime,
                'responseDiff' => $diff
            );

            $this->cacher->setDistributedCache($cacheKey, serialize($cache), $lifeTime ?: 3600);

        } else if ($cache['responseDiff']) {
            $this->pageStack->getPageResponse()->patch($cache['responseDiff']);
        }

        return $this->pageResponseFactory->createPluginResponse($cache['content']);
    }
}