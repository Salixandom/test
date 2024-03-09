const {Pool} = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AniHub',
    password: '1911192',
    port: 5432,
});

module.exports = pool