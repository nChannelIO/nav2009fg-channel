'use strict';

let ExtractCustomerFromSalesOrder = function (ncUtil, channelProfile, flowContext, payload, callback) {

    let functionName = "ExtractCustomerFromSalesOrder";
    log("Begin Extract Customer From Sales Order...");
    
    let out = {
        ncStatusCode: null,
        payload: {}
    };

    log("Validate arguments...");
    let validationMessages = validateArguments();

    if (validationMessages.length === 0) {

        try {

            if (payload.doc.Sell_to_Email) {

                out.payload.doc = {
                    CustomerNo: payload.doc.Sell_to_No,
                    E_Mail: payload.doc.Sell_to_Email,
                    Name: payload.doc.Sell_to_Customer_Name,
                    Phone_No: "",
                    Address: payload.doc.Ship_to_Address,
                    Address_2: "",
                    City: payload.doc.Ship_to_City,
                    County: payload.doc.Ship_to_Post_County,
                    Postal_Code: payload.doc.Ship_to_Post_Code
                };

                log("Extracted customer with email '" + out.payload.doc.Sell_to_Email + "' from the sales order document.");
                log(JSON.stringify(out.payload));
                out.ncStatusCode = 200;
                callback(out);

            } else {
                log(JSON.stringify(payload.doc));
                logError("No customer information found on the sales order document (Sell_to_Email is missing or invalid).");
                out.ncStatusCode = 204;
                callback(out);
            }

        } catch (error) {
            logError("Exception occurred in ExtractCustomerFromSalesOrder: " + error);
            out.ncStatusCode = 500;
            out.payload.error = {
                err: error,
                stackTrace: error.stackTrace
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

            // Validate channelProfile object (not currently used)

            // Validate flowContext object (not currently used)

            // Validate payload object
            if (typeof payload === "object" && payload !== null) {

                if (!payload.doc) {
                    validationMessages.push("payload.doc is either missing or invalid.");
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

module.exports.ExtractCustomerFromSalesOrder = ExtractCustomerFromSalesOrder;