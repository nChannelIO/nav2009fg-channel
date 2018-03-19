'use strict';

let expect = require('chai').expect;
let _ = require('lodash');
let fulfillment = require('../functions/GetFulfillmentFromQuery.js');
let channelProfile = {
  channelAuthValues: require('./channelAuthValues.json'),
  channelSettingsValues: {
    wsdl_uri_Order: "http://fgiecommerce.fgoldman.com:7047/DynamicsNAV/WS/TEST-FGI/Codeunit/ECommerce_Order?wsdl"
  },
  salesOrderBusinessReferences: ['Order_No'],
  fulfillmentBusinessReferences: ['Order_No']
};
let flowContext = {
  orderNumberFilter: 'E'
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
            startDateGMT: "2018-03-01T14:40:00.000Z",
            endDateGMT: "2018-03-01T14:41:00.000Z",
          }
        }
      };
      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, flowContext, examplePayload, (response) => {
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
            startDateGMT: "2018-03-12T13:54:00.000Z",
            endDateGMT: "2018-03-12T13:56:00.000Z",
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

      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, flowContext, examplePayload, (response) => {
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
						startDateGMT: "2018-03-01T14:41:00.000Z",
            endDateGMT: "2018-03-16T14:41:00.000Z",
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

      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, flowContext, examplePayload, (response) => {
        console.log(response);
				expect(response.ncStatusCode).to.be.equal(200);
				expect(response.payload).to.be.an('Array');
				expect(response.payload).to.have.length(2);
				let docs = [];
        response.payload.forEach(fulfillment => {
          expect(fulfillment).to.have.property('doc');
          docs.push(fulfillment.doc);
          expect(fulfillment).to.have.property('salesOrderRemoteID');
          expect(fulfillment).to.have.property('salesOrderBusinessReference');
          expect(fulfillment).to.have.property('fulfillmentRemoteID');
          expect(fulfillment).to.have.property('fulfillmentBusinessReference');
        });
        expect(docs).to.include.deep.members(expectedFulfillments);
				done();
			});
		});

    it('should return 400 because the channel profile does not contain the wsdl_uri_Order', (done) => {
      let examplePayload = {
        doc: {
          modifiedDateRange: {
            startDateGMT: "2018-03-01T14:41:00.000Z",
            endDateGMT: "2018-03-16T14:41:00.000Z",
          }
        }
      };

      let channelProfile = {
        channelAuthValues: {
          account: 'test',
          username: "fgiecommercews",
          password: "Jewel!2018",
          domain: "fgoldman"
        },
        channelSettingsValues: {
          wsdl_uri_Order: ""
        },
        salesOrderBusinessReferences: ['Order_No'],
        fulfillmentBusinessReferences: ['Order_No']
      };

      fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, flowContext, examplePayload, (response) => {
        expect(response.ncStatusCode).to.be.equal(400);
        expect(response.payload).to.be.an('Object');
        expect(response.payload).to.have.property('error');
        done();
      });
    });

    it.skip('should query by date range but fail with a 500 because...? - request success and error message', (done) => {
			let examplePayload = {			
				doc: {
					modifiedDateRange: {
						startDateGMT: "2018-03-01T14:41:00.000Z",
            endDateGMT: "2018-03-16T14:41:00.000Z",
					}
				}
			};
			fulfillment.GetFulfillmentFromQuery(ncUtil, channelProfile, flowContext, examplePayload, (response) => {
				expect(response.ncStatusCode).to.be.equal(500);
				expect(response.payload).to.be.an('Object');
				expect(response.payload).to.have.property('error');
				done();
			});
		});		
	});
});
