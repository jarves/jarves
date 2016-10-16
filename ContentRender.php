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

use Jarves\Cache\Cacher;
use Jarves\ContentTypes\AbstractType;
use Jarves\ContentTypes\ContentRendererAwareContentType;
use Jarves\Model\Base\ContentQuery;
use Jarves\Model\Content;
use Jarves\ContentTypes\TypeNotFoundException;
use Jarves\Model\ContentInterface;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\GenericEvent;
use Symfony\Component\Templating\EngineInterface;

class ContentRender
{
    /**
     * Cache of the current contents stage.
     *
     * @var array
     */
    public $contents;

    /**
     * @var Jarves
     */
    private $jarves;

    /**
     * @var StopwatchHelper
     */
    private $stopwatch;

    /**
     * @var EditMode
     */
    private $editMode;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @var EventDispatcherInterface
     */
    private $eventDispatcher;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var AbstractType[]
     */
    protected $types = [];

    /**
     * @var EngineInterface
     */
    private $templating;

    /**
     * @param Jarves $jarves
     * @param StopwatchHelper $stopwatch
     * @param EditMode $editMode
     * @param Cacher $cacher
     * @param EventDispatcherInterface $eventDispatcher
     * @param PageStack $pageStack
     * @param EngineInterface $templating
     */
    function __construct(Jarves $jarves, StopwatchHelper $stopwatch, EditMode $editMode, Cacher $cacher,
                         EventDispatcherInterface $eventDispatcher, PageStack $pageStack, EngineInterface $templating)
    {
        $this->jarves = $jarves;
        $this->stopwatch = $stopwatch;
        $this->editMode = $editMode;
        $this->cacher = $cacher;
        $this->eventDispatcher = $eventDispatcher;
        $this->pageStack = $pageStack;
        $this->templating = $templating;
    }

    /**
     * @param string $type
     * @param AbstractType $contentType
     */
    public function addType($type, $contentType)
    {
        $this->types[$type] = $contentType;

        if ($contentType instanceof ContentRendererAwareContentType) {
            $contentType->setContentRenderer($this);
        }
    }

    /**
     * @param string $type
     *
     * @return AbstractType
     */
    public function getTypeRenderer($type)
    {
        return isset($this->types[$type]) ? $this->types[$type] : $this->types[strtolower($type)];
    }

    /**
     * @return ContentTypes\AbstractType[]
     */
    public function getContentTypes()
    {
        return $this->types;
    }

    /**
     * @param integer $nodeId
     * @param integer $slotId
     * @param array   $params
     *
     * @return string
     */
    public function renderSlot($nodeId = null, $slotId = 1, $params = array())
    {
        $params['id'] = $slotId;
        $disableEditor = isset($params['_disable_editor']) && $params['_disable_editor'] ? true : false;
        
        if ($this->editMode->isEditMode() && !$disableEditor) {
            return '<div class="jarves-slot" params="' . htmlspecialchars(json_encode($params)) . '"></div>';
        }

        if (!$nodeId) {
            $nodeId = $this->pageStack->getCurrentPage()->getId();
        }

        $contents = $this->getSlotContents($nodeId, $slotId);
        return $this->renderSlotContents($contents, $params);
    }

    /**
     * @param integer $nodeId
     * @param integer $slotId
     * @param array   $params
     *
     * @return string
     */
    public function renderSingleSlot($nodeId = null, $slotId = 1, $params = array())
    {
        $params['id'] = $slotId;
        $disableEditor = isset($params['_disable_editor']) && $params['_disable_editor'] ? true : false;

        if ($this->editMode->isEditMode() && !$disableEditor) {
            return '<div class="jarves-slot jarves-single-slot" params="' . htmlspecialchars(json_encode($params)) . '"></div>';
        }

        if (!$nodeId) {
            $nodeId = $this->pageStack->getCurrentPage()->getId();
        }

        $contents = $this->getSlotContents($nodeId, $slotId);
        return $this->renderSlotContents($contents, $params);
    }

    /**
     * @param integer $nodeId
     * @param integer $slotId
     * @return Model\Content[]
     */
    public function getSlotContents($nodeId, $slotId)
    {
        if ($contents = $this->pageStack->getPageResponse()->getPageContent()) {
            if (is_array($contents) && $contents[$slotId]) {
                return $contents[$slotId];
            } else if (is_string($contents)) {
                return $contents;
            }
        }
        
        $cacheKey = 'core/contents/' . $nodeId . '.' . $slotId;
        $cache = $this->cacher->getDistributedCache($cacheKey);
        $contents = null;

        if ($cache) {
            return unserialize($cache);
        }

        $contents = ContentQuery::create()
            ->filterByNodeId($nodeId)
            ->filterByBoxId($slotId)
            ->orderByRank()
            ->find();

        $this->cacher->setDistributedCache($cacheKey, serialize($contents));

        return $contents;
    }

    /**
     * Renders all Content elements into html.
     *
     * @param Content[] $contents
     *
     * @return string generated html
     */
    public function renderContents($contents)
    {
        $html = '';
        $contents = $this->filterContentsForAccess($contents);

        foreach ($contents as $content) {
            if (is_string($content)) {
                $html .= $content;
                continue;
            }

            if ('stopper' === $content->getType()) {
                if ($html) {
                    break;
                }

                continue;
            }

            $html .= $this->renderContent($content);
        }

        return $html;
    }

