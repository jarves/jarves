<?php

namespace Jarves\ContentTypes;

use Jarves\PageStack;
use Michelf\MarkdownExtra;

class TypeMarkdown extends AbstractType
{
    /**
     * @var Markdowner
     */
    private $markdowner;

    /**
     * @param Markdowner $markdowner
     */
    public function __construct(Markdowner $markdowner)
    {
        $this->markdowner = $markdowner;
    }

    public function render()
    {
        if ($content = $this->getContent()->getContent()) {
            return '<div class="markdown">' . $this->markdowner->transform($content) . '</div>';
        }
    }
}