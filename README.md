# prlib-iiif-proxy

Proxy which makes documents of Boris Yeltsin Presidential Library available from IIIF client

## Usage

```bash
deno task start # start proxy server
curl http://localhost:3000/manifest/1395338 # fetch IIIF manifest for https://www.prlib.ru/item/1395338
```

Note: the endpoint `/manifest/:id` implements [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/).
