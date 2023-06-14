require([
    'jquery'
], function(jQuery)
{
	
/**
 * Copyright © CodeBrain BV
 */

	console.log('Postcode Checkout JS Loaded');

	var iTimeout = 10; // Tries
	var iShippingTimeout = 0;
	var iBillingTimeout = 0;
	var postcodecheckout_Autocomplete = []; // Global array for storing the Autocomplete objects
	var sOldAddition = null;
	var pc4m2_speed = 200;

	// Startup function
	// window.addEventListener('DOMContentLoaded', (event) => {
		jQuery(document).ready( function() {
			if(jQuery('#checkout').length) {
				postcodecheckout_initShipping();
			}
		});
	// });

	// Delay function
	var delay = (function ()
	{
		var timer = 0;

		return function (callback, ms)
		{
			clearTimeout(timer);
			timer = setTimeout(callback, ms);
		};
	})();

	// Initialize for shipping form
	function postcodecheckout_initShipping(bReset)
	{
		if(bReset)
		{
			iShippingTimeout = 0;
		}

		var url = /[^/]*$/.exec(window.location.href)[0];

		if(jQuery('#checkout-step-shipping').length)
		{
			// Shipment block available
			console.log('Shipment block available');
			postcodecheckout_initFunctions(jQuery('#checkout-step-shipping'));

			var oContinueButton = jQuery('.button.action.continue.primary');
			
			if(url === '#payment')
			{
				console.log('On payment page');
				postcodecheckout_initBilling(true);
			}
			else if(jQuery(oContinueButton).length)
			{
				console.log('Add init to the Submit Button.');
				jQuery(oContinueButton).on('click', function() { postcodecheckout_initBilling(true); });
			}
			else
			{
				var oShipmentAsBilling = jQuery('.checkout-billing-address');

				if(jQuery(oShipmentAsBilling).length)
				{
					jQuery(oShipmentAsBilling).attr('id', 'checkout-billing-address');

					// console.log('Add init to the Shipping as Billing Button.');
					postcodecheckout_initFunctions(oShipmentAsBilling);
				}
			}
		}
		else
		{
			// Shipment block not available
			iShippingTimeout++;

			if(iShippingTimeout < iTimeout)
			{
				// console.log('Shipment block not available (Tries: ' + iShippingTimeout + ')');
				setTimeout(function(){ postcodecheckout_initShipping(); }, 3000);
			}
		}
	}

	// Initialize for billing form
	function postcodecheckout_initBilling(bReset)
	{
		if(bReset)
		{
			iBillingTimeout = 0;
		}

		if(jQuery('#checkout-step-payment').length && (jQuery('.no-payments-block').length < 1))
		{
			// Payments block available
			console.log('Payments block available');
			postcodecheckout_initFunctions(jQuery('#checkout-step-payment'));
		}
		else
		{
			// Payments block not available
			iBillingTimeout++;

			if(iBillingTimeout < iTimeout)
			{
				console.log('Payments block not available (Tries: ' + iBillingTimeout + ')');
				setTimeout(function(){ postcodecheckout_initBilling(); }, 3000);
			}
		}
	}

	/** Functions **/

	
	// Initialize functions for correct forms
	function postcodecheckout_initFunctions(oElement)
	{
		var sId = jQuery(oElement).attr('id');

		var aElements = [];
		var iIndex = 0;
		jQuery('#' + sId + ' .pc_postcode [name="pc_postcode_postcode"]').each( function() { aElements[iIndex] = jQuery(this).attr('id'); iIndex++; });

		// console.log(aElements);

		if(jQuery(aElements).length)
		{
			jQuery(aElements).each( function() { postcodecheckout_createInteractiveFunctions(this); })
		}
		else
		{
			// console.log('No Elements Found, try again');
			setTimeout(function(){ postcodecheckout_initFunctions(oElement); }, 500);
		}
	}

	// Initialize functions
	function postcodecheckout_createInteractiveFunctions(sInputId)
	{
		postcodecheckout_addAutocompleteFunctions(sInputId);

		postcodecheckout_addCountryFunctions(sInputId);

		postcodecheckout_addDisableManualFunctions(sInputId);
	}

	// Add functionality to validation fields
	function postcodecheckout_addAutocompleteFunctions(sId)
	{
		// Add Postcode Checkout
		var oPostcode = document.querySelector('#' + sId);

		if(jQuery(oPostcode).length)
		{
			var oParent = jQuery(oPostcode).closest('.fieldset.address');

			var oPostcodeField = jQuery(oParent).find('[name="pc_postcode_postcode"]');
			var oHousenumberField = jQuery(oParent).find('[name="pc_postcode_housenumber"]');
			var oHousenumberAdditionField = jQuery(oParent).find('[name="pc_postcode_housenumber_addition"]');

			oPostcodeField.attr("autocomplete", "postcode");
			oHousenumberField.attr("autocomplete", "housenumber");

			// Init call
			postcodecheckout_keyUp(oPostcodeField, oHousenumberField);

			jQuery(oPostcodeField).keyup(function ()
			{
				postcodecheckout_keyUp(oPostcodeField, oHousenumberField);
			});
			jQuery(oHousenumberField).keyup(function ()
			{
				postcodecheckout_keyUp(oPostcodeField, oHousenumberField);
			});

			// Addition has changed
			jQuery(oHousenumberAdditionField).change(function ()
			{
				var sNewAdditionValue = jQuery(oHousenumberAdditionField).val();

				postcodecheckout_changeHousenumberAddition(oHousenumberAdditionField, sNewAdditionValue);

			});
		}
	}

	// When keyup is fired do post to API with filled in data
	function postcodecheckout_keyUp(oPostcodeField, oHousenumberField)
	{
		var sPostcode = oPostcodeField.val().replace(/\s/g, "");
		var iHousenumber = oHousenumberField.val().replace(/(^\d+)(.*?$)/i, '$1');

		if(sPostcode.length >= 6 && iHousenumber.length != 0)
		{
			delay(function ()
			{
				jQuery.ajax({
					url: 'https://www.postcode-checkout.nl/api/v2/',
					type: 'POST',
					dataType: 'json',
					data: {
						sPostcode: sPostcode,
						iHousenumber: iHousenumber,
						xAddition: ''
					},
					success: function (data)
					{
						console.log('pc4m2_data', data);

						postcodecheckout_fillInFields(oPostcodeField, data);
					}
				});
			}, 600);
		}
	}

	// Add functionality for country select box
	function postcodecheckout_addCountryFunctions(sId)
	{
		var oParentObject = postcodecheckout_getParentElement(jQuery('#' + sId));
		var	oSelectElement = jQuery(oParentObject).find('select[name="country_id"]');

		jQuery(oSelectElement).on('change', function() { postcodecheckout_toggleCountry(this); } );
		postcodecheckout_toggleCountry(oSelectElement);
	}

	// Add disable checkbox
	function postcodecheckout_addDisableManualFunctions(sId)
	{
		var oParentObject = postcodecheckout_getParentElement(jQuery('#' + sId));
		var oDisableElement = jQuery(oParentObject).find('input[name="pc_postcode_disable"]');

		jQuery(oDisableElement).on('change', function() { postcodecheckout_checkDisable(this); } );
		postcodecheckout_checkDisable(oDisableElement);
	}

	// Check if checkbox is set to disabled
	function postcodecheckout_checkDisable(oElement)
	{
		var sDisabled = jQuery(oElement).prop('checked');

		if(postcodecheckout_returnCountry(oElement))
		{
			if(sDisabled == true)
			{
				postcodecheckout_enableFields(oElement);
			}
			else
			{
				postcodecheckout_disableFields(oElement);
			}
		}
		else
		{
			postcodecheckout_enableFields(oElement);
		}
	}

	// Disable standard Magento fields and show validation fields
	function postcodecheckout_disableFields(oElement)
	{
		// console.log('postcodecheckout_disableFields()');
		var oParentObject = postcodecheckout_getParentElement(oElement);

		jQuery(oParentObject).find('[name="pc_postcode_postcode"]').parents('div').eq(1).show(pc4m2_speed);
		jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').parents('div').eq(1).show(pc4m2_speed);

		jQuery(oParentObject).find('[name="street[0]"]').prop('readonly', true);
		jQuery(oParentObject).find('[name="street[1]"]').prop('readonly', true);
		jQuery(oParentObject).find('[name="street[2]"]').prop('readonly', true);
		jQuery(oParentObject).find('[name="city"]').prop('readonly', true);
		jQuery(oParentObject).find('[name="region"]').prop('readonly', true);
		jQuery(oParentObject).find('[name="postcode"]').prop('readonly', true);

		// jQuery(oParentObject).find('.street').css('visibility', 'hidden');
		// jQuery(oParentObject).find('[name="city"]').css('visibility', 'hidden');
		// jQuery(oParentObject).find('[name="region"]').css('visibility', 'hidden');
		// jQuery(oParentObject).find('[name="postcode"]').css('visibility', 'hidden');
	}

	// Enable standard Magento fields and hide validation fields
	function postcodecheckout_enableFields(oElement)
	{
		// console.log('postcodecheckout_enableFields()');
		var oParentObject = postcodecheckout_getParentElement(oElement);

		jQuery(oParentObject).find('[name="pc_postcode_postcode"]').parents('div').eq(1).hide(pc4m2_speed);
		jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').parents('div').eq(1).hide(pc4m2_speed);
		jQuery(oParentObject).find('[name="pc_postcode_housenumber_addition"]').parents('div').eq(1).hide(pc4m2_speed);

		jQuery(oParentObject).find('[name="pc_postcode_postcode"]').val('').trigger('keyup');
		jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').val('').trigger('keyup');
		jQuery(oParentObject).find('[name="pc_postcode_housenumber_addition"]').val('').trigger('keyup');

		jQuery(oParentObject).find('[name="street[0]"]').prop('readonly', false);
		jQuery(oParentObject).find('[name="street[1]"]').prop('readonly', false);
		jQuery(oParentObject).find('[name="street[2]"]').prop('readonly', false);
		jQuery(oParentObject).find('[name="city"]').prop('readonly', false);
		jQuery(oParentObject).find('[name="region"]').prop('readonly', false);
		jQuery(oParentObject).find('[name="postcode"]').prop('readonly', false);

		// jQuery(oParentObject).find('.street').css('visibility', 'shown');
		// jQuery(oParentObject).find('[name="city"]').css('visibility', 'shown');
		// jQuery(oParentObject).find('[name="region"]').css('visibility', 'shown');
		// jQuery(oParentObject).find('[name="postcode"]').css('visibility', 'shown');
	}

	// Fill fields with Postcode data
	function postcodecheckout_fillInFields(oElement, oResults)
	{
		// console.log('postcodecheckout_fillInFields()');
		var oParentObject = postcodecheckout_getParentElement(oElement);

		if(oResults.processed == 'success')
		{
			var oAddress = oResults.result;

			var sStreet = oAddress.street;
			var sHouseNumber = oAddress.housenumber;
			var sHouseNumberAddition = '';
			var aHouseNumberAdditions = oAddress.addition;
			var sPostcode = oAddress.postcode;
			var sRegion = oAddress.province;
			var sCity = oAddress.city;
			var aSettings = getSettings();

			if(sStreet)
			{
				var sAddress = sStreet;

				if(sHouseNumber)
				{
					if(aSettings.useStreet2AsHouseNumber)
					{
						var sHouseNumber2 = sHouseNumber;

						if(!aSettings.useStreet3AsHouseNumberAddition && sHouseNumberAddition)
						{
							sHouseNumber2 += ' ' +sHouseNumberAddition;
						}
					}
					else
					{
						sAddress += ' ' +sHouseNumber;
					}

					if(sHouseNumberAddition && !aSettings.useStreet3AsHouseNumberAddition && !aSettings.useStreet2AsHouseNumber)
					{
						sAddress += ' ' +sHouseNumberAddition;
					}
				}
			}

			if(sAddress)
			{
				jQuery(oParentObject).find('[name="street[0]"]').val(sAddress).trigger('keyup');
			}

			if(sHouseNumber2 && aSettings.useStreet2AsHouseNumber)
			{
				jQuery(oParentObject).find('[name="street[1]"]').val(sHouseNumber2).trigger('keyup');
			}

			sOldAddition = null;
			postcodecheckout_setHouseNumberAdditions(oParentObject, aHouseNumberAdditions);


			if(sHouseNumberAddition && aSettings.useStreet3AsHouseNumberAddition)
			{
				jQuery(oParentObject).find('[name="street[2]"]').val(sHouseNumberAddition).trigger('keyup');
			}
			else
			{
				jQuery(oParentObject).find('[name="street[2]"]').val('').trigger('keyup');
			}

			if(sPostcode)
			{
				jQuery(oParentObject).find('[name="postcode"]').val(sPostcode).trigger('keyup');
			}

			if(sRegion)
			{
				jQuery(oParentObject).find('[name="region"]').val(sRegion).trigger('keyup');
			}

			if(sCity)
			{
				jQuery(oParentObject).find('[name="city"]').val(sCity).trigger('keyup');
			}

			jQuery(oParentObject).find('[name="pc_postcode_housenumber"] + div.error-message').remove();

		}
		else if(oResults.processed == 'failed')
		{
			jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').after('<div class="error-message field-error">Error: ' + oResults.message + '</div>');
		}
		else
		{
			console.log('Process seems to have failed, object given:', oResults);
		}
	}
	
	// Set additions to select field
	function postcodecheckout_setHouseNumberAdditions(oParentObject, aAdditions)
	{
		var oAdditionsField = jQuery(oParentObject).find('[name="pc_postcode_housenumber_addition"]');

		oAdditionsField.empty();

		if(oAdditionsField && jQuery(aAdditions).length > 1)
		{
			var sAdditionValue = oAdditionsField.val();

			jQuery.each(aAdditions, function(key, sAddition)
			{
				oAdditionsField
				.append(jQuery('<option>', { value : sAddition })
				.text(sAddition));
			});

			oAdditionsField.parents('div').eq(1).show(pc4m2_speed);
			oAdditionsField.val(sAdditionValue);
		}
		else
		{
			oAdditionsField.parents('div').eq(1).hide(pc4m2_speed);
		}
	}

	// Set addition to selected addition
	function postcodecheckout_changeHousenumberAddition(oElement, sNewAdditionValue)
	{
		var oParentObject = postcodecheckout_getParentElement(oElement);
		var aSettings = getSettings();
		var sCurrentStreetValue = false;
		var sNewStreetvalue = false;
		var sAddition = false;

		if(sNewAdditionValue == 'undefined')
		{
			return;
		}

		sCurrentStreetValue = postcodecheckout_removeAdditionFromStreet(jQuery(oParentObject).find('[name="street[0]"]').val());

		sAddition = (sNewAdditionValue) ? ' ' +  sNewAdditionValue : '';
		sNewStreetvalue = sCurrentStreetValue + sAddition;

		if(aSettings.useStreet3AsHouseNumberAddition)
		{
			jQuery(oParentObject).find('[name="street[2]"]').val(sNewAdditionValue).keyup();
		}
		else if(aSettings.useStreet2AsHouseNumber)
		{
			sCurrentStreetValue = postcodecheckout_removeAdditionFromStreet(jQuery(oParentObject).find('[name="street[1]"]').val());

			sAddition = (sNewAdditionValue) ? ' ' +  sNewAdditionValue : '';
			sNewStreetvalue = sCurrentStreetValue + sAddition;

			jQuery(oParentObject).find('[name="street[1]"]').val(sNewStreetvalue).keyup();
		}
		else
		{
			jQuery(oParentObject).find('[name="street[0]"]').val(sNewStreetvalue).keyup();
		}

		sOldAddition = sNewAdditionValue;
	}

	// Remove addition from street field when needed
	function postcodecheckout_removeAdditionFromStreet(sCurrentFieldValue)
	{
		if(sOldAddition !== null && sOldAddition && sCurrentFieldValue)
		{
			var aParts = ("" + sCurrentFieldValue).split(" ");

			if(aParts.length > 1)
			{
				aParts.pop();
			}

			sCurrentFieldValue = aParts.join(" ");

			return sCurrentFieldValue;
		}

		return sCurrentFieldValue;
	}

	// Get magento settings
	function getSettings()
	{
		var settings = window.checkoutConfig.pc_postcode.settings;
		return settings;
	}

	// Get parent elements for each form
	function postcodecheckout_getParentElement(oElement)
	{
		// #co-shipping-form
		var oParentElementShipping = jQuery(oElement).closest('#co-shipping-form');

		// .payment-method
		var oParentElementBilling = jQuery(oElement).closest('.payment-method');

		// .checkout-billing-address
		var oParentShippingAsBilling = jQuery(oElement).closest('#checkout-billing-address');

		if(jQuery(oParentElementShipping).length)
		{
			return jQuery(oParentElementShipping);
		}
		else if(jQuery(oParentElementBilling).length)
		{
			return jQuery(oParentElementBilling);
		}
		else if(jQuery(oParentShippingAsBilling).length)
		{
			return jQuery(oParentShippingAsBilling);
		}
		else
		{
			// console.log('No PARENT was found found on: ' + oElement);
			return false;
		}
	}

	// Hide validation fields
	function postcodecheckout_hideFields(oElement)
	{
		// console.log('postcodecheckout_hideFields()');

		var oParentObject = postcodecheckout_getParentElement(oElement);

		if(oParentObject)
		{
			jQuery(oParentObject).find('[name="pc_postcode_postcode"]').prop("required", false)
			jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').prop("required", false)

			jQuery(oParentObject).find('.pc_postcode').hide(pc4m2_speed);
			jQuery(oParentObject).find('.pc_postcode_addition').hide(pc4m2_speed);

			var oDisableElement = jQuery(oParentObject).find('input[name="pc_postcode_disable"]');
			postcodecheckout_checkDisable(oDisableElement);
		}
	}

	// Show validation fields
	function postcodecheckout_showFields(oElement)
	{
		// console.log('postcodecheckout_showFields()');

		var oParentObject = postcodecheckout_getParentElement(oElement);

		if(oParentObject)
		{
			jQuery(oParentObject).find('.pc_postcode').show(pc4m2_speed);
			jQuery(oParentObject).find('.pc_postcode_disable').show(pc4m2_speed);

			jQuery(oParentObject).find('[name="pc_postcode_postcode"]').prop("required", true)
			jQuery(oParentObject).find('[name="pc_postcode_housenumber"]').prop("required", true)

			var oDisableElement = jQuery(oParentObject).find('input[name="pc_postcode_disable"]');
			postcodecheckout_checkDisable(oDisableElement);

			jQuery(oParentObject).find('[name="street[0]"]').val('').trigger('keyup');
			jQuery(oParentObject).find('[name="street[1]"]').val('').trigger('keyup');
			jQuery(oParentObject).find('[name="street[2]"]').val('').trigger('keyup');
			jQuery(oParentObject).find('[name="postcode"]').val('').trigger('keyup');
			jQuery(oParentObject).find('[name="region"]').val('').trigger('keyup');
			jQuery(oParentObject).find('[name="city"]').val('').trigger('keyup');

			var sId = jQuery(oParentObject).find('.pc_postcode [name="pc_postcode_postcode"]').attr('id');

			var sCountryCodeIso3 = postcodecheckout_convertIso2ToIso3(postcodecheckout_returnCountry(oElement));

			// console.log(sCountryCodeIso3);
		}
	}

	// Return compatible countries
	function postcodecheckout_returnCountry(oElement)
	{
		var aCountries = ['NL'];
		var oParentObject = postcodecheckout_getParentElement(oElement);
		var sCountryCode = jQuery(oParentObject).find('select[name="country_id"]').val();

		if(jQuery.inArray(sCountryCode, aCountries) > -1)
		{
			return sCountryCode;
		}
		else
		{
			return false;
		}
	}

	// Toggle fields if country is not supported
	function postcodecheckout_toggleCountry(oElement)
	{
		var bValidCountry = postcodecheckout_returnCountry(oElement);

		if(bValidCountry)
		{
			postcodecheckout_showFields(oElement);
		}
		else
		{
			postcodecheckout_hideFields(oElement);
		}
	}

	// Convert from ISO2 to ISO3
	function postcodecheckout_convertIso2ToIso3(sIso2)
	{
		var aIsoCountries = {"BD": "bgd", "BE": "bel", "BF": "bfa", "BG": "bgr", "BA": "bih", "BB": "brb", "WF": "wlf", "BL": "blm", "BM": "bmu", "BN": "brn", "BO": "bol", "BH": "bhr", "BI": "bdi", "BJ": "ben", "BT": "btn", "JM": "jam", "BV": "bvt", "BW": "bwa", "WS": "wsm", "BQ": "bes", "BR": "bra", "BS": "bhs", "JE": "jey", "BY": "blr", "BZ": "blz", "RU": "rus", "RW": "rwa", "RS": "srb", "TL": "tls", "RE": "reu", "TM": "tkm", "TJ": "tjk", "RO": "rou", "TK": "tkl", "GW": "gnb", "GU": "gum", "GT": "gtm", "GS": "sgs", "GR": "grc", "GQ": "gnq", "GP": "glp", "JP": "jpn", "GY": "guy", "GG": "ggy", "GF": "guf", "GE": "geo", "GD": "grd", "GB": "gbr", "GA": "gab", "SV": "slv", "GN": "gin", "GM": "gmb", "GL": "grl", "GI": "gib", "GH": "gha", "OM": "omn", "TN": "tun", "JO": "jor", "HR": "hrv", "HT": "hti", "HU": "hun", "HK": "hkg", "HN": "hnd", "HM": "hmd", "VE": "ven", "PR": "pri", "PS": "pse", "PW": "plw", "PT": "prt", "SJ": "sjm", "PY": "pry", "IQ": "irq", "PA": "pan", "PF": "pyf", "PG": "png", "PE": "per", "PK": "pak", "PH": "phl", "PN": "pcn", "PL": "pol", "PM": "spm", "ZM": "zmb", "EH": "esh", "EE": "est", "EG": "egy", "ZA": "zaf", "EC": "ecu", "IT": "ita", "VN": "vnm", "SB": "slb", "ET": "eth", "SO": "som", "ZW": "zwe", "SA": "sau", "ES": "esp", "ER": "eri", "ME": "mne", "MD": "mda", "MG": "mdg", "MF": "maf", "MA": "mar", "MC": "mco", "UZ": "uzb", "MM": "mmr", "ML": "mli", "MO": "mac", "MN": "mng", "MH": "mhl", "MK": "mkd", "MU": "mus", "MT": "mlt", "MW": "mwi", "MV": "mdv", "MQ": "mtq", "MP": "mnp", "MS": "msr", "MR": "mrt", "IM": "imn", "UG": "uga", "TZ": "tza", "MY": "mys", "MX": "mex", "IL": "isr", "FR": "fra", "IO": "iot", "SH": "shn", "FI": "fin", "FJ": "fji", "FK": "flk", "FM": "fsm", "FO": "fro", "NI": "nic", "NL": "nld", "NO": "nor", "NA": "nam", "VU": "vut", "NC": "ncl", "NE": "ner", "NF": "nfk", "NG": "nga", "NZ": "nzl", "NP": "npl", "NR": "nru", "NU": "niu", "CK": "cok", "XK": "xkx", "CI": "civ", "CH": "che", "CO": "col", "CN": "chn", "CM": "cmr", "CL": "chl", "CC": "cck", "CA": "can", "CG": "cog", "CF": "caf", "CD": "cod", "CZ": "cze", "CY": "cyp", "CX": "cxr", "CR": "cri", "CW": "cuw", "CV": "cpv", "CU": "cub", "SZ": "swz", "SY": "syr", "SX": "sxm", "KG": "kgz", "KE": "ken", "SS": "ssd", "SR": "sur", "KI": "kir", "KH": "khm", "KN": "kna", "KM": "com", "ST": "stp", "SK": "svk", "KR": "kor", "SI": "svn", "KP": "prk", "KW": "kwt", "SN": "sen", "SM": "smr", "SL": "sle", "SC": "syc", "KZ": "kaz", "KY": "cym", "SG": "sgp", "SE": "swe", "SD": "sdn", "DO": "dom", "DM": "dma", "DJ": "dji", "DK": "dnk", "VG": "vgb", "DE": "deu", "YE": "yem", "DZ": "dza", "US": "usa", "UY": "ury", "YT": "myt", "UM": "umi", "LB": "lbn", "LC": "lca", "LA": "lao", "TV": "tuv", "TW": "twn", "TT": "tto", "TR": "tur", "LK": "lka", "LI": "lie", "LV": "lva", "TO": "ton", "LT": "ltu", "LU": "lux", "LR": "lbr", "LS": "lso", "TH": "tha", "TF": "atf", "TG": "tgo", "TD": "tcd", "TC": "tca", "LY": "lby", "VA": "vat", "VC": "vct", "AE": "are", "AD": "and", "AG": "atg", "AF": "afg", "AI": "aia", "VI": "vir", "IS": "isl", "IR": "irn", "AM": "arm", "AL": "alb", "AO": "ago", "AQ": "ata", "AS": "asm", "AR": "arg", "AU": "aus", "AT": "aut", "AW": "abw", "IN": "ind", "AX": "ala", "AZ": "aze", "IE": "irl", "ID": "idn", "UA": "ukr", "QA": "qat", "MZ": "moz"};

		return aIsoCountries[sIso2];
	}
});