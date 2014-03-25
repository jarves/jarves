<?php

namespace Jarves\ContentTypes;

class TypeHtml extends AbstractType
{
    public function render()
    {
        return null === $this->getContentValue() ? '' : $this->getContentValue();
    }
}