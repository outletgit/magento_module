<?php

namespace Pc\Postcode\Model;

use Magento\Checkout\Model\ConfigProviderInterface;

class CustomConfigProvider implements ConfigProviderInterface
{
    
    protected $postcodeHelper;
    
    public function __construct(
        \Pc\Postcode\Helper\Data $postcodeHelper
    ){
        $this->postcodeHelper = $postcodeHelper;
    }
   
    public function getConfig()
    {        
        $config = [
            'pc_postcode' => [
                'settings' => $this->postcodeHelper->getJsinit(false)
            ]
        ];
		
        return $config;
    }
}
