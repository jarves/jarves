<?php

namespace Jarves\ContentTypes;

use Jarves\Model\ContentInterface;

abstract class AbstractType implements TypeInterface
{
    /**
     * @var ContentInterface
     */
    private $content;

    /**
     * @var array
     */
    private $parameters;

    /**
     * @param ContentInterface $content
     */
    public function setContent(ContentInterface $content)
    {
        $this->content = $content;
    }

    /**
     * @return ContentInterface
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
