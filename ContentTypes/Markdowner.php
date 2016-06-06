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

        $stylesAdded = false;

        $classMap = [
            'js' => 'JavaScript',
            'javascript' => 'JavaScript',
            'php' => 'Php',
            'css' => 'css',
            'scss' => 'Css\\Scss',
            'less' => 'Css\\Less',
            'sass' => 'Css\\Sass',
            'ini' => 'ini',
            'latex' => 'latex',
            'perl' => 'perl',
            'powershell' => 'PowerShell',
            'sql' => 'Sql',
            'mysql' => 'Sql\\MySQL',
            'xml' => 'Xml',
            'html' => 'Html',
            'python' => 'Python',
        ];
        
        $parser->code_block_content_func = function ($code, $language) use (&$stylesAdded, $classMap) {
            if (!$stylesAdded ){
                $this->pageStack->getPageResponse()->addCssFile('@Jarves/keylighter/default.scss');
                $stylesAdded = true;
            }

            if (!isset($classMap[$language])) {
                return htmlentities($code);
            }

            $class = '\\Kadet\\Highlighter\\Language\\' . $classMap[$language];

            /** @var \Kadet\Highlighter\Language\Language $parser */
            $parser = new $class();
            $out = new \Kadet\Highlighter\Formatter\HtmlFormatter();

            return $out->format($parser->parse($code));
        };

        return $parser->transform($text);
    }
}