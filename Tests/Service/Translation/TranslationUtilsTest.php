<?php

namespace Jarves\Tests\Service\Translation;

use Jarves\ContainerHelperTrait;
use Jarves\Tests\KernelAwareTestCase;

class TranslationUtilsTest extends KernelAwareTestCase
{
    use ContainerHelperTrait;

    public function testExtractionTwigBasics()
    {
        $translator = $this->getTranslator();
        $utils = $translator->getUtils();

        $this->assertCount(1, $utils->extractTranslations('
        {{ t("translation") }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{ t ("translation") }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{t ("translation")}}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{t( "translation " )}}
        '));

        $this->assertEquals(['translation" test '], array_keys($utils->extractTranslations('
        {{t( "translation\" test " )}}
        ')));

        $this->assertEquals(['translation"\\" test '], array_keys($utils->extractTranslations('
        {{t( "translation\"\\\" test " )}}
        ')));

        $this->assertCount(1, $utils->extractTranslations('
        {{ t("translation", "plural", count) }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{ t("translation", "plural", 4) }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{ t("translation", "plural", 4) }}
        '));
    }

    public function testExtractionTwigContext()
    {
        $translator = $this->getTranslator();
        $utils = $translator->getUtils();

        $this->assertCount(1, $utils->extractTranslations('
        {{ tc("context", "translation") }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{ tc ("context", "translation") }}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{tc ("context", "translation")}}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{tc ( "context", "translation" )}}
        '));

        $this->assertCount(1, $utils->extractTranslations('
        {{tc ( "context" , "translation" )}}
        '));

        $this->assertEquals("context\004translation", key($utils->extractTranslations('
        {{ tc("context", "translation") }}
        ')));

        $contextPlural = $utils->extractTranslations('
        {{ tc("context", "translation", "plural", count) }}
        ');
        $this->assertCount(1, $contextPlural);
        $this->assertEquals("context\004translation", key($contextPlural));
        $this->assertEquals(['translation', 'plural'], current($contextPlural));

    }
}