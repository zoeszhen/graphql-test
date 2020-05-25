const fetch = require('node-fetch')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)
const {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLInt,
	GraphQLString,
	GraphQLList,
} = require('graphql')

function translate(lang, str) {
	// Google Translate API is a paid (but dirt cheap) service. This is my key
	// and will be disabled by the time the video is out. To generate your own,
	// go here: https://cloud.google.com/translate/v2/getting_started
	const apiKey = 'AIzaSyApv1hai60CJU9pH9aL-iG8M7HTCNeu3aM'
	const url =
		'https://www.googleapis.com' +
		'/language/translate/v2' +
		'?key=' +
		apiKey +
		'&source=en' +
		'&target=' +
		lang +
		'&q=' +
		encodeURIComponent(str)
	return fetch(url)
		.then((response) => response.json())
		.then((parsedResponse) => {
			console.log('parsedResponse', JSON.stringify(parsedResponse, null, 2))
			return parsedResponse.data.translations[0].translatedText
		})
}

const BookType = new GraphQLObjectType({
	name: 'Book',
	description: '....',
	fields: () => ({
		title: {
			type: GraphQLString,
			args: {
				lang: {
					type: GraphQLString,
				},
			},
			resolve: (xml, args) => {
				const title = xml.GoodreadsResponse.author[0].books[0].book[0].title[0]
				return args.lang ? translate(args.lang, title) : title
			},
		},
		isbn: {
			type: GraphQLString,
			resolve: (xml) => {
				return xml.GoodreadsResponse.author[0].book[0].isbn[0]
			},
		},
	}),
})
const AuthorType = new GraphQLObjectType({
	name: 'Author',
	description: '....',
	fields: () => ({
		name: {
			type: GraphQLString,
			resolve: (xml) => xml.GoodreadsResponse.author[0].name[0],
		},
		books: {
			type: new GraphQLList(BookType),
			resolve: (xml) => {
				const ids = xml.GoodreadsResponse.author[0].books[0].book.map(
					(e) => e.id[0]._
				)
				return Promise.all(
					ids.map((id) =>
						fetch(
							`https://www.goodreads.com/author/show/${id}?format=xml&key=4Dcpedwv5C2GzVdj3dRymA`
						)
							.then((res) => res.text())
							.then(parseXML)
					)
				)
			},
		},
	}),
})
module.exports = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		description: '...',
		fields: () => ({
			author: {
				type: AuthorType,
				args: {
					id: { type: GraphQLInt },
				},
				resolve: (root, args) =>
					fetch(
						`https://www.goodreads.com/author/show/${args.id}?format=xml&key=4Dcpedwv5C2GzVdj3dRymA`
					)
						.then((res) => res.text())
						.then(parseXML),
			},
		}),
	}),
})
