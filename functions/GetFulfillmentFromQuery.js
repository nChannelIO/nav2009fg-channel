'use strict';

let _ = require('lodash');
let moment = require('moment');
let utcOffset = '-0400'; //EDT
let format = 'MM/DD/YYYY hh:mm:ss A';
let soap = require('soap-ntlm-2');

let GetFulfillmentFromQuery = function (ncUtil, channelProfile, flowContext, payload, callback) {

    log("Begin GetFulfillmentFromQuery...");

    let out = {
        ncStatusCode: null,
        response: {},
        payload: {}
    };

    let validationMessages = validateArguments();

    if (validationMessages.length === 0) {

        try {

            let url = channelProfile.channelSettingsValues.wsdl_uri_Order;

            let options = {
                wsdl_options: {
                    ntlm: true,
                    username: channelProfile.channelAuthValues.username,
                    password: channelProfile.channelAuthValues.password,
                    workstation: channelProfile.channelAuthValues.workstation,
                    domain: channelProfile.channelAuthValues.domain,
                    strictSSL: false,
                    rejectUnauthorized: false
                }
            };

            let args = {
                order_No: flowContext.orderNumberFilter + "*",
                shipped_Start_DateTime: moment(payload.doc.modifiedDateRange.startDateGMT).utcOffset(utcOffset).format(format),
                shipped_End_DateTime: moment(payload.doc.modifiedDateRange.endDateGMT).utcOffset(utcOffset).format(format),
                ec_Transactions: "",
                export_Status: ""
            };

            log(`Using URL: [${url}]`);

            soap.createClient(url, options, function (err, client) {
                if (err) {
                    let errStr = String(err);

                    if (errStr.indexOf("Code: 401") !== -1) {
                        logError("401 Unauthorized (Invalid Credentials) " + errStr);
                        out.ncStatusCode = 400;
                        out.response.endpointStatusCode = 401;
                        out.response.endpointStatusMessage = "Unauthorized";
                    } else {
                        logError("Error creating client - " + errStr);
                        out.ncStatusCode = 500;
                    }

                    out.payload.error = {
                        err: errStr
                    };

                    callback(out);
                } else {
                    client.setSecurity(new soap.NtlmSecurity(options.wsdl_options));
                    client.Export_Order_Transactions(args, function (err, result) {
                        if (err) {
                            logError("Error making request - " + err);
                            out.ncStatusCode = 500;
                            out.payload.error = {err: err};
                            callback(out);
                        } else {
                            if (result.export_Status === "SUCCESS") {
                                // good api call - but might not have any fulfillments that meet search criteria
                                if (result.ec_Transactions.OrderTranscation.length === 0) {
                                    // error - should always have at least one blank node or 1 or more good nodes
                                    out.ncStatusCode = 400;
                                    out.payload.error = "unexpected xml returned";
                                } else if (result.ec_Transactions.OrderTranscation.length === 1 && !result.ec_Transactions.OrderTranscation[0].Customer_No) {
                                    // at least one node returned - see if it is empty node
                                    out.ncStatusCode = 204;
                                    out.payload = [];
                                } else {
                                    // valid data returned - one or more nodes of fulfillments
                                    out.ncStatusCode = 200;
                                    out.payload = [];
                                    result.ec_Transactions.OrderTranscation.forEach(fulfillment => {
                                        out.payload.push({
                                            doc: fulfillment,
                                            salesOrderRemoteID: fulfillment.Order_No,
                                            salesOrderBusinessReference: extractBusinessReference(channelProfile.salesOrderBusinessReferences, fulfillment),
                                            fulfillmentRemoteID: fulfillment.Order_No,
                                            fulfillmentBusinessReference: extractBusinessReference(channelProfile.fulfillmentBusinessReferences, fulfillment),
                                        });
                                    });
                                }
                            } else {
                                // validation error situation - process error message field
                                logError("Response error - " + result.return_value);
                                out.ncStatusCode = 400;
                                out.payload.error = result.return_value;
                            }
                            callback(out);
                        }
                    });
                }
            });

        } catch (error) {
            logError("Exception occurred in GetFulfillmentFromQuery: " + error);
            out.ncStatusCode = 500;
            out.payload.error = {err: error, stack: error.stackTrace};
            callback(out);
        }

    } else {
        logError("Validation failed - " + validationMessages.join(","));
        out.ncStatusCode = 400;
        out.payload.error = {
            err: "Invalid request: " + validationMessages.join(",")
        };
        callback(out);
    }

    function validateArguments() {

        let validationMessages = [];

        try {
            // Validate ncUtil object (not currently used)

            // Validate channelProfile object
            if (typeof channelProfile === "object" && channelProfile !== null) {
                // Validate channelProfile properties


                // Validate channelSettingsValues object
                if (typeof channelProfile.channelSettingsValues === "object" && channelProfile.channelSettingsValues !== null) {

                    if (typeof channelProfile.channelSettingsValues.wsdl_uri_Order !== "string" || channelProfile.channelSettingsValues.wsdl_uri_Order.trim().length === 0) {
                        validationMessages.push("The channelProfile.channelSettingsValues.wsdl_uri_Order string is either missing or invalid.");
                    }

                } else {
                    validationMessages.push("The channelProfile.channelSettingsValues object is either missing or invalid.");
                }

                // Validate channelAuthValues object
                if (typeof channelProfile.channelAuthValues === "object" && channelProfile.channelAuthValues !== null) {

                    if (typeof channelProfile.channelAuthValues.username !== "string" || channelProfile.channelAuthValues.username.trim().length === 0) {
                        validationMessages.push("The channelProfile.channelAuthValues.username string is either missing or invalid.");
                    }

                    if (typeof channelProfile.channelAuthValues.password !== "string" || channelProfile.channelAuthValues.password.trim().length === 0) {
                        validationMessages.push("The channelProfile.channelAuthValues.password string is either missing or invalid.");
                    }

                } else {
                    validationMessages.push("The channelProfile.channelAuthValues object is either missing or invalid.");
                }

            } else {
                validationMessages.push("The channelProfile object is either missing or invalid.");
            }

            // Validate flowContext object (not currently used)

            // Validate payload object
            if (typeof payload === "object" && payload !== null) {

                if (!payload.doc) {
                    validationMessages.push("The payload.doc is either missing or invalid.");
                }

            } else {
                validationMessages.push("The payload object is either missing or invalid.");
            }

            // Validate callback function
            if (typeof callback !== "function") {
                validationMessages.push("The callback function is either missing or invalid.");
                throw new TypeError(validationMessages[validationMessages.length - 1]);
            }
        } finally {
            // Log the validation messages
            validationMessages.forEach(logError);
        }

        return validationMessages;
    }

    function logError(msg) {
        console.error("[error] " + msg);
    }

    function log(msg) {
        console.log("[info] " + msg);
    }
};

function extractBusinessReference(businessReferences, doc) {
  if (!businessReferences || !Array.isArray(businessReferences)) {
    throw new Error('Error: businessReferences must be an Array');
  } else if (!doc || typeof doc !== 'object') {
    throw new Error('Error: doc must be an object');
  }

  let values = [];

  // Get the businessReference
  businessReferences.forEach(function (businessReference) {
    values.push(_.get(doc, businessReference));
  });

  return values.join(".");
}

module.exports.GetFulfillmentFromQuery = GetFulfillmentFromQuery;