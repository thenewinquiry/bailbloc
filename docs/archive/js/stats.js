pullData();

var payouts, donations;

function pullData() {

    pullPayoutData();
    pullDonationData();

    // get all the bb. server data
    $.ajax({

        url: "https://bb.darkinquiry.com/?step=80&n=140",
        type: 'get',
        cache: false,
        success: function(stats) {


            console.log(payouts);

            // reset the already paid stuff
            var payoutIndex = 0;
            var donationIndex = 0;
            var paidUSD = 0.0;
            var exchangedXMR = 0.0;
            var donatedXMR = 0.0;

            for (var i = stats.length - 1; i >= 0; i--) {

                // if the timestamp of the current data point is greater than an unused payout data point
                if (Object.keys(payouts).length > payoutIndex) {

                    console.log(payouts[payoutIndex].timestamp);

                    if (stats[i].timestamp > payouts[payoutIndex].timestamp) {

                        // add the check amount to running total
                        paidUSD += payouts[payoutIndex].check_amount_usd;
                        exchangedXMR += payouts[payoutIndex].amount_xmr;

                        payoutIndex++;

                        // console.log("payout calculated: " + paidUSD);
                    }
                }
            }

            // donations

            for (var i = stats.length - 1; i >= 0; i--) {

                if (Object.keys(donations).length > donationIndex) {
                    if (stats[i].timestamp > donations[donationIndex].timestamp) {

                        // add the check amount to running total
                        donatedXMR += donations[donationIndex].amount_xmr;

                        donationIndex++;
                    }
                }
            }

            var val = (stats[0].stats.amtDue + stats[0].stats.amtPaid) / 1000000000000;

            // add donations running total
            val += donatedXMR;

            var totalXMR = val;

            // subtract that which we have already exchanged
            val -= exchangedXMR;

            val = val * stats[0].ticker.price; // get USD

            // add total amount of money paid out in checks so far
            val += paidUSD;

            var totalUSD = val;

            // current stats are in 0
            var numWorkers = stats[0].n_miners;

            var exchangeRate = stats[0].ticker.price;


            // USD ... this one will be inaccurate but we can use it as a starting point
            // and change it out later once we've sifted all the data
            // var totalUSD = totalXMR * stats[0].ticker.price;

            $("#numWorkers").text(numWorkers);
            $("#totalXMR").text(totalXMR.toFixed(2));
            $("#totalUSD").text(totalUSD.toFixed(2));
            $("#numBailed").text((totalUSD/610).toFixed(0));

        }
    });
}

function pullPayoutData() {
    // get all the cashout entries
    $.ajax({

        url: "https://bailbloc.thenewinquiry.com/payouts.json",
        type: 'get',
        cache: false,
        success: function(stats) {

            payouts = stats;

        }
    });
}

function pullDonationData() {
    // get all the donation entries
    $.ajax({

        url: "https://bailbloc.thenewinquiry.com/donations.json",
        type: 'get',
        cache: false,
        success: function(stats) {

            donations = stats;

        }
    });
}