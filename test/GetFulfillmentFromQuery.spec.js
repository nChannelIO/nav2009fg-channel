'use strict';

let expect = require('chai').expect;
let _ = require('lodash');
let fulfillment = require('../functions/GetFulfillmentFromQuery.js');
let channelProfile = {
  channelSettingsSchema: {
    protocol: 'https',
		wsdl_uri_Order: 'http://fgiecommerce.fgoldman.com:7047/DynamicsNAV/WS/TEST-FGI/Codeunit/ECommerce_Order?wsdl'
  },
  channelAuthValues: {
    account: 'test',
		username: "fgiecommercews",
		password: "Jewel!2018",
		domain: "fgoldman"
  },
  channelSettingsValues: {
	  baseUrl: "http://fgiecommerce.fgoldman.com:7047/DynamicsNAV/WS/TEST-FGI"
  },
  salesOrderBusinessReferences: ['Order_No'],
  fulfillmentBusinessReferences: ['Order_No']
};

let ncUtil = {
  logger: null
};

describe('GetFulfillmentFromQuery', () => {

	describe('Poll for Order Fulfillments', () => {
    it('should query by date range and order prefix - 0 returned', (done) => {
      let examplePayload = {
        doc: {
          modifiedDateRange: {
            startDateGMT: "3/01/2018 2:40:00 PM",
            endDateGMT: "3/01/2018 2:41:00 PM"
          }
        }
      };
      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, null, examplePayload, (response) => {
        expect(response.ncStatusCode).to.be.equal(204);
        expect(response.payload).to.be.an('Array');
        expect(response.payload).to.have.length(0);
        done();
      });
    });

    it('should query by date range and order prefix - 1 returned', (done) => {
      let examplePayload = {
        doc: {
          modifiedDateRange: {
            startDateGMT: "03/12/18 01:54:00 AM",
            endDateGMT: "03/12/18 12:56:00 PM",
          }
        }
      };

      let expectedFulfillment = {
        Customer_No: "101",
        Order_No: "EC1244567",
        Line_No: 10000,
        ItemNo_Size: "01-LD040-G.00_09.00",
        Website_Code: "01",
        Ordered_Quantity: "1",
        Shipped_Quantity: "0",
        Shipping_Agent_Code: "UPS",
        Tracking_No: "",
        Shipment_No: "SS-3362314",
        Shipped_DateTime: "03/12/18 01:55 PM",
        Status: "Released"
      };

      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, null, examplePayload, (response) => {
        expect(response.ncStatusCode).to.be.equal(200);
        expect(response.payload).to.be.an('Array');
        expect(response.payload).to.have.length(1);
        expect(response.payload[0]).to.have.property('doc');
        expect(response.payload[0]).to.have.property('salesOrderRemoteID');
        expect(response.payload[0]).to.have.property('salesOrderBusinessReference');
        expect(response.payload[0]).to.have.property('fulfillmentRemoteID');
        expect(response.payload[0]).to.have.property('fulfillmentBusinessReference');
        expect(response.payload[0].doc).to.deep.equal(expectedFulfillment);
        expect(response.payload[0].salesOrderRemoteID).to.equal(expectedFulfillment.Order_No);
        expect(response.payload[0].salesOrderBusinessReference).to.equal(expectedFulfillment.Order_No);
        expect(response.payload[0].fulfillmentRemoteID).to.equal(expectedFulfillment.Order_No);
        expect(response.payload[0].fulfillmentBusinessReference).to.equal(expectedFulfillment.Order_No);
        done();
      });
    });

		it('should query by date range and order prefix - 2 returned', (done) => {
			let examplePayload = {			
				doc: {
					modifiedDateRange: {
						startDateGMT: "3/01/2018 2:41:00 PM",
						endDateGMT: "3/16/2018 2:41:00 PM"
					}
				}
			};

      let expectedFulfillments = [
        {
          Customer_No: "101",
          Order_No: "EC1244567",
          Line_No: 10000,
          ItemNo_Size: "01-LD040-G.00_09.00",
          Website_Code: "01",
          Ordered_Quantity: "1",
          Shipped_Quantity: "0",
          Shipping_Agent_Code: "UPS",
          Tracking_No: "",
          Shipment_No: "SS-3362314",
          Shipped_DateTime: "03/12/18 01:55 PM",
          Status: "Released"
        }, {
          Customer_No: "101",
          Order_No: "EC1254567",
          Line_No: 10000,
          ItemNo_Size: "01-LD040-G.00_10.00",
          Website_Code: "01",
          Ordered_Quantity: "1",
          Shipped_Quantity: "0",
          Shipping_Agent_Code: "UPS",
          Tracking_No: "",
          Shipment_No: "SS-3362315",
          Shipped_DateTime: "03/13/18 02:35 PM",
          Status: "Released"
        },
      ];

      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, null, examplePayload, (response) => {
				expect(response.ncStatusCode).to.be.equal(200);
				expect(response.payload).to.be.an('Array');
				expect(response.payload).to.have.length(2);
				let docs = [];
				let remoteIDs = []
        response.payload.forEach(fulfillment => {
          expect(fulfillment).to.have.property('doc');
          docs.push(fulfillment.doc);
          expect(fulfillment).to.have.property('salesOrderRemoteID');
          remoteIDs.push(fulfillment.doc);
          expect(fulfillment).to.have.property('salesOrderBusinessReference');
          expect(fulfillment).to.have.property('fulfillmentRemoteID');
          expect(fulfillment).to.have.property('fulfillmentBusinessReference');
        });
        expect(docs).to.include.deep.members(expectedFulfillments);
				done();
			});
		});

    it.skip('should query by date range but...? cause 400 - request success and error message', (done) => {
      let examplePayload = {
        doc: {
          modifiedDateRange: {
            startDateGMT: "3/01/2018 2:40:00 PM", //TODO determine query which will cause a 400
            endDateGMT: "3/01/2018 2:41:00 PM"
          }
        }
      };
      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, null, examplePayload, (response) => {
        expect(response.ncStatusCode).to.be.equal(400);
        expect(response.payload).to.be.an('Object');
        expect(response.payload).to.have.property('error');
        done();
      });
    });

    it('should query by date range but dates are wrong format - request failure and error message', (done) => {
			let examplePayload = {			
				doc: {
					modifiedDateRange: {
						startDateGMT: "2018-11-23T09:44:07-06:00",
						endDateGMT: "2013-03-14T11:15:04-06:00"
					}
				}
			};
			fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, null, examplePayload, (response) => {
				expect(response.ncStatusCode).to.be.equal(500);
				expect(response.payload).to.be.an('Object');
				expect(response.payload).to.have.property('error');
				done();
			});
		});		
	});
});
