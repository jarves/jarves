<?php

namespace Jarves\Exceptions;


use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class RestException extends \Exception implements HttpExceptionInterface
{

    /**
     * @var mixed
     */
    protected $data;

    /**
     * @param mixed $data
     */
    public function setData($data)
    {
        $this->data = $data;
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * Returns the status code.
     *
     * @return integer An HTTP response status code
     */
    public function getStatusCode()
    {
        return 500;
    }

    /**
     * Returns response headers.
     *
     * @return array Response headers
     */
    public function getHeaders()
    {
        return [];
    }


}