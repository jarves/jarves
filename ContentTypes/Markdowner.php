<?php

namespace Jarves\ContentTypes;

use Jarves\PageStack;
use Michelf\Markdown;
use Michelf\MarkdownExtra;
use Kadet\Highlighter;
use Kadet\Highlighter\Language\Language;

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
        $stylesAdded = false;

        $parser->code_block_content_func = function ($code, $language) use (&$stylesAdded) {
            if (!$stylesAdded){
                $this->pageStack->getPageResponse()->addCssFile('@Jarves/keylighter/default.scss');
                $stylesAdded = true;
            }

            return Highlighter\highlight($code, Language::byName($language));
        };

        return $parser->transform($text);
    }
}