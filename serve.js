const express = require('express')
const graphqlHttp = require('express-graphql')
const app = express()
const fetch = require('node-fetch')
const util = require('util')
const DataLoader = require('dataloader')
const parseXML = util.promisify(require('xml2js').parseString)
const schema = require('./schema')

const goodreadsApiKey = '4Dcpedwv5C2GzVdj3dRymA'
const fetchAuthor = (id) =>
	fetch(
		`https://www.goodreads.com/author/show/${id}?format=xml&key=${goodreadsApiKey}`
	)
		.then((res) => res.text())
		.then(parseXML)

const fetchBooks = (id) =>
	fetch(
		`https://www.goodreads.com/book/show/${id}?format=xml&key=${goodreadsApiKey}`
	)
		.then((res) => res.text())
		.then(parseXML)

const authorDataLoader = new DataLoader((keys) =>
	Promise.all(keys.map(fetchAuthor))
)

const booksDataLoader = new DataLoader((keys) =>
	Promise.all(keys.map(fetchBooks))
)

app.use(
	'/graphql',
	graphqlHttp((req) => ({
		schema,
		context: {
			authorDataLoader,
			booksDataLoader,
		},
		graphiql: true,
	}))
)
app.listen(4000)
console.log('Listening')
