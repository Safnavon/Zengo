var express = require('express');
var router = express.Router();
var axios = require('axios')
//https://min-api.cryptocompare.com/data/pricehistorical?fsym=USD&tsyms=BTC,ETH&ts=1452680400
//https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=BTC&aggregate=1&toTs=1452680400&limit=1
const API_URL = "https://min-api.cryptocompare.com/"
const API_KEY = "983f8a86f211d17fa8ba47e44969bc79aede178b5b66ba6a3bd56a224fea24a4"
const API_COMPARE_PATH = "data/pricehistorical"


/* GET users listing. */
router.post('/compare', async function (req, res, next) {
    let {coins, date} = req.body;
    if (!coins || !date) {
        res.status(400).send("missing coins/date params")
    }

    let historyDateMillis = Math.floor(new Date(date).getTime() / 1000)
    let dateMillis = Math.floor(new Date().getTime() / 1000)

    if (historyDateMillis >= dateMillis) {
        res.status(400).send("date must be in the past")
    }
    let currentPromise = getDataByDate(coins, dateMillis)
    let historyPromise = getDataByDate(coins, historyDateMillis)

    let [currentResult, historyResult] = await Promise.all([currentPromise, historyPromise])
    let currentData = currentResult.data.USD
    let historyData = historyResult.data.USD

    console.log(JSON.stringify(historyData), JSON.stringify(currentData))

    let diffs = calculateDiffs(historyData, currentData)

    let sorted = diffs.sort((a, b) => {
        return a.diff > b.diff ? -1 : (a.diff < b.diff ? 1 : 0)
    })

    console.log(JSON.stringify(sorted))

    await res.json(sorted)

});

async function getDataByDate(coins, date) {
    let url = `${API_URL}${API_COMPARE_PATH}?api_key=${API_KEY}&fsym=USD&tsyms=${coins.join(',')}&ts=${date}`
    return axios.get(url)

}

function calculateDiffs(historyData, currentData) {
    return Object.keys(currentData).reduce((agg, key) => {
        let historyVal = 1 / historyData[key]
        let currentVal = 1 / currentData[key]
        let sign = 1
        if (historyVal > currentVal) {
            sign = -1
        }
        agg.push({diff: sign * 100 * Math.abs(currentVal - historyVal) / historyVal, name: key})
        return agg
    }, []);
}

module.exports = router;
