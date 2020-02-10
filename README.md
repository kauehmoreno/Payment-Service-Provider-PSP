# PSP - Payment-Service-Provider

API criada é responsável por simular transações PSP.
# Stack usada
  - Node.js
  - Redis
  - MongoDB
  - traefik
  - Nats.io
  - Worker in Node.js
  - Typescript
  
## Considerações do serviço
A api permite que seja criada uma transação a partir da rota `${host}/transaction` atráves de um método *POST* . Nesse posta consta as informações de transação + client + cartão de crédito responsável. Após todas as validações o serviço irá salvar o cartão e transação e irá enfileirar no broker a criação de um payable. Todas as regras são inferidas, regras de D+30 baseado no tipo de pagamento, cartão de crédito D+30, cartão de débito D+0. 
Há uma rota que é possível resgatar as transações por data `${host}/transaction/YYY-MM-DD`. Essa rota retornar apenas o id do cartão, para buscar o detalhe é preciso acessar `${host}/card/${id}` e o mesmo irá omitir retornar apenas os últimos quatros números do cartão. 

É possível resgatar um payable atráves do id da transação para verificar o detalhe, bem como, status, taxas e o valor final. Outra possibilidade é buscar um payable atráves do id do client e nesse irá retornar o balanço do mesmo.

obs: `Em caso de error ao criar um payable em background, irá entrar em backoff e será enfileirado num topic de error após todas as tentativas e retentará a operação depois`

`${host}/payable/transaction/${transactionId}` - payable transaction details
`${host}/payable/client/${clientId}` - client balance 

Foi usado como estratégia do serviço o conceito de cache ativo, a cada criação a chave de cache é criada e resetada para mantar o dado em cache sempre update. Foi usado o conceito de eventos para trigar essas ações.
### Setup do projeto

Instalação das dependências e execução do projeto
```sh
$ npm i
$ npm run-script build
$ npm start
```
Para execução dos testes

```sh
$ npm test
```

### Rotas

`obs: As rotas de get acessadas via browser podem ser acessadas usando http://api.localhost/` 

##### Criação de uma transação:
##### Rota: `http://locahost:8000/transaction`
 
Payload body
```json
{
    "description": "Smartband XYZ 3.0",
    "value":100,
    "paymentMethod":"credit_card",
    "clientId":"5e3cab9312a74989abca6e52",
    "card":{
        "number":"5390255998612466",
        "name":"KAUEH MORENO A R",
        "expireAt":"07/2025",
        "cvv":894
    }
}
```
#### Resposta (200)

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": {
      "transactionId": "5e3dc9b23cb70f001db39b51",
      "status": "created"
    }
  }
}
```

#### Resposta (400)

obs: `caso o body esteja invalido por algum mótivo ou falhe alguma validação: número de cartão de crédito inválido`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "invalid body request"
  }
}
```

#### Resposta (500)

obs: `Em caso de erro interno`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "something got wrong"
  }
}
```

##### Listar transação por data:
##### Rota: `http://locahost:8000/transaction/${YYY-MM-DD}`

#### Resposta (200)
```json
{
  "acessDate": "2020-02-07T20:37:36.267Z",
  "result": {
    "data": [
      {
        "_id": "5e3dc0ff3cb70f001db39b4f",
        "createdAt": "2020-02-07T19:56:47.176Z",
        "cardId": "5e3dc0ff3cb70f001db39b50",
        "clientId": "5e3cab9312a74989abca6e52",
        "description": "Smartband XYZ 3.0",
        "value": 100,
        "method": "credit_card"
      },
      {
        "_id": "5e3dc9b23cb70f001db39b51",
        "createdAt": "2020-02-07T20:33:54.825Z",
        "cardId": "5e3dc9b23cb70f001db39b52",
        "clientId": "5e3cab9312a74989abca6e52",
        "description": "Smartband XYZ 3.0",
        "value": 100,
        "method": "credit_card"
      },
      {
        "_id": "5e3dca8e3cb70f001db39b53",
        "createdAt": "2020-02-07T20:37:34.758Z",
        "cardId": "5e3dca8e3cb70f001db39b54",
        "clientId": "5e3cab9312a74989abca6e52",
        "description": "Smartband XYZ 3.0",
        "value": 130,
        "method": "credit_card"
      }
    ]
  }
}
```

