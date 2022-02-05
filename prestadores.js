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


// Create associado endpoint
app.post('/conveniados/:id/prestadores', async function (req, res) {
  const { nome, endereco, cpf, telefone, rg, dataNascimento} = req.body;
  const id = randomUUID();

  const conveniado = await getTable(req.params.id, process.env.CONVENIADOS_TABLE);

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nome: nome, 
      endereco: endereco, 
      cpf:cpf,
      telefone:telefone, 
      rg: rg, 
      dataNascimento: dataNascimento,
      idConveniado:idConveniado,
      nameConveniado: conveniado.Items[0].nomeFantasia,
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


// Atualizar prestadores endpoint
app.put('/prestadores/:id', function (req, res) {
  const { nome, endereco, cpf, telefone, rg, dataNascimento } = req.body;
  const id = req.params.id;

  const params = {
    TableName: TABLE,
    Item: {
      id : id,
      nome: nome, 
      endereco: endereco, 
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

// Obter agendamentos endpoint
app.get('/conveniados/:id/prestadores', function (req, res) {
  
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
      json({ error: 'Não foi possivel obter prestadores do conveniado '+req.params.id, detail: error });
    }
   
    if (result.Items) {
      res.status(200).json(result.Items);
    } else {
      res.status(404).json({ error: "Prestadores Não encontrados",  result: result });
    }
  });

})

module.exports.handler = serverless(app);