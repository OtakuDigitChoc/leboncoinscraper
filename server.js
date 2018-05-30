var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var CronJob = require('cron').CronJob;
var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8080);
console.log('Server running at port 8080');

let idOffers = [];
console.info('The script is running', new Date())
try {
    new CronJob('*/30 9-23 * * *', function() { // every 30 min at 09h00 to 23h00
        console.info('Analize is runing', new Date())
        let smtpTransport = nodemailer.createTransport({
                        host: 'SSL0.OVH.NET',
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: "my@otakutech.ovh", // @todo replace email
                            pass: "YourPassWord"  // @todo put password
                        }
                    });
        let mail = {
            from: '"Mr bonne affaire 👻" <my@otakutech.ovh>', 
            to: 'abdelaliboulajine@gmail.com', 
            subject: '', 
            text: '',
            html: ''
        };
        const search = {
            categorie: "telephonie",
            type: "offres",
            region: "provence_alpes_cote_d_azur",
            department: "alpes_maritimes",
            keyword: "iphone",
            requests: [
                {
                    product: "iphone 6s",
                    price: {
                        min: 200,
                        max: 300
                    }
                },
                {
                    product: "iphone 7",
                    price: {
                        min: 300,
                        max: 500
                    }
                }
            ] 
        };
        let url = "https://www.leboncoin.fr/"
        url += search.categorie + "/";
        url += search.type + "/";
        url += search.region + "/";
        url += search.department + "/";
        url += "?th=1&";
        url += "q=" + search.keyword;

        request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);
                let nbInterestingOffer = 0;


                $('.tabsContent').children('ul').children('[itemtype="http://schema.org/Offer"]').each(function(i, elem) {
                    const offer = $(this).children('a');
                    const infos = JSON.parse(offer.attr('data-info'));
                    const link = offer.attr('href');
                    const section = offer.children('section');
                    const title = section.children("[itemprop=name]").text().trim().toLowerCase();
                    const price = section.children("[itemprop=price]").attr('content');
                    console.log(title,price)
                    search.requests.forEach(request => {
                        if(title.includes(request.product) && price >= request.price.min && price <= request.price.max && !idOffers.includes(infos.ad_listid)) {
                            idOffers.push(infos.ad_listid)
                            nbInterestingOffer++;
                            mail.html += "<div>";
                            mail.html += "<h4>Annonce numéro " + nbInterestingOffer + " : <a href='http:" + link + "'>" + title + "</a> " + price + "</h4>";
                            mail.text += link + "/n"
                            console.log(title + " - " +  price + " - " + "http:" + link);
                        }
                    })
                });

                if(nbInterestingOffer > 0) {
                    mail.subject += nbInterestingOffer + " bonne(s) affaire(s) - " + new Date()

                    smtpTransport.sendMail(mail, function(error, response){
                        if(error){
                            console.error("Error while try to sent mail", new Date());
                            console.log(error);
                        }else{
                            console.log("Mail sent succesfull", new Date())
                        }
                        smtpTransport.close();
                    });
                }
            }
            else {
                console.error('Error while try to fetch offers', error)
            }
        })
        }, null, true, 'Europe/Paris');
} catch(ex) {
	console.error("cron pattern not valid", ex);
}

try {
    new CronJob('0 22 * * *', function() {
        idOffers = idOffers.slice(0,9)
        console.info("Droped list id offres")
    }, null, true, 'Europe/Paris');
} catch(ex) {
	console.error("cron pattern not valid", ex);
}