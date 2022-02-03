// index.js

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const TABLE = process.env.AGENDAMENTOS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar agendamentos endpoint
app.get('/agendamentos', function (req, res) {
  const params = {
    TableName: TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter agendamentos', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "agendamentos não encontrados",  result: result });
    }
  });
})



// Create associado endpoint
app.post('/agendamentos', function (req, res) {
  const { id, name, cpf, dataNascimento, rg, endereco, planoId, planoName, telefone} = req.body;

  const params = {
    TableName: TABLE,
    Item: req.body,
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar associado', detail: error });
    }
    res.status(201).json({ id, name });
  });
})

module.exports.handler = serverless(app);