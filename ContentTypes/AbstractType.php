<?php

namespace Jarves\ContentTypes;

use Jarves\Model\Content;

abstract class AbstractType implements TypeInterface
{
    /**
     * @var Content
     */
    private $content;

    /**
     * @var array
     */
    private $parameters;

    /**
     * @param Content $content
     */
    public function setContent(Content $content)
    {
        $this->content = $content;
    }

    /**
     * @return Content
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * @return string
     */
    public function getContentValue()
    {
        return $this->content->getContent();
    }

    /**
     * @param array $parameters
     */
    public function setParameters(array $parameters)
    {
        $this->parameters = $parameters;
    }

    /**
     * @return array
     */
    public function getParameters()
    {
        return $this->parameters;
    }
}