#### Resposta (400)

obs: `caso a data passada seja inválida`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "invalid request params"
  }
}
```

#### Resposta (500)

obs: `Em caso de erro interno`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "something got wrong"
  }
}
```

##### Detalhe de um cartão de crédito:
##### Rota: `http://locahost:8000/card/${cardId}`

#### Resposta (200)
```json
{
  "acessDate": "2020-02-07T20:39:53.428Z",
  "result": {
    "data": {
      "_id": "5e3dc0ff3cb70f001db39b50",
      "num": "2466",
      "name": "KAUEH MORENO A R",
      "expireAt": "07/2025",
      "cvv": 894
    }
  }
}
```

#### Resposta (400)

obs: `caso a data passada seja inválida`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "invalid request params"
  }
}
```

#### Resposta (500)

obs: `Em caso de erro interno`

```json
{
  "acessDate": "2020-02-07T20:33:54.839Z",
  "result": {
    "data": null,
    "error": "something got wrong"
  }
}
```

##### Detalhe de um pagável de uma transação:
##### Rota: `http://locahost:8000/payable/transaction/${transactionId}`
#### Resposta (200)

```json
{
  "acessDate": "2020-02-07T20:41:55.559Z",
  "result": {
    "data": {
      "_id": "5e3dc0ffff508d001d38cf27",
      "transactionId": "5e3dc0ff3cb70f001db39b4f",
      "status": "waiting_funds",
      "createdAt": "2020-02-07T19:56:47.226Z",
      "total": 95,
      "taxes": 0.05,
      "payableAt": "2020-03-08T19:56:47.226Z"
    }
  }
}
```

obs: `Em caso de erros 400 e 500 segue o mesmo padrão acima``

##### Balanço de um client
##### Rota: `http://locahost:8000/payable/client/${clientId}`
#### Resposta (200)

```json
{
  "acessDate": "2020-02-07T20:43:04.598Z",
  "result": {
    "data": {
      "available": 126.1,
      "waitingFunds": 313.5
    }
  }
}
```

obs: `Em caso de erros 400 e 500 segue o mesmo padrão acima``


#### Obs: `O projeto roda com docker e usa pm2 para executar ambos api e worker`


### TODO

- Finalizar testes de alguns handlers. O não termino deles foi propósital, pois dado o próposito foi garantido bons coverages mas não todos e nem tudo. :) 


[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)


   [dill]: <https://github.com/joemccann/dillinger>
   [git-repo-url]: <https://github.com/joemccann/dillinger.git>
   [john gruber]: <http://daringfireball.net>
   [df1]: <http://daringfireball.net/projects/markdown/>
   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [Ace Editor]: <http://ace.ajax.org>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [@tjholowaychuk]: <http://twitter.com/tjholowaychuk>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>
   [Gulp]: <http://gulpjs.com>

   [PlDb]: <https://github.com/joemccann/dillinger/tree/master/plugins/dropbox/README.md>
   [PlGh]: <https://github.com/joemccann/dillinger/tree/master/plugins/github/README.md>
   [PlGd]: <https://github.com/joemccann/dillinger/tree/master/plugins/googledrive/README.md>
   [PlOd]: <https://github.com/joemccann/dillinger/tree/master/plugins/onedrive/README.md>
   [PlMe]: <https://github.com/joemccann/dillinger/tree/master/plugins/medium/README.md>
   [PlGa]: <https://github.com/RahulHP/dillinger/blob/master/plugins/googleanalytics/README.md>
