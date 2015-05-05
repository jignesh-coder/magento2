/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*global define*/
define(
    [
        '../model/quote',
        '../model/url-builder',
        '../model/step-navigator',
        'Magento_Ui/js/model/errorlist',
        'mage/storage',
        'underscore'
    ],
    function(quote, urlBuilder, navigator, errorList, storage, _) {
        "use strict";
        return function (paymentMethodCode, additionalData) {
            // TODO add support of additional payment data for more complex payments
            var paymentMethodData =
                {
                    "cartId": quote.getQuoteId(),
                    "paymentMethod": {
                        "method": paymentMethodCode,
                        "po_number": null,
                        "cc_owner": null,
                        "cc_number": null,
                        "cc_type": null,
                        "cc_exp_year": null,
                        "cc_exp_month": null,
                        "additional_data": null
                    }
                },
                shippingMethodCode = quote.getSelectedShippingMethod()().split("_"),
                shippingMethodData = {
                    "shippingCarrierCode" : shippingMethodCode[0],
                    "shippingMethodCode" : shippingMethodCode[1]
                },
                serviceUrl;
            if (quote.getCheckoutMethod()() === 'guest' || quote.getCheckoutMethod()() === 'register') {
                serviceUrl = urlBuilder.createUrl('/guest-carts/:quoteId/collect-totals', {quoteId: quote.getQuoteId()});
            } else {
                serviceUrl = urlBuilder.createUrl('/carts/mine/collect-totals', {});
            }
            if (quote.isVirtual()) {
                return storage.put(
                    serviceUrl,
                    JSON.stringify(_.extend(paymentMethodData))
                ).done(
                    function (response) {
                        quote.setPaymentMethod(paymentMethodCode);
                        quote.setTotals(response);
                        navigator.setCurrent('paymentMethod').goNext();
                    }
                ).error(
                    function (response) {
                        var error = JSON.parse(response.responseText);
                        errorList.add(error);
                        quote.setPaymentMethod(null);
                    }
                );
            } else {
                if (!_.isEmpty(quote.getShippingCustomOptions()())) {
                    shippingMethodData = _.extend(
                        shippingMethodData,
                        {
                            additionalData: {
                                extension_attributes: quote.getShippingCustomOptions()()
                            }
                        }
                    );
                }
                return storage.put(
                    serviceUrl,
                    JSON.stringify(_.extend(paymentMethodData, shippingMethodData))
                ).done(
                    function (response) {
                        quote.setPaymentMethod(paymentMethodCode);
                        quote.setTotals(response);
                        navigator.setCurrent('paymentMethod').goNext();
                    }
                ).error(
                    function (response) {
                        var error = JSON.parse(response.responseText);
                        errorList.add(error);
                        quote.setPaymentMethod(null);
                    }
                );
            }
        };
    }
);
