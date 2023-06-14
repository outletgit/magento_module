<?php

namespace Pc\Postcode\Helper;

class Data extends \Magento\Framework\App\Helper\AbstractHelper
{

    protected $scopeConfig;
    protected $logger;
	protected $productMetadataInterface;
	protected $_moduleList;
    protected $developerHelper;

    public function __construct(
        \Psr\Log\LoggerInterface $logger,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
		\Magento\Framework\App\ProductMetadataInterface $productMetadataInterface,
		\Magento\Framework\Module\ModuleListInterface $moduleList,
        \Magento\Developer\Helper\Data $developerHelper
    ){
		$this->logger = $logger;
        $this->scopeConfig = $scopeConfig;
		$this->productMetadataInterface = $productMetadataInterface;
		$this->_moduleList = $moduleList;
        $this->developerHelper = $developerHelper;
	}



	public function getJsinit($getAdminConfig = false)
	{
		$aSettings = [
			"enabled" => $this->getBoolean('postcodecheckout/general/enabled'), 
			"useStreet2AsHouseNumber" => $this->getBoolean('postcodecheckout/advanced_config/use_street2_as_housenumber'),
			"useStreet3AsHouseNumberAddition" => $this->getBoolean('postcodecheckout/advanced_config/use_street3_as_housenumberaddition'),
			"hide_fields" => $this->getBoolean('postcodecheckout/advanced_config/hide_fields'),
			"allowPostbus" => $this->getBoolean('postcodecheckout/advanced_config/allow_postbus'),
			"debug" => false,
			"translations" => [
				"defaultError" => 'Invalid Postcode and Housenumber combination',
				"label_search" => 'Fill in your address below',
				"label_postcode" => 'Postcode',
				"label_housenumber" => 'Housenumber',
				"label_addition" => 'Addition',
				"button_automatic" => 'Enter automatically',
				"button_manual" => 'Enter manually'
			]
		];

		return $aSettings;
	}

	protected function getBoolean($sConfigKey)
	{
		if($this->getStoreConfig($sConfigKey))
		{
			return true;
		}

		return false;
	}

	protected function getStoreConfig($sPath)
	{
		return $this->scopeConfig->getValue($sPath,\Magento\Store\Model\ScopeInterface::SCOPE_STORE);
	}


}