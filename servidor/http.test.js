import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { crearServidor } from './http.js'

test('el servidor exige credenciales configuradas', () => {
  assert.throws(() => crearServidor({ usuario: '', clave: '' }), /APP_USUARIO/)
  assert.throws(() => crearServidor({ usuario: 'no:valido', clave: 'prueba' }), /APP_USUARIO/)
})

test('servidor de producción: salud, autenticación, página y API', async (t) => {
  const carpeta = await mkdtemp(join(tmpdir(), 'pagos-http-'))
  await writeFile(join(carpeta, 'index.html'), '<h1>PAGOS</h1>')
  await writeFile(join(carpeta, 'app.js'), 'console.log("PAGOS")')
  const llamadas = []
  const servidor = crearServidor({
    usuario: 'prueba',
    clave: 'solo-para-test',
    carpeta,
    api: async (req, res) => {
      llamadas.push({ metodo: req.method, ruta: req.url })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    },
  })
  t.after(async () => {
    await new Promise((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()))
    await rm(carpeta, { recursive: true })
  })
  servidor.listen(0, '127.0.0.1')
  await once(servidor, 'listening')
  const origen = `http://127.0.0.1:${servidor.address().port}`
  const authorization = `Basic ${Buffer.from('prueba:solo-para-test').toString('base64')}`
  const pedir = (ruta, opciones = {}) => fetch(origen + ruta, {
    ...opciones,
    headers: { authorization, ...opciones.headers },
  })

  await t.test('la comprobación de salud no revela datos ni requiere acceso', async () => {
    const res = await fetch(origen + '/health')
    assert.equal(res.status, 200)
    assert.equal(await res.text(), 'ok')
  })
  await t.test('protege tanto la página como la API', async () => {
    for (const ruta of ['/', '/api/registros']) {
      for (const headers of [{}, { authorization: 'Basic incorrecto' }]) {
        const res = await fetch(origen + ruta, { headers })
        assert.equal(res.status, 401)
        assert.match(res.headers.get('www-authenticate'), /^Basic /)
      }
    }
    assert.equal(llamadas.length, 0)
  })
  await t.test('sirve HTML, JavaScript y HEAD con credenciales correctas', async () => {
    const pagina = await pedir('/')
    assert.equal(pagina.status, 200)
    assert.match(pagina.headers.get('content-type'), /text\/html/)
    assert.equal(pagina.headers.get('cache-control'), 'no-store')
    assert.equal(await pagina.text(), '<h1>PAGOS</h1>')
    const script = await pedir('/app.js')
    assert.equal(script.status, 200)
    assert.match(script.headers.get('content-type'), /text\/javascript/)
    const head = await pedir('/', { method: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
  })
  await t.test('delega todas las operaciones en la API existente', async () => {
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
      const res = await pedir('/api/registros/ejemplo', { method, headers: { origin: origen } })
      assert.equal(res.status, 200)
      assert.deepEqual(await res.json(), { ok: true })
    }
    assert.deepEqual(llamadas.map((llamada) => llamada.metodo), ['GET', 'POST', 'PATCH', 'DELETE'])
  })
  await t.test('impide escrituras desde otra página aunque se envíen credenciales', async () => {
    for (const method of ['POST', 'PATCH', 'DELETE']) {
      const res = await pedir('/api/registros', { method, headers: { origin: 'https://otro.example' } })
      assert.equal(res.status, 403)
    }
    assert.equal(llamadas.length, 4)
  })
  await t.test('no expone archivos externos ni rutas inexistentes', async () => {
    assert.equal((await pedir('/%2e%2e%2f.env.local')).status, 403)
    assert.equal((await pedir('/%00')).status, 403)
    assert.equal((await pedir('/%ZZ')).status, 400)
    assert.equal((await pedir('/inexistente.js')).status, 404)
    assert.equal((await pedir('/api/registros-falso')).status, 404)
    assert.equal((await pedir('/', { method: 'POST' })).status, 405)
  })
})
