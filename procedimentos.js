const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const TABLE = process.env.PROCEDIMENTOS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar agendamentos endpoint
app.get('/planos/:id/procedimentos', function (req, res) {
  const params = {
    TableName: TABLE,
    FilterExpression: "#idPlano = :idPlano",
    ExpressionAttributeNames:{
        "#idPlano": "idPlano"
    },
    ExpressionAttributeValues: {
        ":idPlano": req.params.id
    }
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter procedimentos', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "procedimentos não encontrados",  result: result });
    }
  });
})


module.exports.handler = serverless(app);