<?php

namespace Jarves\ContentTypes;

class TypeHtml extends AbstractType
{
    public function render()
    {
        return $this->getContent()->getContent() ?: '';
    }
}