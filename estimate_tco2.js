import * as dfd from 'danfojs-node';

function to_dict(df) {
    const rows = df.toJSON();
    const entries = df.index.map((e, i) => ({ [e]: rows[i] }));
    return Object.assign({}, ...entries);
}

async function update() {
    // load current price
    const coingecko = await dfd.readJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum');
    const current_price = coingecko.toJSON()[0].current_price;

    // load fees and daily ktco2
    let fees = await dfd.readCSV('https://github.com/kylemcdonald/ethereum-nft-activity/raw/gh-pages/output/nft-fees-percentages.csv');
    let ktco2 = await dfd.readCSV('https://github.com/kylemcdonald/ethereum-emissions/raw/gh-pages/output/daily-ktco2.csv');

    // index by date column
    fees.setIndex({ column: 'Date', inplace: true });
    ktco2.setIndex({ column: 'Date', inplace: true });

    // select subset of keys for fees
    const target_keys = [
        'OpenSea',
        'Nifty Gateway',
        'Rarible',
        'Foundation',
        'Makersplace',
        'SuperRare'
    ];
    fees = fees.loc({ columns: target_keys });

    ktco2 = ktco2.loc({ columns: ['best'] });

    // in case the fees and ktco2 are out of sync
    // make sure we discard whichever is ahead
    let set1 = new Set(fees.index);
    let set2 = new Set(ktco2.index);
    let common = [...set1].filter(x => set2.has(x));
    fees = fees.loc({ rows: common });
    ktco2 = ktco2.loc({ rows: common });

    // compute tco2 table using best daily ktco2 and fees percentages
    let tco2 = ktco2.loc({ rows: fees.index });
    tco2 = fees.mul(tco2).mul(1e3);

    // get the sum across all time and mean across the last week
    let total_tco2 = tco2.sum({ axis: 0 });
    let recent_daily_mean = tco2.tail(7).mean({ axis: 0 });

    let concat = dfd.concat({ dfList: [total_tco2, recent_daily_mean], axis: 1 });
    let data = new dfd.DataFrame(concat.$data, { index: target_keys, columns: ['total_tco2', 'daily_tco2'] });

    let output = {
        'updated': Date.now() / 1000,
        'current_price': current_price,
        'data': to_dict(data)
    }
    console.log(JSON.stringify(output, null, 2));
}

update();