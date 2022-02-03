const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const { randomUUID } = require('crypto'); 


const TABLE = process.env.CONVENIADOS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar conveniados endpoint
app.get('/conveniados', function (req, res) {
  const params = {
    TableName: TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter conveniados', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "conveniados Não encontrados",  result: result });
    }
  });
})



// Create conveniados endpoint
app.post('/conveniados', function (req, res) {
  const { nomeFantasia, razaoSocial, endereco, cnpj, telefone } = req.body;
  const id = randomUUID();

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nomeFantasia: nomeFantasia, 
      razaoSocial: razaoSocial, 
      endereco: endereco, 
      cnpj: cnpj, 
      telefone:telefone, 
      telefone: telefone
    },
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar conveniados', detail: error });
    }
    res.status(201).json({ data });
  });
})


app.put('/conveniados/:id', function (req, res) {
  const { nomeFantasia, razaoSocial, endereco, cnpj, telefone } = req.body;
  const id = req.params.id;

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nomeFantasia: nomeFantasia, 
      razaoSocial: razaoSocial, 
      endereco: endereco, 
      cnpj: cnpj, 
      telefone:telefone, 
      telefone: telefone
    },
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar conveniados', detail: error });
    }
    res.status(201).json({ data });
  });
})



module.exports.handler = serverless(app);