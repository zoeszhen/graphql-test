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

const BookType = new GraphQLObjectType({
	name: 'Book',
	description: '....',
	fields: () => ({
		title: {
			type: GraphQLString,
			resolve: (xml) => {
				console.log(
					'title',
					JSON.stringify(
						xml.GoodreadsResponse.author[0].books[0].book[0].title[0],
						null,
						2
					)
				)
				return xml.GoodreadsResponse.author[0].books[0].book[0].title[0]
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
