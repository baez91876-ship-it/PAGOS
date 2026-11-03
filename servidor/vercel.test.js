import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import test from 'node:test'
import handler from '../api/index.js'

test('la configuración dirige todas las rutas a la función e incluye la página compilada', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.routes, [{ src: '/(.*)', dest: '/api/index.js' }])
  assert.equal(config.functions['api/index.js'].includeFiles, 'dist/**')
  assert.equal(config.outputDirectory, 'dist')
})

test('entrada de Vercel: configuración obligatoria y autenticación', async (t) => {
  const claves = ['MONGODB_URI', 'APP_USUARIO', 'APP_CLAVE']
  const originales = claves.map((clave) => process.env[clave])
  const servidor = createServer(handler)
  t.after(async () => {
    await new Promise((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()))
    claves.forEach((clave, i) => {
      if (originales[i] === undefined) delete process.env[clave]
      else process.env[clave] = originales[i]
    })
  })
  servidor.listen(0, '127.0.0.1')
  await once(servidor, 'listening')
  const base = `http://127.0.0.1:${servidor.address().port}`

  delete process.env.APP_CLAVE
  const log = t.mock.method(console, 'error', () => {})
  const sinConfig = await fetch(base + '/api/registros')
  assert.equal(sinConfig.status, 503)
  assert.equal(log.mock.callCount(), 1)
  log.mock.restore()

  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
  process.env.APP_USUARIO = 'prueba'
  process.env.APP_CLAVE = 'solo-para-test'
  assert.equal((await fetch(base + '/')).status, 401)
  assert.equal((await fetch(base + '/api/registros')).status, 401)
  const headers = { authorization: `Basic ${Buffer.from('prueba:solo-para-test').toString('base64')}` }
  assert.equal((await fetch(base + '/health', { headers })).status, 200)
  assert.equal((await fetch(base + '/api/inexistente', { headers })).status, 404)
})
