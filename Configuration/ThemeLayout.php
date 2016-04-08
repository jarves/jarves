<?php

namespace Jarves\Configuration;

class ThemeLayout extends ThemeContent
{
    protected $rootName = 'layout';

	protected $attributes = ['key', 'doctype'];

	/**
	 * @var string
	 */
	protected $key;

	/**
	 * Allows to overwrite the default docType of PageResponse::$docType.
	 *
	 * @var string
	 */
	protected $doctype;

	/**
	 * @param mixed $key
	 */
	public function setKey( $key ) {
		$this->key = $key;
	}

	/**
	 * @return mixed
	 */
	public function getKey() {
		return $this->key;
	}

	/**
	 * @return string
	 */
	public function getDoctype()
	{
		return $this->doctype;
	}

	/**
	 * @param string $doctype
	 */
	public function setDoctype($doctype)
	{
		$this->doctype = $doctype;
	}
}