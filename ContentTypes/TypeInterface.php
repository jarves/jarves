<?php

namespace Jarves\ContentTypes;

use Jarves\Model\ContentInterface;

interface TypeInterface
{
    /**
     * @return string
     */
    public function render();

    public function setContent(ContentInterface $content);

    public function setParameters(array $parameters);

}