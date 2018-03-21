'use strict';

let CheckForCustomer = function (ncUtil, channelProfile, flowContext, payload, callback) {

    let functionName = "CheckForCustomer";
    log("Begin Check For Customer...");

    let out = {
        ncStatusCode: null,
        response: {},
        payload: {}
    };

    log("Validate arguments...");
    let validationMessages = validateArguments();

    if (validationMessages.length === 0) {

        try {

            const soap = require('soap-ntlm-2');

            let url = channelProfile.channelSettingsValues.wsdl_uri_Customer;

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

            let args = {
                email: payload.doc.E_Mail,
                customer_No: ""
            };

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
                    client.Check_Customer_Exist(args, function (err, result) {

                        if (err) {
                            logError(err);
                            out.ncStatusCode = 500;
                            out.payload.error = {
                                err: err
                            };
                            callback(out);

                        } else {
                            log("Request: " + client.lastRequest);
                            log("Response: " + JSON.stringify(result));

                            if (result.customer_No) {
                                out.ncStatusCode = 200;
                                out.payload.customerRemoteID = result.customer_No;
                                out.payload.customerBusinessReference = args.email;
                            } else if (result.return_value === false) {
                                out.ncStatusCode = 204;
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
            logError("Exception occurred in CheckForCustomer: " + error);
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

        try {
            // Validate ncUtil object (not currently used)

            // Validate channelProfile object
            if (typeof channelProfile === "object" && channelProfile !== null) {
                // Validate channelProfile properties

                // Validate channelSettingsValues object
                if (typeof channelProfile.channelSettingsValues === "object" && channelProfile.channelSettingsValues !== null) {

                    if (typeof channelProfile.channelSettingsValues.wsdl_uri_Customer !== "string" || channelProfile.channelSettingsValues.wsdl_uri_Customer.trim().length === 0) {
                        validationMessages.push("The channelProfile.channelSettingsValues.wsdl_uri_Customer string is either missing or invalid.");
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

                if (typeof payload.doc !== "object" || payload === null) {
                    validationMessages.push("payload.doc is either missing or invalid.");
                } else if (typeof payload.doc.E_Mail !== "string" || payload.doc.E_Mail.trim().length === 0) {
                    validationMessages.push("payload.doc.E_Mail is either missing or invalid.");
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
    };

    function logError(msg) {
        console.log("[error] " + functionName + ": " + msg);
    };

    function log(msg) {
        console.log("[info] " + functionName + ": " + msg);
    };
};

module.exports.CheckForCustomer = CheckForCustomer;