# NASA APOD
### Links:
- Protótipo: [Figma Board](https://www.figma.com/design/nfth0BgxLP4YkgxUONMgQ0/Untitled?node-id=0-1&t=sC2LT7h3IOXKK5zN-1)

- Documentação da API: https://github.com/nasa/apod-api/blob/master/README.md
## Sobre o projeto

Página feita com HTML, CSS e JavaScript puro para consultar a Foto Astronômica do Dia da NASA. Permite buscar uma data, navegar para o dia anterior ou seguinte e sortear uma data do acervo.

## Consulta à API

A função `fetchApod`, no arquivo `main.js`, consulta:

```text
https://api.nasa.gov/planetary/apod?api_key=SUA_CHAVE&date=AAAA-MM-DD
```

A chave fica na constante `API_KEY`. O parâmetro `date` é opcional: sem ele, a API busca o conteúdo do dia. O campo de data permite consultar de 16/06/1995 até hoje. O cálculo de hoje e a navegação usam UTC.

A resposta é lida com `await response.json()`. Depois, `renderData` mostra título, explicação, data e mídia. Vídeos usam `url` em um `iframe`; imagens usam `hdurl`. O link HD e os créditos (`copyright`) aparecem quando esses campos existem.

Durante a consulta, os controles ficam desabilitados. O código trata erros de data inválida (400), limite de consultas (429) e outras falhas. O botão **Tentar novamente** repete a última consulta. A quantidade de consultas restantes é lida do cabeçalho `X-RateLimit-Remaining`, quando disponível.

### Correção da imagem da logo

Em algumas datas, a API antiga retorna a logo da NASA no campo `hdurl`. Quando esse endereço contém `nasa-logo`, o código faz uma consulta adicional ao novo serviço oficial:

```text
https://science.nasa.gov/wp-json/wp/v2/apod-basic/AAMMDD
```

Por exemplo, `2023-01-01` vira `230101`: o código remove os hífens e os dois primeiros dígitos do ano. Se a nova resposta trouxer um endereço HD preenchido e sem `nasa-logo`, ele substitui apenas `data.hdurl`. Os outros dados e a função de exibição continuam iguais. Se a recuperação falhar, a página mostra uma mensagem de erro.
