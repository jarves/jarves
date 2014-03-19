<?php

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Controller;
use Jarves\Controller\Admin\BundleManager\Manager;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class LanguageController extends Controller
{

    /**
     * @ApiDoc(
     *  section="Language Editor",
     *  description="Returns all language messages + pluralCount and pluralForm"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="lang", requirements="[a-z]{2,3}", strict=true, description="The language code")
     *
     * @Rest\Get("/admin/system/bundle/editor/language")
     *
     * @param string $bundle
     * @param string $lang
     *
     * @return array
     */
    public function getLanguageAction($bundle, $lang)
    {
        return $this->getLanguage($bundle, $lang);
    }

    /**
     * @param string $bundle
     * @param string $lang
     * @return array
     */
    protected function getLanguage($bundle, $lang)
    {
        Manager::prepareName($bundle);
        $utils = $this->getTranslator()->getUtils();

        $file = $this->getJarves()->getBundleDir($bundle) . "Resources/translations/$lang.po";
        $res = $utils->parsePo($file);

        $pluralForm = $utils->getPluralForm($lang);
        preg_match('/^nplurals=([0-9]+);/', $pluralForm, $match);

        $res['pluralCount'] = intval($match[1]);
        $res['pluralForm'] = $pluralForm;

        return $res;
    }

    /**
     * @ApiDoc(
     *  section="Language Editor",
     *  description="Saves language messages"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="lang", requirements="[a-z]{2,3}", strict=true, description="The language code")
     * @Rest\RequestParam(name="langs", array=true, description="The language messages")
     *
     * @Rest\Post("/admin/system/bundle/editor/language")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function setLanguageAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $lang = $paramFetcher->get('lang');
        $langs = $paramFetcher->get('langs');

        Manager::prepareName($bundle);
        $utils = $this->getTranslator()->getUtils();
        return $utils->saveLanguage($bundle, $lang, $langs);
    }

    /**
     * @ApiDoc(
     *  section="Language Editor",
     *  description="Extracts all language messages in the given bundle"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     *
     * @Rest\Get("/admin/system/bundle/editor/extract")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getExtractedLanguageAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        Manager::prepareName($bundle);

        $utils = $this->getTranslator()->getUtils();
        return $utils->extractLanguage($bundle);
    }

    /**
     * @ApiDoc(
     *  section="Language Editor",
     *  description="Gets a overview of translated messages"
     * )
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="lang", requirements="[a-z]{2,3}", strict=true, description="The language code")
     *
     * @Rest\Get("/admin/system/bundle/editor/overview")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array[count => int, countTranslated => int]
     */
    public function getOverviewExtractAction(ParamFetcher $paramFetcher)
    {
        $bundle = $paramFetcher->get('bundle');
        $lang = $paramFetcher->get('lang');

        $utils = $this->getTranslator()->getUtils();
        $extract = $utils->extractLanguage($bundle);
        $translated = $this->getLanguage($bundle, $lang);

        $p100 = count($extract);
        $cTranslated = 0;

        foreach ($extract as $id => $translation) {
            if (isset($translated['translations'][$id]) && $translated['translations'][$id] != '') {
                $cTranslated++;
            }
        }

        return array(
            'count' => $p100,
            'countTranslated' => $cTranslated
        );
    }

}
