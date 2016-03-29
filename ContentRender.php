<?php

/*
 * This file is part of Jarves cms.
 *
 * (c) Marc J. Schmidt <marc@jarves.io>
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 *
 */

namespace Jarves;

use Jarves\Model\Base\ContentQuery;
use Jarves\Model\Content;
use Jarves\ContentTypes\TypeNotFoundException;
use Jarves\Model\ContentInterface;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\EventDispatcher\GenericEvent;

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
     * @param Jarves $jarves
     * @param StopwatchHelper $stopwatch
     */
    function __construct(Jarves $jarves, StopwatchHelper $stopwatch)
    {
        $this->jarves = $jarves;
        $this->stopwatch = $stopwatch;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves(Jarves $jarves)
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
        if ($this->getJarves()->isEditMode()) {
            return '<div class="jarves-slot" params="' . htmlspecialchars(json_encode($params)) . '"></div>';
        }

        if (!$nodeId) {
            $nodeId = $this->jarves->getCurrentPage()->getId();
        }

        $contents = $this->getSlotContents($nodeId, $slotId);
        return $this->renderContents($contents, $params);
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
        if ($this->getJarves()->isEditMode()) {
            return '<div class="jarves-slot jarves-single-slot" params="' . htmlspecialchars(json_encode($params)) . '"></div>';
        }

        if (!$nodeId) {
            $nodeId = $this->jarves->getCurrentPage()->getId();
        }

        $contents = $this->getSlotContents($nodeId, $slotId);
        return $this->renderContents($contents, $params);
    }

    /**
     * @param integer $nodeId
     * @param integer $slotId
     * @return Model\Content[]
     */
    public function getSlotContents($nodeId, $slotId)
    {
        $cacheKey = 'core/contents/' . $nodeId . '.' . $slotId;
        $cache = $this->getJarves()->getDistributedCache($cacheKey);
        $contents = null;

        if ($cache) {
            return unserialize($cache);
        }

        $contents = ContentQuery::create()
            ->filterByNodeId($nodeId)
            ->filterByBoxId($slotId)
            ->orderByRank()
            ->find();

        $this->getJarves()->setDistributedCache($cacheKey, serialize($contents));

        return $contents;
    }
//
//    public function renderView(&$contents, $view)
//    {
//        return json_encode(iterator_to_array($contents));
//    }

    /**
     * Build HTML for given contents.
     *
     * @param array $contents
     * @param array $slotProperties
     *
     * @return string
     * @internal
     */
    public function renderContents(&$contents, $slotProperties)
    {
        $title = sprintf('Slot %s [%d]', @$slotProperties['name'], @$slotProperties['id']);
        $this->stopwatch->start($title, 'Jarves');

        $filteredContents = array();
        if (!($contents instanceof \Traversable)) {
            return;
        }

        /** @var $content Content */
        foreach ($contents as $content) {
            $access = true;

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

                $userGroups = $this->getJarves()->getClient()->getUser()->getUserGroups();

                foreach ($userGroups as $group) {
                    if (strpos($groups, ',' . $group->getGroupId() . ',') !== false) {
                        $access = true;
                        break;
                    }
                }

                if (!$access) {
                    $adminGroups = $this->getJarves()->getClient()->getUser()->getUserGroups();
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
        $this->getJarves()->getEventDispatcher()->dispatch('core/render/slot/pre', new GenericEvent($data));

        $html = '';

        if ($count > 0) {
            foreach ($filteredContents as &$content) {
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
        $this->getJarves()->getEventDispatcher()->dispatch('core/render/slot', new GenericEvent($argument));

//        if ($slotProperties['assign'] != "") {
//            //Jarves::getInstance()->assign($slotProperties['assign'], $html);
//            return '';
//        }

        $this->stopwatch->stop($title, 'Jarves');

        return $html;
    }

    /**
     * @param string $type
     * @return ContentTypes\TypeInterface
     */
    public function getTypeRenderer($type)
    {
        $contentTypes = $this->getJarves()->getContentTypes();
        return $contentTypes->getType($type);
    }

    /**
     * Build HTML for given content.
     *
     * @param ContentInterface $content
     * @param array   $parameters
     *
     * @return string
     * @throws ContentTypes\TypeNotFoundException
     */
    public function renderContent($content, $parameters = array())
    {
        $type = $content->getType() ?: 'text';
        $title = sprintf('Content %d [%s]', $content->getId(), $type);
        $this->stopwatch->start($title, 'Jarves');

        $typeRenderer = $this->getTypeRenderer($type);
        if (!$typeRenderer) {
            $this->stopwatch->stop($title);
            throw new TypeNotFoundException(sprintf(
                'Type renderer for `%s` not found. [%s]',
                $content->getType(),
                json_encode($content)
            ));
        }
        $typeRenderer->setContent($content);
        $typeRenderer->setParameters($parameters);

        $html = $typeRenderer->render();

        $data['content'] = $content->toArray(TableMap::TYPE_CAMELNAME);
        $data['parameter'] = $parameters;
        $data['html'] = $html;

        $this->getJarves()->getEventDispatcher()->dispatch('core/render/content/pre', new GenericEvent($data));

        $unsearchable = false;
        if ((!is_array($content->getAccessFromGroups()) && $content->getAccessFromGroups() != '') ||
            (is_array($content->getAccessFromGroups()) && count($content->getAccessFromGroups()) > 0) ||
            ($content->getAccessFrom() > 0 && $content->getAccessFrom() > time()) ||
            ($content->getAccessTo() > 0 && $content->getAccessTo() < time()) ||
            $content->getUnsearchable()
        ) {
            $unsearchable = true;
        }

        if ($content->getTemplate() == '' || $content->getTemplate() == '-') {
            if ($unsearchable) {
                $result = '<!--unsearchable-begin-->' . $data['html'] . '<!--unsearchable-end-->';
            }
        } else {
            $template = $this->getJarves()->getTemplating();
            $result = $template->render($content->getTemplate(), $data);

            if ($unsearchable) {
                $result = '<!--unsearchable-begin-->' . $result . '<!--unsearchable-end-->';
            }
        }

        $argument = array(&$result, $data);
        $this->getJarves()->getEventDispatcher()->dispatch('core/render/content', new GenericEvent($argument));

        $this->stopwatch->stop($title);
        return $result;
    }

}
