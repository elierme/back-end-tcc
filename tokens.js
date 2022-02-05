const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const TABLE = process.env.TOKENS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});


async function getTable(id, table){
  try {
      var params = {
          KeyConditionExpression: 'id = :id',
          ExpressionAttributeValues: {
              ':id': id
          },
          TableName: table
      };
      var result = await dynamoDb.query(params).promise()
      console.log(JSON.stringify(result))
      return result;
  } catch (error) {
      console.error(error);
  }
}

// Listar agendamentos endpoint
app.put('/tokens/:id', async function (req, res) {
  const { latitude, longitude } = req.body;

  const token = await getTable(req.params.id, TABLE);
  const atendimento = await getTable(token.Items[0].idAtendimento, process.env.ATENDIMENTOS_TABLE);

  if (token && atendimento) {

    const params = {
      TableName: TABLE,
      Item: {
        id: req.params.id,
        idAtendimento: atendimento.Items[0].id,
        confirmado: true,
      }
    }

    dynamoDb.put(params, (error) => {
      console.log("atualizando token");

      if (error) {
        console.log(error);
        res.status(400).json({ error: 'Não foi possivel atualizar token', detail: error });
      }      
    });

    var paramsAtendimentos = {
      TableName:process.env.ATENDIMENTOS_TABLE,
      Key:{
          "id": atendimento.Items[0].id,
          "data": atendimento.Items[0].data
      },
      UpdateExpression: "set confirmado = :confirmado, longitude=:longitude, latitude=:latitude",
      ExpressionAttributeValues:{
          ":confirmado": true,
          ":latitude":latitude,
          ":longitude":longitude
      }
  };

    dynamoDb.update(paramsAtendimentos, (error, data) => {
      console.log("atualizando atendimentos");
      if (error) {
        console.log(error);
        res.status(304).json({ error: 'Não foi possivel atualizar token', detail: error });
      } 
      
      res.status(200).json({});
    });

    console.log("fializando");
  }else{
    res.status(304).json({ error: "Token não encontrado" });
  }
})


module.exports.handler = serverless(app);