    /**
     * Filters $contents and returns only $content items which have valid access. (is visible, accessible by current user etc)
     *
     * @param Content[] $contents
     *
     * @return array
     */
    protected function filterContentsForAccess($contents)
    {
        $filteredContents = [];

        foreach ($contents as $content) {
            $access = true;

            if (is_string($content)) {
                $filteredContents[] = $content;
                continue;
            }

            if (
                ($content->getAccessFrom() + 0 > 0 && $content->getAccessFrom() > time()) ||
                ($content->getAccessTo() + 0 > 0 && $content->getAccessTo() < time())
            ) {
                $access = false;
            }

            if ($content->getHide()) {
                $access = false;
            }

            if ($access && $content->getAccessFromGroups()) {

                $access = false;
                $groups = ',' . $content->getAccessFromGroups() . ',';

                $userGroups = $this->pageStack->getUser()->getUserGroups();

                foreach ($userGroups as $group) {
                    if (strpos($groups, ',' . $group->getGroupId() . ',') !== false) {
                        $access = true;
                        break;
                    }
                }

                if (!$access) {
                    $adminGroups = $this->pageStack->getUser()->getUserGroups();
                    foreach ($adminGroups as $group) {
                        if (strpos($groups, ',' . $group->getGroupId() . ',') !== false) {
                            $access = true;
                            break;
                        }
                    }
                }
            }

            if ($access) {
                $filteredContents[] = $content;
            }
        }

        return $filteredContents;
    }

    /**
     * Build HTML for given contents, used in {% contents 1 %}.
     *
     * @param array $contents
     * @param array $slotProperties
     *
     * @return string|null
     */
    public function renderSlotContents($contents, $slotProperties)
    {
        $name = isset($slotProperties['name']) ? $slotProperties['name'] : '';

        $title = sprintf('Slot %s [%d]', $name, $slotProperties['id']);
        $this->stopwatch->start($title, 'Jarves');

        if (is_string($contents)) {
            return $contents;
        }

        if (!($contents instanceof \Traversable)) {
            return;
        }

        $filteredContents = $this->filterContentsForAccess($contents);
        $count = count($filteredContents);

        /*
         * Compatibility
         */
        $data['layoutContentsMax'] = $count;
        $data['layoutContentsIsFirst'] = true;
        $data['layoutContentsIsLast'] = false;
        $data['layoutContentsId'] = @$slotProperties['id'];
        $data['layoutContentsName'] = @$slotProperties['name'];

        $i = 0;

        //$oldContent = $tpl->getTemplateVars('content');
        $this->eventDispatcher->dispatch('core/render/slot/pre', new GenericEvent($data));

        $html = '';

        if ($count > 0) {
            foreach ($filteredContents as $content) {

                if (is_string($content)) {
                    $html .= $content;
                    continue;
                }

                if ('stopper' === $content->getType()) {
                    if ($html) {
                        break;
                    }

                    continue;
                }
                
                if ($i == $count) {
                    $data['layoutContentsIsLast'] = true;
                }

                if ($i > 0) {
                    $data['layoutContentsIsFirst'] = false;
                }

                $i++;
                $data['layoutContentsIndex'] = $i;

                $html .= $this->renderContent($content, $data);
            }
        }

        $argument = array($data, &$html);
        $this->eventDispatcher->dispatch('core/render/slot', new GenericEvent($argument));

        $this->stopwatch->stop($title);

        return $html;
    }

    /**
     * Build HTML for given content.
     *
     * @param ContentInterface $content
     * @param array $parameters
     * @return string
     * @throws TypeNotFoundException
     */
    public function renderContent(ContentInterface $content, $parameters = array())
    {
        $type = $content->getType() ?: 'text';
        if ('stopper' === $type) {
            return '';
        }

        $title = sprintf('Content %d [%s]', $content->getId(), $type);
        $this->stopwatch->start($title, 'Jarves');

        $typeRenderer = $this->getTypeRenderer($type);

        if (!$typeRenderer) {
            $this->stopwatch->stop($title);
            throw new TypeNotFoundException(sprintf(
                'Type renderer for `%s` not found. [%s] %s',
                $type,
                json_encode($content),
                json_encode(array_keys($this->types))
            ));
        }
        $typeRenderer->setContent($content);
        $typeRenderer->setParameters($parameters);

        $html = $typeRenderer->render();

        $data['content'] = $content->toArray(TableMap::TYPE_CAMELNAME);
        $data['parameter'] = $parameters;
        $data['html'] = $html;

        $this->eventDispatcher->dispatch('core/render/content/pre', new GenericEvent($data));

        $unsearchable = false;
        if ((!is_array($content->getAccessFromGroups()) && $content->getAccessFromGroups() != '') ||
            (is_array($content->getAccessFromGroups()) && count($content->getAccessFromGroups()) > 0) ||
            ($content->getAccessFrom() > 0 && $content->getAccessFrom() > time()) ||
            ($content->getAccessTo() > 0 && $content->getAccessTo() < time()) ||
            $content->getUnsearchable()
        ) {
            $unsearchable = true;
        }

        if ($html) {
            if ($content->getTemplate() == '' || $content->getTemplate() == '-') {
                if ($unsearchable && $data['html']) {
                    $result = '<!--unsearchable-begin-->' . $data['html'] . '<!--unsearchable-end-->';
                } else {
                    $result = $data['html'];
                }
            } else {
                $result = $this->templating->render($content->getTemplate(), $data);

                if ($unsearchable && $result) {
                    $result = '<!--unsearchable-begin-->' . $result . '<!--unsearchable-end-->';
                }
            }
        }

        $argument = array(&$result, $data);
        $this->eventDispatcher->dispatch('core/render/content', new GenericEvent($argument));

        $this->stopwatch->stop($title);
        return $result;
    }

}
