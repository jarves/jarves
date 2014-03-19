<?php

namespace Jarves\Exceptions\Rest;

use Jarves\Exceptions\RestException;

class ValidationFailedException extends RestException
{
    /**
     * Returns the status code.
     *
     * @return integer An HTTP response status code
     */
    public function getStatusCode()
    {
        return 400;
    }
}