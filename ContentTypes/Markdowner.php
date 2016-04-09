<?php

namespace Jarves\ContentTypes;

use Jarves\PageStack;
use Michelf\Markdown;
use Michelf\MarkdownExtra;

/**
 * Extends Michelfs\Markdown with code syntax highglighting
 */
class Markdowner
{

    /**
     * @var PageStack
     */
    private $pageStack;

    public function __construct(PageStack $pageStack)
    {
        $this->pageStack = $pageStack;
    }


    public function transform($text)
    {
        $parser = new MarkdownExtra;

        if (false !== stripos($text, '```')) {
            //add highlightjs to PageResponse
            $this->pageStack->getPageResponse()->addJsFile('@Jarves/highlightjs/highlight.pack.js');
            $this->pageStack->getPageResponse()->addJsAtBottom('hljs.initHighlightingOnLoad();');
            $this->pageStack->getPageResponse()->addCssFile('@Jarves/highlightjs/styles/github.css');
        }

        return $parser->transform($text);
    }
}