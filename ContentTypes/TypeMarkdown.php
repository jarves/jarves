<?php

namespace Jarves\ContentTypes;

use Michelf\MarkdownExtra;

class TypeMarkdown extends AbstractType
{
    public function render()
    {
        if ($content = $this->getContent()->getContent()) {
            return MarkdownExtra::defaultTransform($content);
        }
    }
}