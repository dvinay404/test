const request = require("request");
const reqprom = require("request-promise");

var firstTime = 1;
let json = '';
var url = 'https://orchestrator-demo.programneo.com/';
let responseText = '';
var userToken = '';
var bundleToBook = '';
var bundleJson = '';
var bundlePrice = '';
var flyrCartID = '';
var sapCartID = '';
var hybris_order_id = '';

var nStepInChat = 0;    // 0 : First time (invoke GET chat API), 1: Rest of chat till FLYR service (GET chat API), 2: Bundle listing obtained already

// Alexa handlers
const handlers = {
  'LaunchRequest': function () {
      let userCredentials = {"uid":"james@programneo.com","password":"password"};
      request.post({
          url: url + 'pcm-proxy/v2/travel/oauth/user/token',
          headers: {
              "Content-Type": "application/json",
          },
          body: userCredentials,
          json:true
      }, (error, response, body) => {
        //console.log(body);
        userToken = body.accessToken;
      });

    var firstTime = 1;
    json = '';
    responseText = '';
    userToken = '';
    bundleToBook = '';
    bundleJson = '';
    bundlePrice = '';
    flyrCartID = '';
    sapCartID = '';
    hybris_order_id = '';
    nStepInChat = 0;

    this.emit(':ask', 'Welcome to Santander. What would you like to do?');
    //this.emitWithState('NeoSemanticEngine');
  },
  'NeoSemanticEngine': function () {
    //var firstTime = 1;
    //firstTime++;
    if (nStepInChat === 0) {
      let freeText = this.event.request.intent.slots.FreeSpeech.value;
      //console.log(freeText);
      request.get(url + '/free-text-search?input_text=' + freeText, (error, response, body) => {
        json = JSON.parse(body);
        responseText = json.responseText;
        console.log(responseText);
        //console.log(userToken);
        //this.emit(':ask', responseText);
        nStepInChat = 1;
        return this.emit(':elicitSlot', 'FreeSpeech', responseText, responseText);
      });
    } else if (nStepInChat == 1) {

      json.inputText = this.event.request.intent.slots.FreeSpeech.value;

      request.post({
          url: url + 'free-text-search/conversation',
          headers: {
              "Content-Type": "application/json",
              "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
          },
          body: json,
          json:true
      }, (error, response, body) => {
        //console.log(body);
        json = body;// JSON.parse(body);
        //console.log(json);
        responseText = json.responseText;
        console.log(responseText);
        //console.log(json.search.destinations);
        //console.log(json.search.odPairs);

        if (responseText.indexOf('excluding yourself') > -1) {
          let bundleRequest =
            {"travelers":{"adult":2,"child":1},"search":{"odPairs":[{"origin":"JFK","destination":"CPT","departureDate":"2018-04-03","odAdvanced":{"cabinClass":"any"}},{"origin":"CPT","destination":"JFK","departureDate":"2018-04-08","odAdvanced":{"cabinClass":"any"}}],"destinations":[{"location":"CPT","arrivalDate":"2018-04-03","departureDate":"2018-04-08","hotelsCount":10,"activitiesCount":30}],"info":{"currency":"USD","language":"en_US","pos":"US"}},"userInfo":{"searchId":"410d39ef-efd9-4fff-81a0-100e4ac8b3ec","deviceId":"51146084-1627-44b5-808f-43cf5a4c36c4","userId":"91aa15b7-ba4a-4df2-aeab-3f069ad12245","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36","ip":"1.120.0.0.12"},"configuration":{"requestId":"fbe4e355-c819-41cc-bf7e-ea5ae0dfe0e2"}}

          request.post({
            url: url + 'bundle',
            headers: {
                "authorization": "Bearer " + userToken,
                "Content-Type": "application/json",
                "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
            },
            body: bundleRequest,
            json:true
          }, (error, response, body) => {
            console.log('bundle response', body);

            bundleToBook = body.bundles[0].bundle_id;
            bundleJson = body;

            // Add to cart now
            request.post({
                  url: url + 'cart',
                  headers: {
                      "authorization": "Bearer " + userToken,
                      "Content-Type": "application/json",
                      "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
                  },
                  body: {"user_id":"james@programneo.com"},
                  json:true
                }, (error, response, body) => {
                  console.log('cart response', body);

                  flyrCartID = body.synthetic_cart_id;
                  sapCartID = body.hybris_cart_id;

                  // Now add to cart
                request.post({
                  url: url + 'cart/add',
                  headers: {
                      "authorization": "Bearer " + userToken,
                      "Content-Type": "application/json",
                      "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
                  },
                  body: {"user_id":"james@programneo.com","synthetic_cart_id": flyrCartID ,"hybris_cart_id": sapCartID,"bundle_ids":[bundleToBook]},
                  json:true
                  }, (error, response, body) => {
                    console.log('add to cart', body);

                    // Mark payment
                    request.post({
                      url: url + 'pcm-proxy/v2/travel/users/current/carts/' + sapCartID + '/paymentdetails',
                      headers: {
                          "authorization": "Bearer " + userToken,
                          "Content-Type": "application/json",
                          "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
                      },
                      body: {"accountHolderName":"Seb Tester","billingAddress":{"country":{"isocode":"GB","name":"United Kingdom"},"defaultAddress":true,"firstName":"Seb","lastName":"Tester","line1":"38 Grosvenor Gardens","postalCode":"SW1W 0EB","region":{"countryIso":"GB","isocode":"GB"},"shippingAddress":true,"titleCode":"mr","town":"London"},"cardNumber":"4111111111111111","cardType":{"code":"visa"},"defaultPayment":true,"expiryMonth":"01","expiryYear":"2019","saved":true},
                      json:true
                      }, (error, response, body) => {
                        console.log('Mark payment', body);

                        // Mark payment
                        request.post({
                          url: url + 'pcm-proxy/v2/travel/users/current/orders?cartId=' + sapCartID + '&securityCode=123',
                          headers: {
                              "authorization": "Bearer " + userToken,
                              "Content-Type": "application/json",
                              "user-agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
                          },
                          body: {},
                          json:true
                          }, (error, response, body) => {
                            console.log('Place Order', body);
                            hybris_order_id = body.code;
                          });
                    });
                });
              });
          });

          nStepInChat = 2;
          this.emit(':elicitSlot', 'FreeSpeech', 'Are you travelling alone?');
        } else {
          this.emit(':elicitSlot', 'FreeSpeech', responseText, responseText);
        }
      });
    } else if (nStepInChat == 2) {  // Bundle Listing is obtained now
      nStepInChat = 3;
      this.emit(':elicitSlot', 'FreeSpeech', 'There are several available flights. Would you prefer to travel in the morning or afternoon?');
    } else if (nStepInChat == 3) {
      nStepInChat = 4;
      this.emit(':elicitSlot', 'FreeSpeech', 'Do you want to hear the other available options?');
    } else if (nStepInChat == 4) {
      nStepInChat = 5;
      this.emit(':elicitSlot', 'FreeSpeech', 'Do you want to configure the flight with your saved flight options.');
    } else if (nStepInChat == 5) {
      nStepInChat = 6;
      this.emit(':elicitSlot', 'FreeSpeech', 'You can select your seat now for no additional cost. If you don’t select your seat now you can do it later at your own convenience. Do you want to select your seat now?');
    } else if (nStepInChat == 6) {
      nStepInChat = 7;
      this.emit(':elicitSlot', 'FreeSpeech', 'We have a great tennis promotion available with this flight. Do you want to hear more about it?');
    } else if (nStepInChat == 7) {
      nStepInChat = 8;
      bundlePrice = bundleJson.bundles[0].bundle_price.total_price;
      this.emit(':elicitSlot', 'FreeSpeech', 'Your flight will cost a total of ' + bundlePrice + ' dollars including booking fees. Do you want to hear a breakdown of the booking fees?');
    } else if (nStepInChat == 8) {
      nStepInChat = 9;
      this.emit(':elicitSlot', 'FreeSpeech', 'Do you want to book with your credit carding ending 0000');
    } else if (nStepInChat == 9) {
      this.emit(':tell', 'Thank you, your order has been confirmed. Your reference number is ' + hybris_order_id.split('').join(' '));
    }
  },
  'Unhandled': function () {
		const HelpMessage = "Can you please repeat that?";
    this.emit(':ask', HelpMessage, HelpMessage);
	},
  'HelpIntent': function () {
		const HelpMessage = "We are here to offer the most suitable holiday deal for you. Let us know where you would like to start. For example, you may say - I want to go to Cape Town";
    this.emit(':ask', HelpMessage, HelpMessage);
	},
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye. Exiting NEO');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye. Exiting NEO');
  },
  'SessionEndedRequest': function() {
    this.emit(':tell', 'Bye bye');
  }
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.APP_ID = "amzn1.ask.skill.ae5e97b5-3f32-4ad9-861e-aa3a66acea5c";
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();

};
