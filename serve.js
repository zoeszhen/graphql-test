const express = require("express")
const graphqlHttp = require("express-graphql")
const app = express()
const schema = require("./schema")
app.use("/graphql",graphqlHttp({
    schema,
    graphiql: true
}))
app.listen(4000)
console.log("Listening")