'use strict';

let InsertSalesOrder = function (ncUtil, channelProfile, flowContext, payload, callback) {

    let functionName = "InsertSalesOrder";
    log("Begin Insert Sales Order...");

    let out = {
        ncStatusCode: null,
        payload: {}
    };

    log("Validate arguments...");
    let validationMessages = validateArguments();

    if (validationMessages.length === 0) {

        try {

            const soap = require("soap-ntlm-2");

            let url = channelProfile.channelSettingsValues.wsdl_uri_Order;

            let options = {
                wsdl_options: {
                    ntlm: true,
                    strictSSL: false,
                    rejectUnauthorized: false,
                    username: channelProfile.channelAuthValues.username,
                    password: channelProfile.channelAuthValues.password,
                    workstation: channelProfile.channelAuthValues.workstation,
                    domain: channelProfile.channelAuthValues.domain
                }
            };

            log("Assigning customerRemoteID '" + payload.customerRemoteID + "' to Sell_to_No.");
            payload.doc.Sell_to_No = payload.customerRemoteID;

            let args = {
                eC_Order: {
                    SalesOrder: payload.doc
                },
                orderStatus: ""
            };

            soap.createClient(url, options, function (err, client) {
                if (err) {
                    logError(err);
                    out.ncStatusCode = 500;
                    out.payload.error = {
                        err: err
                    };
                    callback(out);

                } else {
                    client.setSecurity(new soap.NtlmSecurity(options.wsdl_options));
                    client.Create_Order(args, function (err, result) {

                        if (err) {
                            logError(err);
                            out.ncStatusCode = 500;
                            out.payload.error = {
                                err: err
                            };
                            callback(out);

                        } else {

                            if (result.orderStatus) {
                                out.ncStatusCode = 201;
                                out.payload.salesOrderRemoteID = payload.doc.Order_No;
                                out.payload.salesOrderBusinessReference = payload.doc.Order_No;
                            } else {
                                logError(JSON.stringify(result));
                                out.ncStatusCode = 400;
                                out.payload.error = {
                                    err: result
                                };
                            }
                            callback(out);
                        }
                    })
                }
            })

        } catch (error) {
            logError("Exception occurred in InsertSalesOrder: " + error);
            out.ncStatusCode = 500;
            out.payload.error = {
                err: error,
                stack: error.stackTrace
            };
            callback(out);
        }
    } else {
        out.ncStatusCode = 400;
        out.payload.error = {
            err: "Invalid request: " + validationMessages.join(",")
        };
        callback(out);
    }

    function validateArguments() {

        let validationMessages = [];

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

                if (typeof channelProfile.channelAuthValues.domain !== "string" || channelProfile.channelAuthValues.domain.trim().length === 0) {
                    validationMessages.push("The channelProfile.channelAuthValues.domain string is either missing or invalid.");
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
                validationMessages.push("payload.doc is either missing or invalid.");
            }

            if (!payload.customerRemoteID) {
                validationMessages.push("The payload.customerRemoteID is either missing or invalid.");
            }
        } else {
            validationMessages.push("The payload object is either missing or invalid.");
        }

        // Validate callback function
        if (typeof callback !== "function") {
            validationMessages.push("The callback function is either missing or invalid.");
            validationMessages.forEach(logError);
            throw new TypeError(validationMessages[validationMessages.length - 1]);
        }

        // Log the validation messages
        validationMessages.forEach(logError);

        return validationMessages;
    }

    function logError(msg) {
        console.log("[error] " + functionName + ": " + msg);
    };

    function log(msg) {
        console.log("[info] " + functionName + ": " + msg);
    };
};

module.exports.InsertSalesOrder = InsertSalesOrder;