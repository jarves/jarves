<?php

namespace Jarves\ContentTypes;

use Jarves\ContentRender;

class TypeTray extends AbstractType implements ContentRendererAwareContentType
{
    /**
     * @var \Jarves\ContentRender
     */
    protected $contentRender;

    public function setContentRenderer(ContentRender $contentRender)
    {
        $this->contentRender = $contentRender;
    }

    public function render()
    {
        if ($this->getContent()->getContent()) {
            $value = json_decode($this->getContent()->getContent(), true);
            $nodeId = $value['node']+0;
            return $this->contentRender->renderSlot($nodeId);
        }
    }
}