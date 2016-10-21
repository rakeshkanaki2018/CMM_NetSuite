require(['N/http', 'N/log'],

    function (http, log) {

        headers = {
            "content-type": 'application/json',
            "User-Agent-x": 'SuiteScript-Call'

        };

        data = JSON.stringify({
            "username": "cw@casamarco.com",
            "password": "BneyYU6Y*s8x",
            "secretkey": "kXasmC1zLPNJkMn95D9IztxmZx91No8p",
            "data": {
                "xid": "1283",
                "order_info": [{
                    "type": "Paper",
                    "width": "12",
                    "height": "18",
                    "quantity": "1",
                    "thumb_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "large_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "item_cost": "18.00",
                    "title": "first days - 12x18 Inch",
                    "finishing": "Rolled"
                }, {
                    "type": "Canvas",
                    "width": "20",
                    "height": "30",
                    "quantity": "1",
                    "thumb_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "large_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "item_cost": "30.00",
                    "title": "MY DREAM edited - 20x30 Inch Print",
                    "finishing": "Stretched"
                }, {
                    "type": "Canvas",
                    "width": "12",
                    "height": "18",
                    "quantity": "1",
                    "thumb_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "large_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "item_cost": "18.00",
                    "title": "somewhen - 12x18 Inch",
                    "finishing": "Jet Black",
                    "frame": "Boxed Frame"
                }, {
                    "type": "Paper",
                    "width": "10",
                    "height": "25",
                    "quantity": "1",
                    "thumb_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "large_img": "http:\/\/www.mywebsite.com\/img\/preview_1.jpg",
                    "item_cost": "18.00",
                    "title": "Fulgens Litus",
                    "frame": "Black",
                    "finishing": "Frame",
                    "personalization": "Framed 12x27"
                }],
                "billing_address": {
                    "company": "",
                    "name": "Jason Honey",
                    "address": "12837 SE 156th Ave",
                    "city": "Happy Valley",
                    "zip": "97086",
                    "state": "OR",
                    "country": "US",
                    "phone": "310-869-4794",
                    "email": "jasonhoney@mac.com"
                },
                "shipping_address": {
                    "company": "",
                    "name": "Jason Honey",
                    "address": "12837 SE 156th Ave",
                    "city": "Happy Valley",
                    "zip": "97086",
                    "state": "OR",
                    "country": "US",
                    "phone": "310-869-4794",
                    "email": "jasonhoney@mac.com"
                },
                "shipping": {
                    "carrier": "FEDEX",
                    "service": "GROUND_HOME_DELIVERY",
                    "shipping_cost": "12.34",
                    "account": "108984585"
                }
            }
        });

        try {
            var request = http.post({
                url: 'http://gatewaybeta.marcofinearts.com/v1/push_order',
                body: data,
                headers: headers
            });

            log.debug([request.code, request.body, request.headers]);

        } catch (e) {
            log.error(e);
        }
    });