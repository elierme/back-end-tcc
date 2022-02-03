const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const TABLE = process.env.ASSOCIADOS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar associados endpoint
app.get('/associados', function (req, res) {
  const params = {
    TableName: TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter associados', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "Associados Não encontrados",  result: result });
    }
  });
})



// Create associado endpoint
app.post('/associados', function (req, res) {
  const { id } = req.body;

  const params = {
    TableName: TABLE,
    Item: req.body,
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar associado', detail: error });
    }
    res.status(201).json({ id });
  });
})

module.exports.handler = serverless(app);