const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const { randomUUID } = require('crypto'); 	
const moment = require("moment");

AWS.config.update({region: 'us-west-2'});

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
  const { idAgendamento, idAssociado, idConveniado, idPrestador, idProcedimento, valor } = req.body;
  const id = randomUUID();

  const associado = await getTable(idAssociado, process.env.ASSOCIADOS_TABLE);
  const conveniado = await getTable(idConveniado, process.env.CONVENIADOS_TABLE);
  const prestador = await getTable(idPrestador, process.env.PRESTADORES_TABLE);
  const procedimento = await getTable(idProcedimento, process.env.PROCEDIMENTOS_TABLE);

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      data: moment().format("DD/MM/YYYY hh:mm:ss"), 
      idAgendamento: idAgendamento,     
      idAssociado: idAssociado, 
      nameAssociado: associado.Items[0].nome,
      idConveniado:idConveniado,
      nameConveniado: conveniado.Items[0].nomeFantasia,
      idPrestador:idPrestador,
      namePrestador: prestador.Items[0].nome,
      idPlano: associado.Items[0].planoId,
      planoName: associado.Items[0].planoName,
      idProcedimento: idProcedimento,
      procedimentoName: procedimento.Items[0].nome,
      valor: valor,
      confirmado: false
    },
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar atendimentos', detail: error });
    }
  });

  const idToken = randomUUID();

  const paramsToken = {
    TableName: process.env.TOKENS_TABLE,
    Item: {
      id : idToken,
      idAtendimento: id,
      confirmado: false,
    },
  };

  dynamoDb.put(paramsToken, (error, data) => {
    if (error) {
      console.log(error);
      res.status(422).json({ error: 'Não foi possivel criar token de atendimento', detail: error });
    }
  });


  // Create publish parameters
  var paramsSNS = {
    Message: 'Seu token de atendimento é '+idToken,
    PhoneNumber: associado.Items[0].telefone,
  };

  // Create promise and SNS service object
  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(paramsSNS).promise();

  // Handle promise's fulfilled/rejected states
  publishTextPromise.then(
    function(data) {
      console.log("MessageID is " + data.MessageId);
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });

    res.status(201).json({ id: id });
})


// Obter agendamentos endpoint
app.get('/conveniados/:id/atendimentos', function (req, res) {
  
  const params = {
    TableName: TABLE,
    FilterExpression: "#idConveniado = :idConveniado",
    ExpressionAttributeNames:{
        "#idConveniado": "idConveniado"
    },
    ExpressionAttributeValues: {
        ":idConveniado": req.params.id
    }
  }

  dynamoDb.scan(params, (error, result) => {
    
    if (error) {
      console.log(error);
      res.status(400).
      json({ error: 'Não foi possivel obter agendamentos do conveniado '+req.params.id, detail: error });
    }
   
    if (result.Items) {
      res.status(200).json(result.Items);
    } else {
      res.status(404).json({ error: "Agendamentos Não encontrados",  result: result });
    }
  });

})


// Obter agendamentos endpoint
app.get('/prestadores/:id/atendimentos', function (req, res) {
  
  const params = {
    TableName: TABLE,
    FilterExpression: "#idPrestador = :idPrestador",
    ExpressionAttributeNames:{
        "#idPrestador": "idPrestador"
    },
    ExpressionAttributeValues: {
        ":idPrestador": req.params.id
    }
  }

  dynamoDb.scan(params, (error, result) => {
    
    if (error) {
      console.log(error);
      res.status(400).
      json({ error: 'Não foi possivel obter agendamentos do prestador '+req.params.id, detail: error });
    }
   
    if (result.Items) {
      res.status(200).json(result.Items);
    } else {
      res.status(404).json({ error: "Agendamentos Não encontrados",  result: result });
    }
  });

})

module.exports.handler = serverless(app);