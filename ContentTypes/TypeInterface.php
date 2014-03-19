<?php

namespace Jarves\ContentTypes;

use Jarves\Model\Content;

interface TypeInterface
{
    /**
     * @return string
     */
    public function render();

    public function setContent(Content $content);

    public function setParameters(array $parameters);

}