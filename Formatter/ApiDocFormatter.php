<?php

namespace Jarves\Formatter;

use Nelmio\ApiDocBundle\Formatter\HtmlFormatter;

class ApiDocFormatter extends HtmlFormatter {

    protected function render(array $collection)
    {
        return $this->engine->render('JarvesBundle:Admin:ApiDoc/resources.html.twig', array(
            'resources' => $collection,
            'apiName' => 'Jarves cms REST Api Documentation',
            'css' => file_get_contents(__DIR__ . '/../Resources/public/doc/screen.css'),
            'js' => file_get_contents(__DIR__ . '/../Resources/public/doc/all.js'),
            'bodyFormat' => 'json',
            'defaultRequestFormat' => 'json',
            'requestFormatMethod' => 'json',
            'authentication' => false,
            'endpoint' => false,
            'enableSandbox' => true,
            'date' => 'N/A',
            'acceptType' => 'application/json',
        ));
    }

//    /**
//     * @return array
//     */
//    protected function getGlobalVars()
//    {
//        return array(
//            'apiName'              => $this->apiName,
//            'authentication'       => $this->authentication,
//            'endpoint'             => $this->endpoint,
//            'enableSandbox'        => $this->enableSandbox,
//            'requestFormatMethod'  => $this->requestFormatMethod,
//            'acceptType'           => $this->acceptType,
//            'bodyFormat'           => $this->bodyFormat,
//            'defaultRequestFormat' => $this->defaultRequestFormat,
//            'date'                 => date(DATE_RFC822),
//            'css'                  => file_get_contents(__DIR__ . '/../Resources/public/css/screen.css'),
//            'js'                   => file_get_contents(__DIR__ . '/../Resources/public/js/all.js'),
//            'motdTemplate'         => $this->motdTemplate
//        );
//    }
}