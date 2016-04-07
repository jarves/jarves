<?php

namespace Jarves\Controller\Admin;

use Jarves\Formatter\ApiDocFormatter;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\ControllerNameParser;
use Symfony\Component\HttpFoundation\Response;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class ApiDocController extends Controller
{
    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="REST API documentation"
     * )
     *
     * @Rest\Get("/api", name="jarves_api_doc_index")
     *
     * @return Response
     */
    public function indexAction()
    {
        $commentExtractor = new \Nelmio\ApiDocBundle\Util\DocCommentExtractor;
        $controllerNameParser = new ControllerNameParser($this->get('kernel'));

        $handlers = [
            new \Nelmio\ApiDocBundle\Extractor\Handler\FosRestHandler,
            new \Nelmio\ApiDocBundle\Extractor\Handler\JmsSecurityExtraHandler,
            new \Nelmio\ApiDocBundle\Extractor\Handler\SensioFrameworkExtraHandler,
            new \Jarves\Extractor\Handler\ObjectCrudHandler($this->get('jarves'), $this->get('jarves.objects')),
//            new \Nelmio\ApiDocBundle\Extractor\Handler\PhpDocHandler($commentExtractor),
        ];

        $extractor = new \Nelmio\ApiDocBundle\Extractor\ApiDocExtractor(
            $this->container,
            $this->container->get('router'),
            $this->container->get('annotation_reader'),
            $commentExtractor,
            $controllerNameParser,
            $handlers,
            []
        );

        $extractedDoc = $extractor->all();

        $formatter = new ApiDocFormatter();
        $formatter->setTemplatingEngine($this->get('templating'));

        $htmlContent = $formatter
            ->format($extractedDoc);

        return new Response($htmlContent, 200, array('Content-Type' => 'text/html'));
    }
}