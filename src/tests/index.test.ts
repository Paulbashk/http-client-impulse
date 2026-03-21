import { test, describe } from 'node:test'
import assert from 'node:assert'
import create from '../index.js'
import nock from 'nock'

describe('CONFIG CREATE', () => {
    test('Проверка верной конкатинации baseURL + URL', async (t) => {
        const baseURL = 'http://localhost:3000/api/'
        const url = 'users'
        const expectedUrl = new URL(url, baseURL)

        const mock = nock('http://localhost:3000')
            .get('/api/users')
            .reply(200, {})

        const impulse = create({ baseURL })

        const response = await impulse.get(url)
        
        //t.diagnostic(response.url)

        assert.strictEqual(response.url, expectedUrl.toString())
        assert.ok(mock.isDone())
    })
})

describe('HTTP GET', () => { 
    test('GET запрос с пустым URL значением должен вызвать ошибку', async () => {
        const impulse = create()

        try {
            await impulse.get('')
            assert.fail('Ожидалась ошибка при пустом URL')
        } catch(err: unknown) {
            if(err instanceof Error) {
                assert.ok(err.message.includes('Invalid'))
            } else {
                assert.fail('Ошибка не является объектом Error')
            }
        }
    })

    test('GET запрос', async () => {
        const impulse = create()

        const response = await impulse.get('https://jsonplaceholder.typicode.com/users')
        
        assert.strictEqual(response.status, 200)
    })

    test('GET запрос с option params', async () => {
        const impulse = create()

        const response = await impulse.get('https://jsonplaceholder.typicode.com/users', {
            params: {
                id: 10
            }
        })
        
        assert.strictEqual(response.status, 200)
    })
})

describe('HTTP POST', () => { 
    test('POST запрос только с url (data по умолчанию = null), не должен приводить к функциональной ошибке', async () => {
        const impulse = create()

        const response = await impulse.post('https://jsonplaceholder.typicode.com/users')
        
        assert.strictEqual(response.status, 201)
    })

    test('POST запрос c data', async () => {
        const impulse = create()

        const response = await impulse.post('https://jsonplaceholder.typicode.com/users', {
            name: 'John Smit'
        })
        
        assert.strictEqual(response.status, 201)
    })

    test('POST запрос c data = null не должен приводить к функциональной ошибке', async () => {
        const impulse = create()

        const response = await impulse.post('https://jsonplaceholder.typicode.com/users', null)
        
        assert.strictEqual(response.status, 201)
    })
})

describe('HTTP PUT', () => { 
    test('PUT запрос только с url (data по умолчанию = null), не должен приводить к функциональной ошибке', async () => {
        const impulse = create()

        const response = await impulse.put('https://jsonplaceholder.typicode.com/users/1')
        
        assert.strictEqual(response.status, 200)
    })

    test('PUT запрос c data', async () => {
        const impulse = create()

        const response = await impulse.put('https://jsonplaceholder.typicode.com/users/1', {
            name: 'John Smit'
        })
        
        assert.strictEqual(response.status, 200)
    })

    test('PUT запрос c data = null не должен приводить к функциональной ошибке', async () => {
        const impulse = create()

        const response = await impulse.put('https://jsonplaceholder.typicode.com/users/1', null)
        
        assert.strictEqual(response.status, 200)
    })
})

describe('HTTP DELETE', () => { 
    test('DELETE запрос', async () => {
        const impulse = create()

        const response = await impulse.delete('https://jsonplaceholder.typicode.com/users/1')
        
        assert.strictEqual(response.status, 200)
    })
})