<?php

namespace Pc\Postcode\Block\Checkout;

class LayoutProcessor extends \Magento\Framework\View\Element\AbstractBlock implements \Magento\Checkout\Block\Checkout\LayoutProcessorInterface{

    protected $scopeConfig;
	protected $logger;

    public function __construct(\Magento\Framework\View\Element\Template\Context $context, array $data = [])
    {
        parent::__construct($context, $data);

        $this->scopeConfig = $context->getScopeConfig(); //$scopeConfig;
		$this->logger = $context->getLogger(); //$logger;
    }

	public function process($aResult)
	{
        if($this->scopeConfig->getValue('postcodecheckout/general/enabled',\Magento\Store\Model\ScopeInterface::SCOPE_STORE) &&
            isset($aResult['components']['checkout']['children']['steps']['children']
            ['shipping-step']['children']['shippingAddress']['children']
            ['shipping-address-fieldset'])
        ){

			$aShippingFields = $aResult['components']['checkout']['children']['steps']['children']
					 ['shipping-step']['children']['shippingAddress']['children']
						 ['shipping-address-fieldset']['children'];

            if(isset($aShippingFields['street']))
			{
                unset($aShippingFields['street']['children'][1]['validation']);
                unset($aShippingFields['street']['children'][2]['validation']);
            }

            $aShippingFields = array_merge($aShippingFields, $this->getPostcodeFields('shippingAddress', 'shipping'));

			$aResult['components']['checkout']['children']['steps']['children']
					 ['shipping-step']['children']['shippingAddress']['children']
						 ['shipping-address-fieldset']['children'] = $aShippingFields;

			$aResult = $this->getBillingFormFields($aResult);

        }

        return $aResult;
	}

	public function getBillingFormFields($aResult)
	{
        if(isset($aResult['components']['checkout']['children']['steps']['children']
        ['billing-step']['children']['payment']['children']
        ['payments-list'])) {

            $aPaymentForms = $aResult['components']['checkout']['children']['steps']['children']
            ['billing-step']['children']['payment']['children']
            ['payments-list']['children'];

            foreach($aPaymentForms as $aPaymentMethodForm => $aPaymentMethodValue)
			{
                $aPaymentMethodCode = str_replace('-form', '', $aPaymentMethodForm);

                if (!isset($aResult['components']['checkout']['children']['steps']['children']['billing-step']['children']['payment']['children']['payments-list']['children'][$aPaymentMethodCode . '-form']))
				{
                    continue;
                }

                if (!isset($aResult['components']['checkout']['children']['steps']['children']['billing-step']['children']['payment']['children']['payments-list']['children'][$aPaymentMethodCode . '-form']['children']['form-fields']))
				{
                    continue;
                }

                $aBillingFields = $aResult['components']['checkout']['children']['steps']['children']
                ['billing-step']['children']['payment']['children']
                ['payments-list']['children'][$aPaymentMethodCode . '-form']['children']['form-fields']['children'];

                $billingPostcodeFields = $this->getPostcodeFields('billingAddress' . $aPaymentMethodCode, 'billing');

                $aBillingFields = array_merge($aBillingFields, $billingPostcodeFields);

                $aResult['components']['checkout']['children']['steps']['children']
                ['billing-step']['children']['payment']['children']
                ['payments-list']['children'][$aPaymentMethodCode . '-form']['children']['form-fields']['children'] = $aBillingFields;

            }
        }

		return $aResult;

	}

	public function getPostcodeFieldSet($sScope, $sAddressType)
	{
        return [
            'pc_postcode_fieldset' =>
                [
                    'type' => 'group',
                    'config' => [
                        'customScope' => $sScope,
                        'template' => 'Pc_Postcode/template/form/group',
                        'additionalClasses' => 'pc_postcode_fieldset',
                        'loaderImageHref' => $this->getViewFileUrl('images/loader-1.gif')
                    ],
                    'children' => $this->getPostcodeFields($sScope, $sAddressType),
                    'provider' => 'checkoutProvider',
					'sortOrder' => '5',
                    'addressType'=> $sAddressType
                ]
        ];
    }

	public function getPostcodeFields($sScope, $sAddressType)
	{
        return [
		    'pc_postcode_postcode' =>
			[
				'component' => 'Magento_Ui/js/form/element/abstract',
				'config' => [
					'customScope' => $sScope,
					'template' => 'ui/form/field',
					'elementTmpl' => 'ui/form/element/input',
					'id' => 'pc_postcode_postcode',
					'additionalClasses' => 'pc_postcode required'
				],
				'provider' => 'checkoutProvider',
				'dataScope' => $sScope . '.pc_postcode_postcode',
				'label' => __('Postcode'),
				'sortOrder' => '5',
				'validation' => [
					'required-entry' => false,
					'min_text_length' => 6,
				],
			],
            'pc_postcode_housenumber' =>
			[
				'component' => 'Magento_Ui/js/form/element/abstract',
				'config' => [
					'customScope' => $sScope,
					'template' => 'ui/form/field',
					'elementTmpl' => 'ui/form/element/input',
					'id' => 'pc_postcode_housenumber',
					'additionalClasses' => 'pc_postcode required'
				],
				'provider' => 'checkoutProvider',
				'dataScope' => $sScope . '.pc_postcode_housenumber',
				'label' => __('Housenumber'),
				'sortOrder' => '6',
				'validation' => [
					'required-entry' => false,
					'min_text_length' => 1,
					'integer' => true
				],
			],
			'pc_postcode_housenumber_addition' =>
			[
				'component' => 'Magento_Ui/js/form/element/select',
				'config' => [
					'customScope' => $sScope,
					'template' => 'ui/form/field',
					'elementTmpl' => 'ui/form/element/select',
					'additionalClasses' => 'pc_postcode_addition'
				],
				'provider' => 'checkoutProvider',
				'dataScope' => $sScope . '.pc_postcode_housenumber_addition',
				'label' => __('Addition'),
				'sortOrder' => '7',
				'validation' => [
					'required-entry' => false,
				],
				'options' => [],
				'visible' => false,
			],
			'pc_postcode_disable' =>
			[
				'component' => 'Magento_Ui/js/form/element/abstract',
				'config' => [
					'customScope' => $sScope,
					'template' => 'ui/form/field',
					'elementTmpl' => 'ui/form/element/checkbox',
					'additionalClasses' => 'pc_postcode'
				],
				'provider' => 'checkoutProvider',
				'dataScope' => $sScope . '.pc_postcode_disable',
				'label' => __('Manually enter address'),
				'sortOrder' => '10',
				'validation' => [
					'required-entry' => false,
				],
			]
		];

		return $aPostcodeFields;
	}
}