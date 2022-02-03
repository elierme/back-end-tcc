const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const { randomUUID } = require('crypto'); 


const TABLE = process.env.ATENDIMENTOS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', '*');
  next();
  
});

// Listar atendimentos endpoint
app.get('/atendimentos', function (req, res) {
  const params = {
    TableName: TABLE
  }

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Não foi possivel obter atendimentos', detail: error });
    }
    if (result.Items) {
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "atendimentos Não encontrados",  result: result });
    }
  });
})


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

// Create atendimentos endpoint
app.post('/atendimentos', async function (req, res) {
  const { data, idAssociado, idConveniado, idPrestador, valor } = req.body;
  const id = randomUUID();

  const associado = await getTable(idAssociado, process.env.ASSOCIADOS_TABLE);
  const conveniado = await getTable(idConveniado, process.env.CONVENIADOS_TABLE);
  const prestador = await getTable(idPrestador, process.env.PRESTADORES_TABLE);

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      data: data, 
      idAssociado: idAssociado, 
      nameAssociado: associado.Items[0].nome,
      idConveniado:idConveniado,
      nameConveniado: conveniado.Items[0].nomeFantasia,
      idPrestador:idPrestador,
      namePrestador: prestador.Items[0].nome,
      idPlano: associado.Items[0].planoId,
      planoName: associado.Items[0].planoName,
      valor: valor
    },
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar atendimentos', detail: error });
    }
    res.status(201).json({ data });
  });
})


module.exports.handler = serverless(app);