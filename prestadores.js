const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const { randomUUID } = require('crypto'); 


const TABLE = process.env.PRESTADORES_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar prestadores endpoint
app.get('/prestadores', function (req, res) {
  const params = {
    TableName: TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter prestadores', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "prestadores Não encontrados",  result: result });
    }
  });
})


// Create associado endpoint
app.post('/prestadores', function (req, res) {
  const { nome, endereco, planoName, cpf, telefone, rg, dataNascimento } = req.body;
  const id = randomUUID();

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nome: nome, 
      endereco: endereco, 
      planoName: planoName, 
      cpf:cpf,
      telefone:telefone, 
      rg: rg, 
      dataNascimento: dataNascimento
    },
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar prestadores', detail: error });
    }
    res.status(201).json({ data });
  });
})


// Create associado endpoint
app.put('/prestadores/:id', function (req, res) {
  const { nome, endereco, planoName, cpf, telefone, rg, dataNascimento } = req.body;
  const id = req.params.id;

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nome: nome, 
      endereco: endereco, 
      planoName: planoName, 
      cpf:cpf,
      telefone:telefone, 
      rg: rg, 
      dataNascimento: dataNascimento
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel atualizar prestador', detail: error });
    }
    res.status(201).json({ id });
  });
})

module.exports.handler = serverless(app);